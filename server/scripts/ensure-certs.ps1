$certDir = "server/certs"
$pfxPath = "$certDir/cert.pfx"
$password = "password"

if (-not (Test-Path $certDir)) {
    Write-Host "[certs] Creating directory: $certDir" -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $certDir
}

if (-not (Test-Path $pfxPath)) {
    Write-Host "[certs] cert.pfx missing. Generating..." -ForegroundColor Yellow
    if (Get-Command openssl -ErrorAction SilentlyContinue) {
        Write-Host "[certs] Using OpenSSL..." -ForegroundColor Cyan
        $keyPath = "$certDir/key.pem"
        $certPath = "$certDir/cert.pem"
        # Generate PEMs
        openssl req -x509 -newkey rsa:4096 -keyout $keyPath -out $certPath -nodes -days 365 -subj "/CN=localhost"
        # Convert to PFX
        openssl pkcs12 -export -out $pfxPath -inkey $keyPath -in $certPath -password "pass:$password"
    }
    else {
        Write-Host "[certs] OpenSSL not found. Using PowerShell (Native Windows)..." -ForegroundColor Cyan
        $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\CurrentUser\My" -Type Custom -KeySpec Signature -Subject "CN=localhost"
        $secPassword = ConvertTo-SecureString -String $password -Force -AsPlainText
        Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $secPassword
    }
}
else {
    Write-Host "[certs] cert.pfx found." -ForegroundColor Green
}
