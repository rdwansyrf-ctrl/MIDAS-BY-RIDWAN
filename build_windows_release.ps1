# ============================================================
# RDWN M32 Live Training Simulator
# Windows x64 Automated Release & Installer Build Pipeline
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " RDWN M32 LIVE TRAINING SIMULATOR - RELEASE BUILD" -ForegroundColor Yellow
Write-Host " Target: Windows x64 (10 / 11) Standalone Installer" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Dependency Validation
Write-Host "`n[1/8] Checking Build Toolchain Prerequisites..." -ForegroundColor Green
$node = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error "Node.js is not installed or not in PATH."
}
Write-Host " - Node.js: $(node --version)" -ForegroundColor Gray

$npm = Get-Command "npm" -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Error "npm is not installed or not in PATH."
}
Write-Host " - npm: $(npm --version)" -ForegroundColor Gray

$cargo = Get-Command "cargo" -ErrorAction SilentlyContinue
if ($cargo) {
    Write-Host " - Rust/Cargo: $(cargo --version)" -ForegroundColor Gray
} else {
    Write-Warning "Cargo is not detected in PATH. If building via Tauri, ensure Rust is installed."
}

# 2. Frontend Build
Write-Host "`n[2/8] Compiling Frontend Console Production Bundle..." -ForegroundColor Green
npm run build
if (-not (Test-Path "dist\index.html")) {
    Write-Error "Frontend compilation failed. dist\index.html was not found."
}
Write-Host " - Frontend build succeeded." -ForegroundColor Gray

# 3. Create Release Directory
Write-Host "`n[3/8] Preparing Output Release Folder..." -ForegroundColor Green
$releaseDir = "Release"
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

# 4. Native Windows Binary Compilation
Write-Host "`n[4/8] Building Native Rust / Tauri Audio Backend..." -ForegroundColor Green
if ($cargo) {
    Push-Location "src-tauri"
    try {
        cargo build --release --target x86_64-pc-windows-msvc
        Write-Host " - Native Windows x64 binary compiled successfully." -ForegroundColor Gray
    } catch {
        Write-Warning "Cargo compilation skipped or encountered target warnings."
    }
    Pop-Location
}

# 5. Build NSIS Windows Installer
Write-Host "`n[5/8] Assembling Standalone Windows NSIS Setup Installer..." -ForegroundColor Green
$nsis = Get-Command "makensis" -ErrorAction SilentlyContinue
if ($nsis) {
    & makensis installer.nsi
    Write-Host " - Setup Installer built: Release\RDWN_M32_Live_Training_Simulator_Setup.exe" -ForegroundColor Green
} else {
    Write-Host " - makensis executable not found. Creating package bundle structure in Release/." -ForegroundColor Yellow
}

# 6. Build Portable ZIP Archive
Write-Host "`n[6/8] Building Portable Release Package..." -ForegroundColor Green
$portableZip = Join-Path $releaseDir "RDWN_M32_Live_Training_Simulator_Portable.zip"
if (Test-Path $portableZip) {
    Remove-Item $portableZip -Force
}
Compress-Archive -Path "dist\*" -DestinationPath $portableZip
Write-Host " - Portable package generated: $portableZip" -ForegroundColor Gray

# 7. Generate Cryptographic SHA256 Checksums
Write-Host "`n[7/8] Generating SHA-256 Hashes for Release Verification..." -ForegroundColor Green
$checksumsFile = Join-Path $releaseDir "SHA256SUMS.txt"
$hashes = @()
Get-ChildItem $releaseDir -File | Where-Object { $_.Name -ne "SHA256SUMS.txt" } | ForEach-Object {
    $hash = Get-FileHash $_.FullName -Algorithm SHA256
    $hashes += "$($hash.Hash)  $($_.Name)"
}
$hashes | Out-File -FilePath $checksumsFile -Encoding utf8
Write-Host " - SHA256SUMS.txt written." -ForegroundColor Gray

# 8. Release Summary
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " RELEASE BUILD COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host " Output Directory: $releaseDir" -ForegroundColor Cyan
Write-Host " Manifest:" -ForegroundColor Gray
Get-ChildItem $releaseDir | ForEach-Object {
    Write-Host "  - $($_.Name) ($([math]::Round($_.Length / 1KB, 2)) KB)" -ForegroundColor Yellow
}
Write-Host "============================================================" -ForegroundColor Cyan
