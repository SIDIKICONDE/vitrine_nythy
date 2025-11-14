# Script de déploiement en production
# Usage: pwsh scripts/deploy-production.ps1

param(
    [switch]$SkipTests,
    [switch]$HostingOnly,
    [switch]$FunctionsOnly,
    [switch]$FirestoreOnly,
    [switch]$All
)

Write-Host "🚀 Déploiement Nythy en Production" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier la configuration
if (-not $SkipTests) {
    Write-Host "1️⃣  Vérification de la configuration..." -ForegroundColor Yellow
    pwsh scripts/verify-config.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Configuration invalide. Arrêt du déploiement." -ForegroundColor Red
        exit 1
    }
}

# Vérifier que Firebase CLI est installé
Write-Host "2️⃣  Vérification de Firebase CLI..." -ForegroundColor Yellow
$firebaseVersion = firebase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase CLI non installé!" -ForegroundColor Red
    Write-Host "   Installez avec: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Firebase CLI: $firebaseVersion" -ForegroundColor Green

# Tests de sécurité
if (-not $SkipTests) {
    Write-Host "3️⃣  Tests de sécurité..." -ForegroundColor Yellow
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Erreurs de lint détectées" -ForegroundColor Yellow
        $continue = Read-Host "Continuer quand même? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    }
}

# Build
Write-Host "4️⃣  Build de l'application..." -ForegroundColor Yellow
$env:BUILD_TARGET = "firebase"
npm run build:firebase
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build échoué!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build réussi" -ForegroundColor Green

# Déploiement
Write-Host "5️⃣  Déploiement sur Firebase..." -ForegroundColor Yellow

if ($All) {
    Write-Host "   Déploiement complet (Hosting + Functions + Firestore)..." -ForegroundColor Cyan
    Set-Location firebase
    firebase deploy
    Set-Location ..
} elseif ($HostingOnly) {
    Write-Host "   Déploiement Hosting uniquement..." -ForegroundColor Cyan
    Set-Location firebase
    firebase deploy --only hosting
    Set-Location ..
} elseif ($FunctionsOnly) {
    Write-Host "   Déploiement Functions uniquement..." -ForegroundColor Cyan
    Set-Location firebase
    firebase deploy --only functions
    Set-Location ..
} elseif ($FirestoreOnly) {
    Write-Host "   Déploiement Firestore uniquement..." -ForegroundColor Cyan
    Set-Location firebase
    firebase deploy --only firestore:rules,firestore:indexes
    Set-Location ..
} else {
    Write-Host "   Déploiement Hosting par défaut..." -ForegroundColor Cyan
    Set-Location firebase
    firebase deploy --only hosting
    Set-Location ..
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Déploiement réussi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URL de production: https://nythy-72973.firebaseapp.com" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Vérifiez l'application en production" -ForegroundColor White
    Write-Host "  2. Testez les fonctionnalités critiques" -ForegroundColor White
    Write-Host "  3. Surveillez les logs: firebase functions:log" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Déploiement échoué!" -ForegroundColor Red
    Write-Host "   Vérifiez les logs ci-dessus" -ForegroundColor Yellow
    exit 1
}

