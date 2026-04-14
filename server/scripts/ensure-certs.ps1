param(
    [switch]$Force = $false
)

$certDir = "server/certs"
$pfxPath = "$certDir/cert.pfx"
$validityDays = 365
$renewalThresholdDays = 30

if (-not (Test-Path $certDir)) {
    Write-Host "[certs] Creating directory: $certDir" -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $certDir
}

function New-StrongPassword {
    $lower = "abcdefghijklmnopqrstuvwxyz"
    $upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    $nums = "0123456789"
    $syms = "!@#$%^&*()_+"
    $all = $lower + $upper + $nums + $syms
    $pass = ""
    $pass += $upper[(Get-Random -Maximum $upper.Length)]
    $pass += $nums[(Get-Random -Maximum $nums.Length)]
    $pass += $syms[(Get-Random -Maximum $syms.Length)]
    for ($i = 0; $i -lt 13; $i++) { $pass += $all[(Get-Random -Maximum $all.Length)] }
    $passArray = $pass.ToCharArray()
    for ($i = $passArray.Length - 1; $i -gt 0; $i--) {
        $j = Get-Random -Minimum 0 -Maximum ($i + 1)
        $temp = $passArray[$i]; $passArray[$i] = $passArray[$j]; $passArray[$j] = $temp
    }
    return -join $passArray
}

# Helper for No-BOM UTF8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# 1. Password Management
$configPath = Join-Path $PSScriptRoot "../config.json"
$password = ""
$needsNewCert = $false

if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($config.certPassword) {
            $password = $config.certPassword
            Write-Host "[certs] Using password from config.json" -ForegroundColor Cyan
        }
        else {
            $password = New-StrongPassword
            $config | Add-Member -MemberType NoteProperty -Name "certPassword" -Value $password -Force
            [System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json), $utf8NoBom)
            Write-Host "[certs] Password missing in config.json. Generated and saved new password." -ForegroundColor Yellow
            $needsNewCert = $true
        }
        if ($config.certValidityDays) {
            $validityDays = $config.certValidityDays
            Write-Host "[certs] Using validity: $validityDays days" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "[certs] Failed to parse config.json (possibly corrupted or empty). Re-initializing config..." -ForegroundColor Yellow
        $password = New-StrongPassword
        $needsNewCert = $true
        $recoveredConfig = @{
            emailNotifications = $true
            recipientEmail = "admin@UptimeSHIELD.local"
            smtpServer = "smtp.local"
            smtpPort = 587
            smtpUser = ""
            smtpPassword = ""
            checkInterval = 10
            autoRestart = $true
            maxRetries = 3
            certValidityDays = $validityDays
            autoRenewCert = $true
            certPassword = $password
            services = @()
        }
        [System.IO.File]::WriteAllText($configPath, ($recoveredConfig | ConvertTo-Json), $utf8NoBom)
    }
}
else {
    Write-Host "[certs] config.json not found. Initializing minimal config with strong password..." -ForegroundColor Yellow
    $password = New-StrongPassword
    $minimalConfig = @{
        emailNotifications = $true
        recipientEmail = "admin@UptimeSHIELD.local"
        smtpServer = "smtp.local"
        smtpPort = 587
        smtpUser = ""
        smtpPassword = ""
        checkInterval = 10
        autoRestart = $true
        maxRetries = 3
        certValidityDays = $validityDays
        autoRenewCert = $true
        certPassword = $password
        services = @()
    }
    [System.IO.File]::WriteAllText($configPath, ($minimalConfig | ConvertTo-Json), $utf8NoBom)
    $needsNewCert = $true
}

# Dynamic Renewal Threshold: Renew when 1/3 of the time remains, but cap at 30 days.
if ($validityDays -le 90) {
    $renewalThresholdDays = [math]::Max(0.5, $validityDays / 3)
}
else {
    $renewalThresholdDays = 30
}
Write-Host "[certs] Renewal threshold set to: $([math]::Round($renewalThresholdDays, 2)) days" -ForegroundColor Cyan

# 2. Check Expiration / Existence
if ($Force) {
    Write-Host "[certs] Force regeneration requested. Bypassing checks..." -ForegroundColor Yellow
    $needsNewCert = $true
}
elseif (-not (Test-Path $pfxPath)) {
    Write-Host "[certs] cert.pfx missing. Generating..." -ForegroundColor Yellow
    $needsNewCert = $true
}
elseif ($needsNewCert) {
    Write-Host "[certs] Re-regeneration required for synchronization." -ForegroundColor Yellow
}
else {
    try {
        $certObj = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
        $certObj.Import($pfxPath, $password, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::DefaultKeySet)
        $expirationDate = $certObj.NotAfter
        $daysToExpiry = ($expirationDate - (Get-Date)).TotalDays
        
        $autoRenew = $true
        # Re-fetch config since it might have been created above
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($null -ne $config.autoRenewCert) { $autoRenew = $config.autoRenewCert }

        if ($daysToExpiry -lt $renewalThresholdDays) {
            if ($autoRenew) {
                Write-Host "[certs] Certificate expires in $(([math]::Round($daysToExpiry))) days. Auto-renewing..." -ForegroundColor Yellow
                $needsNewCert = $true
            }
            else {
                Write-Host "[certs] Certificate expires in $(([math]::Round($daysToExpiry))) days, but auto-renewal is DISABLED." -ForegroundColor Gray
            }
        }
        else {
            Write-Host "[certs] Certificate is valid (expires in $(([math]::Round($daysToExpiry))) days)." -ForegroundColor Green
        }
    }
    catch {
        Write-Host "[certs] Failed to read existing certificate or invalid password. Re-generating..." -ForegroundColor Red
        $needsNewCert = $true
    }
}

