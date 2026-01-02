const express = require("express");
const { exec } = require("child_process");
const os = require("os");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const app = express();
const PORT = 3001;
const USE_HTTPS = process.env.USE_HTTPS !== 'false';

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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

const protocol = USE_HTTPS ? "https" : "http";
const pfxPath = path.join(__dirname, "certs", "cert.pfx");
const hasPfx = fs.existsSync(pfxPath);

if (USE_HTTPS && hasPfx) {
    const options = {
        pfx: fs.readFileSync(pfxPath),
        passphrase: "password"
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

function printServerStarted(protocol) {
    console.log("");
    console.log(`  \x1b[36m➜\x1b[0m  \x1b[1mLocal:\x1b[22m   \x1b[36m${protocol}://localhost:${PORT}/\x1b[0m`);
    const networkIPs = getNetworkIPs();
    networkIPs.forEach(ip => {
        console.log(`  \x1b[36m➜\x1b[0m  \x1b[1mNetwork:\x1b[22m \x1b[36m${protocol}://${ip}:${PORT}/\x1b[0m`);
    });
    console.log(`  \x1b[36m➜\x1b[0m  \x1b[1mAPI Services:\x1b[22m \x1b[36m${protocol}://localhost:${PORT}/api/services\x1b[0m`);
}
