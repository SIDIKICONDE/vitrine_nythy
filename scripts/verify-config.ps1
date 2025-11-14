# Script de vérification de la configuration production
# Usage: pwsh scripts/verify-config.ps1

Write-Host "🔍 Vérification de la configuration pour la production..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Vérifier que .env.local existe
if (Test-Path ".env.local") {
    Write-Host "✅ Fichier .env.local existe" -ForegroundColor Green
    
    $envContent = Get-Content ".env.local" -Raw
    
    # Vérifier AUTH_SECRET
    if ($envContent -match "AUTH_SECRET=(.+)") {
        $authSecret = $matches[1].Trim()
        if ($authSecret.Length -ge 32 -and $authSecret -ne "your-super-secret-key-change-this-in-production-min-32-chars") {
            Write-Host "✅ AUTH_SECRET configuré (${authSecret.Length} caractères)" -ForegroundColor Green
        } else {
            $errors += "AUTH_SECRET trop court ou valeur par défaut"
        }
    } else {
        $errors += "AUTH_SECRET manquant"
    }
    
    # Vérifier Firebase Config
    $requiredVars = @(
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_PRIVATE_KEY"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=(.+)") {
            Write-Host "✅ $var configuré" -ForegroundColor Green
        } else {
            $errors += "$var manquant"
        }
    }
    
    # Vérifier reCAPTCHA
    if ($envContent -match "NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=(.+)") {
        Write-Host "✅ reCAPTCHA Site Key configuré" -ForegroundColor Green
    } else {
        $warnings += "reCAPTCHA Site Key manquant (App Check ne fonctionnera pas)"
    }
    
} else {
    $errors += "Fichier .env.local n'existe pas"
    Write-Host "❌ Fichier .env.local n'existe pas!" -ForegroundColor Red
    Write-Host "   Exécutez: pwsh scripts/setup-env.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Résumé:" -ForegroundColor Cyan

if ($errors.Count -eq 0) {
    Write-Host "✅ Configuration valide pour le développement!" -ForegroundColor Green
} else {
    Write-Host "❌ Erreurs trouvées:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  Avertissements:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
}

Write-Host ""

if ($errors.Count -gt 0) {
    exit 1
}

