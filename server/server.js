const express = require("express");
const { exec } = require("child_process");
const os = require("os");
const https = require("https");
const http = require("http");
const tls = require("tls");
const fs = require("fs");
const path = require("path");
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const app = express();
app.use(express.json());
const PORT = 3001;
const CONFIG_PATH = path.join(__dirname, "config.json");
const USE_HTTPS = process.env.USE_HTTPS !== 'false';

const safeReadConfig = () => {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    try {
        const content = fs.readFileSync(CONFIG_PATH, 'utf8').trim();
        if (!content) return {};
        const cleanContent = content.startsWith('\uFEFF') ? content.slice(1) : content;
        return JSON.parse(cleanContent);
    } catch (err) {
        console.error(`[server] config.json parse error: ${err.message}`);
        return null;
    }
};

// Allow CORS if needed, or rely on Vite proxy
app.use((req, res, next) => {
    console.log(`[server] ${req.method} ${req.url}`);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const getNetworkIPs = () => {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
};

app.get("/api/services", (req, res) => {
    const query = `Get-WmiObject Win32_Service | Select-Object Name, DisplayName, PathName, State | ConvertTo-Json`;
    exec(`powershell -Command "${query}"`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error("Exec error:", error);
            return res.status(500).send(error.message);
        }
        try {
            if (!stdout.trim()) return res.json([]);
            const services = JSON.parse(stdout);
            res.json(Array.isArray(services) ? services : [services]);
        } catch (err) {
            console.error("JSON Parse Error:", err);
            res.status(500).send("Parsing error");
        }
    });
});

app.post("/api/services/status", (req, res) => {
    const names = req.body.names;
    if (!names || !Array.isArray(names) || names.length === 0) {
        return res.json([]);
    }

    // Safely construct a comma-separated list of names wrapped in quotes
    const escapedNames = names.map(n => `'${n.replace(/'/g, "''")}'`).join(",");
    const query = `Get-Service -Name ${escapedNames} -ErrorAction SilentlyContinue | Select-Object Name, @{Name='State';Expression={$_.Status.ToString()}} | ConvertTo-Json`;

    exec(`powershell -Command "${query}"`, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        try {
            if (!stdout.trim()) return res.json([]);
            const services = JSON.parse(stdout);
            res.json(Array.isArray(services) ? services : [services]);
        } catch (err) {
            console.error("JSON Parse Error in /api/services/status:", err);
            res.status(500).send("Parsing error");
        }
    });
});

app.post("/api/services/action", (req, res) => {
    const { name, action } = req.body;
    if (!name || !['start', 'stop', 'restart'].includes(action)) {
        return res.status(400).json({ error: "Invalid action or missing name" });
    }

    const safeName = name.replace(/'/g, "''");
    const psAction = action === 'start' ? 'Start-Service' : action === 'restart' ? 'Restart-Service' : 'Stop-Service';
    const command = `${psAction} -Name '${safeName}'`;

    exec(`powershell -Command "${command}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Service Action Error (${action} on ${name}):`, error.message, stderr);
            return res.status(500).json({ error: error.message || stderr });
        }
        res.json({ success: true });
    });
});

app.get("/api/config", (req, res) => {
    console.log("[server] GET /api/config reached");
    const config = safeReadConfig();
    if (config === null) {
        return res.status(500).send("Error reading configuration: Invalid JSON format");
    }
    res.json(config);
});

app.get("/api/admin/check", (req, res) => {
    // Determine admin status using Windows command `net session` (fails if not elevated)
    exec("net session", (error) => {
        res.json({ isAdmin: !error });
    });
});

app.post("/api/config", (req, res) => {
    console.log("[server] POST /api/config reached");
    const config = req.body;

    // Ensure parent directory for config exists
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        console.log(`[server] Config updated and saved to ${CONFIG_PATH}`);

        // Refresh auto-renewal task dynamically based on the updated config
        if (typeof startAutoRenewCheck === 'function') {
            startAutoRenewCheck();
        }

        res.json({ success: true });
    } catch (err) {
        console.error("[server] Error writing config:", err);
        res.status(500).json({ error: "Failed to write config" });
    }
});