# 3. Generation Logic
if ($needsNewCert) {

    if (Get-Command openssl -ErrorAction SilentlyContinue) {
        Write-Host "[certs] Using OpenSSL..." -ForegroundColor Cyan
        $keyPath = "$certDir/key.pem"
        $certPath = "$certDir/cert.pem"
        # Generate PEMs
        openssl req -x509 -newkey rsa:4096 -keyout $keyPath -out $certPath -nodes -days 365 -subj "/CN=UptimeSHIELD" -addext "subjectAltName = DNS:localhost"
        # Convert to PFX
        openssl pkcs12 -export -out $pfxPath -inkey $keyPath -in $certPath -password "pass:$password"
    }
    else {
        Write-Host "[certs] OpenSSL not found. Using PowerShell (Native Windows)..." -ForegroundColor Cyan
        $expiryDate = (Get-Date).AddDays($validityDays)
        $cert = New-SelfSignedCertificate -DnsName @("localhost") -CertStoreLocation "Cert:\CurrentUser\My" -Subject "CN=UptimeSHIELD" -NotAfter $expiryDate -TextExtension @("2.5.29.19={text}ca=true&pathlength=1")
        $secPassword = ConvertTo-SecureString -String $password -Force -AsPlainText
        Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $secPassword -Force
    }
}

# 4. Ensure Trust
Write-Host "[certs] Ensuring certificate is trusted..." -ForegroundColor Cyan
try {
    $certToTrust = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
    $certToTrust.Import($pfxPath, $password, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::DefaultKeySet)
    
    $thumbprint = $certToTrust.Thumbprint
    
    # Check if we are Admin
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $isElevated = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    # ---------------------------
    # Global Cleanup of stale certificates
    # ---------------------------
    $storeNames = @("Root", "My", "CA")
    $storeLocations = @("CurrentUser")
    if ($isElevated) { $storeLocations += "LocalMachine" }

    foreach ($loc in $storeLocations) {
        foreach ($name in $storeNames) {
            try {
                $store = New-Object System.Security.Cryptography.X509Certificates.X509Store($name, $loc)
                $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
                $strayCerts = $store.Certificates | Where-Object { $_.Subject -like "*CN=UptimeSHIELD*" -and $_.Thumbprint -ne $thumbprint }
                foreach ($stray in $strayCerts) {
                    Write-Host "[certs] Removing stray/old cert from ${loc}\${name}: $($stray.Thumbprint)" -ForegroundColor Yellow
                    $store.Remove($stray)
                }
                $store.Close()
            } catch {
                # Ignore failures (e.g. standard user can't delete from some locations)
            }
        }
    }
    # ---------------------------

    $alreadyTrusted = $false
    $storeLocations = @("CurrentUser")
    if ($isElevated) { $storeLocations += "LocalMachine" }

    foreach ($loc in $storeLocations) {
        $checkStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", $loc)
        $checkStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadOnly)
        if ($checkStore.Certificates | Where-Object { $_.Thumbprint -eq $thumbprint }) {
            $alreadyTrusted = $true
        }
        $checkStore.Close()
    }


    if (-not $alreadyTrusted) {
        # Export PEM for certutil (it handles PEM better for simple root additions)
        $tempPem = "$certDir/temp-trust.pem"
        Export-Certificate -Cert $certToTrust -FilePath $tempPem -Type CERT | Out-Null

        if ($isElevated) {
            Write-Host "[certs] Running as Admin. Adding to LocalMachine Root (Silent)..." -ForegroundColor Yellow
            certutil -addstore -f root "$tempPem" | Out-Null
            Write-Host "[certs] Successfully added to LocalMachine Trusted Root store." -ForegroundColor Green
        }
        else {
            Write-Host "[certs] TIP: To make this process 100% silent, run your terminal as Administrator." -ForegroundColor Cyan
            Write-Host "[certs] NOTE: A Windows Security Warning popup will appear. Click 'Yes' to trust the dev certificate." -ForegroundColor DarkCyan
            Write-Host "[certs] Verify Fingerprint (Thumbprint): $thumbprint" -ForegroundColor Yellow
            certutil -user -addstore -f root "$tempPem" | Out-Null
            Write-Host "[certs] Successfully processed CurrentUser Trusted Root store." -ForegroundColor Green
        }
        
        if (Test-Path $tempPem) { Remove-Item $tempPem }
    }
    else {
        Write-Host "[certs] Certificate already in Trusted Root store." -ForegroundColor Green
    }
}
catch {
    Write-Host "[certs] Failed to ensure trust: $($_.Exception.Message)" -ForegroundColor Red
}
