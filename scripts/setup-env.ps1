# Script de configuration des variables d'environnement pour Nythy
# Usage: pwsh scripts/setup-env.ps1

Write-Host "🔧 Configuration de l'environnement Nythy..." -ForegroundColor Cyan

# Générer une clé AUTH_SECRET aléatoire de 32 caractères
$chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
$authSecret = -join ((1..32) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })

# Lire le fichier Firebase service account
$serviceAccountPath = "nythy-72973-firebase-adminsdk-fbsvc-8c2475c629.json"
if (Test-Path $serviceAccountPath) {
    $serviceAccount = Get-Content $serviceAccountPath | ConvertFrom-Json
    $projectId = $serviceAccount.project_id
    $clientEmail = $serviceAccount.client_email
    $privateKey = $serviceAccount.private_key
    Write-Host "✅ Service account trouvé: $projectId" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier service account non trouvé!" -ForegroundColor Red
    exit 1
}

# Créer le fichier .env.local
$envContent = @"
# =============================================================================
# CONFIGURATION NYTHY - Généré automatiquement
# =============================================================================

# -----------------------------------------------------------------------------
# NextAuth Configuration
# -----------------------------------------------------------------------------
AUTH_SECRET=$authSecret
NEXTAUTH_URL=http://localhost:3000

# -----------------------------------------------------------------------------
# Firebase Configuration (Public)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$projectId.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$projectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$projectId.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx

# -----------------------------------------------------------------------------
# Firebase Admin SDK (Privé)
# -----------------------------------------------------------------------------
FIREBASE_PROJECT_ID=$projectId
FIREBASE_CLIENT_EMAIL=$clientEmail
FIREBASE_PRIVATE_KEY="$($privateKey -replace "`n", "\n")"

# -----------------------------------------------------------------------------
# Firebase App Check
# -----------------------------------------------------------------------------
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=6LdB3wssAAAAADPeDwitamQ0uBcUu0XMTMb3YhEL
RECAPTCHA_V3_SECRET_KEY=votre_secret_key_recaptcha

# -----------------------------------------------------------------------------
# CORS Configuration
# -----------------------------------------------------------------------------
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000

# -----------------------------------------------------------------------------
# Environment
# -----------------------------------------------------------------------------
NODE_ENV=development
"@

# Écrire le fichier
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -NoNewline

Write-Host "✅ Fichier .env.local créé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Complétez les valeurs suivantes dans .env.local:" -ForegroundColor Yellow
Write-Host "  - NEXT_PUBLIC_FIREBASE_API_KEY" -ForegroundColor Yellow
Write-Host "  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" -ForegroundColor Yellow
Write-Host "  - NEXT_PUBLIC_FIREBASE_APP_ID" -ForegroundColor Yellow
Write-Host "  - RECAPTCHA_V3_SECRET_KEY" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Trouvez ces valeurs dans Firebase Console > Project Settings" -ForegroundColor Cyan