app.post("/api/certs/generate", (req, res) => {
    const { force } = req.body;
    console.log(`[server] Triggering certificate generation (Force: ${force || false})...`);
    const scriptPath = path.join(__dirname, "scripts", "ensure-certs.ps1");
    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"${force ? " -Force" : ""}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("[server] Cert generation error:", error);
            return res.status(500).json({ error: error.message, stderr });
        }
        console.log("[server] Cert generation output:", stdout);
        res.json({ success: true, output: stdout });
    });
});

app.get("/api/certs/status", (req, res) => {
    const pfxPath = path.join(__dirname, "certs", "cert.pfx");
    if (!fs.existsSync(pfxPath)) {
        return res.json({ hasCert: false });
    }

    let passphrase = "password";
    const config = safeReadConfig();
    if (config && config.certPassword) {
        passphrase = config.certPassword;
    } else if (config === null) {
        console.error("[server] Failed to parse config.json for status status.");
    }

    // Use EncodedCommand to avoid quoting/interpolation issues with special characters in passwords
    const psScript = `
        $pfxPath = '${pfxPath.replace(/'/g, "''")}'
        $password = '${passphrase.replace(/'/g, "''")}'
        try {
            $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, $password)
            $now = Get-Date
            $remaining = ($cert.NotAfter - $now).TotalDays
            $data = @{
                hasCert = $true
                expiry = $cert.NotAfter.ToString('yyyy-MM-dd HH:mm:ss')
                issuer = $cert.Issuer
                subject = $cert.Subject
                thumbprint = $cert.Thumbprint
                daysRemaining = [Math]::Round($remaining)
                isValid = $remaining -gt 0
            }
            $data | ConvertTo-Json -Compress
        } catch {
            @{ hasCert = $true; error = $_.Exception.Message; isValid = $false } | ConvertTo-Json -Compress
        }
    `;

    const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');

    exec(`powershell -EncodedCommand ${encodedScript}`, (error, stdout, stderr) => {
        console.log("[server] [DEBUG] Raw PowerShell stdout:", stdout);
        if (error) {
            console.error("[server] Cert status execution error:", error);
            return res.status(500).json({ error: error.message, details: stderr });
        }
        try {
            const trimmedStdout = stdout.trim();
            if (!trimmedStdout) {
                return res.status(500).json({ error: "Empty response from cert engine" });
            }

            // Extract the JSON part if there is any clutter (like BOM or extra newlines)
            const firstBrace = trimmedStdout.indexOf('{');
            const lastBrace = trimmedStdout.lastIndexOf('}');
            if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
                console.error("[server] No JSON object found in output:", trimmedStdout);
                return res.status(500).json({ error: "Invalid response format [v3]", raw: trimmedStdout });
            }

            const jsonPart = trimmedStdout.substring(firstBrace, lastBrace + 1);
            res.json(JSON.parse(jsonPart));
        } catch (err) {
            console.error("[server] [DEBUG] Parse error:", err);
            res.status(500).json({ error: "Failed to parse cert info [v3]", raw: stdout });
        }
    });
});

const getMetadataPath = () => {
    // Legacy support or internal use (currently points to same root or data dir)
    return path.join(__dirname, 'data', 'metadata.json');
};

// Serve static files from the React app
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send("Frontend build not found. Run 'npm run build' or use 'npm run dev'.");
        }
    });
} else {
    console.log("[server] 'dist' folder not found. Serving as API-only mode.");
    app.get('*', (req, res) => {
        res.status(404).json({ error: "API route not found", path: req.url });
    });
}

const protocol = USE_HTTPS ? "https" : "http";
const pfxPath = path.join(__dirname, "certs", "cert.pfx");
const hasPfx = fs.existsSync(pfxPath);

