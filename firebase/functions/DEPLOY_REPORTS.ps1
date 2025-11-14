# Script PowerShell de déploiement de la fonction de signalement
# Usage: .\DEPLOY_REPORTS.ps1

Write-Host "🚀 Déploiement de la fonction de signalement..." -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier qu'on est dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Exécutez ce script depuis firebase/functions/" -ForegroundColor Red
    exit 1
}

# 2. Installer les dépendances si nécessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Blue
    npm install
}

# 3. Build TypeScript
Write-Host "🔨 Build du projet TypeScript..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Build réussi" -ForegroundColor Green
Write-Host ""

# 4. Déployer la fonction
Write-Host "🚀 Déploiement de la fonction onReportCreated..." -ForegroundColor Blue
firebase deploy --only functions:onReportCreated

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Déploiement réussi !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Vérifiez les logs avec:" -ForegroundColor Cyan
    Write-Host "   firebase functions:log --only onReportCreated"
    Write-Host ""
    Write-Host "🧪 Testez en créant un signalement depuis l'app" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Yellow
    exit 1
}