if (USE_HTTPS && hasPfx) {
    let passphrase = "password";
    const config = safeReadConfig();
    if (config && config.certPassword) {
        passphrase = config.certPassword;
    } else if (config === null) {
        console.error("[server] CRITICAL: Failed to read config.json for passphrase. This may cause SSL startup failure.");
    }

    let secureContext = null;
    const reloadSecureContext = () => {
        try {
            let currentPassphrase = passphrase;
            const freshConfig = safeReadConfig();
            if (freshConfig && freshConfig.certPassword) {
                currentPassphrase = freshConfig.certPassword;
            }
            if (fs.existsSync(pfxPath)) {
                secureContext = tls.createSecureContext({
                    pfx: fs.readFileSync(pfxPath),
                    passphrase: currentPassphrase
                });
                console.log("[server] SSL Secure Context successfully loaded/reloaded.");
            }
        } catch (err) {
            console.error("[server] Failed to load/reload SSL Secure Context:", err);
        }
    };
    reloadSecureContext();

    // Watch the certificate file so we can hot-reload without restarting the node server
    fs.watchFile(pfxPath, (curr, prev) => {
        if (curr.mtimeMs !== prev.mtimeMs) {
            console.log("[server] Detected cert.pfx change. Reloading SSL context in 1s...");
            setTimeout(() => {
                reloadSecureContext();
                // If running in dev mode, force Vite to restart so the frontend proxy gets the new certificate
                const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
                if (fs.existsSync(viteConfigPath)) {
                    try {
                        const now = new Date();
                        fs.utimesSync(viteConfigPath, now, now);
                        console.log("[server] Triggered Vite Dev Server restart to sync SSL certs.");
                    } catch (e) {
                        console.error("[server] Failed to trigger Vite restart:", e);
                    }
                }
            }, 1000); // 1s delay to let writers release locks
        }
    });

    const options = {
        SNICallback: (domain, cb) => {
            if (secureContext) {
                cb(null, secureContext);
            } else {
                cb(new Error("No secure context setup"));
            }
        }
    };
    https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
        printServerStarted("https");
    });
} else {
    if (USE_HTTPS && !hasPfx) {
        console.warn(`[server] HTTPS requested (USE_HTTPS=true) but ${pfxPath} not found. Falling back to HTTP.`);
    }
    http.createServer(app).listen(PORT, "0.0.0.0", () => {
        printServerStarted("http");
    });
}

// Background Certificate Maintenance
let autoRenewInterval = null;
const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

function runCertRenewalCheck() {
    console.log("[server] [Background] Checking certificate for auto-renewal...");
    const scriptPath = path.join(__dirname, "scripts", "ensure-certs.ps1");
    // Standard run (no -Force) lets the script check the daysRemaining and autoRenewCert toggle
    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("[server] [Background] Auto-renewal check failed:", error.message);
            if (stderr) console.error("[server] [Background] Stderr:", stderr);
        } else {
            console.log("[server] [Background] Auto-renewal check completed.");
            if (stdout.trim()) console.log("[server] [Background] Result:", stdout.trim());
        }
    });
}

function startAutoRenewCheck() {
    if (autoRenewInterval) {
        clearInterval(autoRenewInterval);
        autoRenewInterval = null;
    }

    let autoRenew = true;
    const config = safeReadConfig();
    if (config && config.autoRenewCert === false) {
        autoRenew = false;
    }

    if (!autoRenew) {
        console.log("[server] [Background] Certificate auto-renewal is INACTIVE.");
        return;
    }

    console.log("[server] [Background] Certificate auto-renewal is ACTIVE. Background timer scheduled (runs every 15 minutes).");
    autoRenewInterval = setInterval(runCertRenewalCheck, CHECK_INTERVAL);
}

// Start immediately on sever boot
startAutoRenewCheck();

function printServerStarted(protocol) {
    console.log("");
    console.log(`  \x1b[36m➜\x1b[0m  \x1b[1mUptimeSHIELD Server Started\x1b[22m`);

    const endpoints = [];
    endpoints.push({ Name: "Local UI", URL: `${protocol}://localhost:${PORT}/` });

    const networkIPs = getNetworkIPs();
    networkIPs.forEach(ip => {
        endpoints.push({ Name: `Network UI (${ip})`, URL: `${protocol}://${ip}:${PORT}/` });
    });

    endpoints.push({ Name: "API Services", URL: `${protocol}://localhost:${PORT}/api/services` });
    endpoints.push({ Name: "API Config", URL: `${protocol}://localhost:${PORT}/api/config` });
    endpoints.push({ Name: "API Cert Status", URL: `${protocol}://localhost:${PORT}/api/certs/status` });

    console.table(endpoints);
}
