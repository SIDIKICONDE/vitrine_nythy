# Script de test de sécurité simplifié pour Windows PowerShell
# Usage: .\scripts\test-security-simple.ps1

$API_URL = if ($env:NEXT_PUBLIC_API_URL) { $env:NEXT_PUBLIC_API_URL } else { "http://localhost:3000" }

Write-Host "🔐 Test de Sécurité - API Nythy" -ForegroundColor Blue
Write-Host ("━" * 60) -ForegroundColor Blue
Write-Host "📡 API: $API_URL" -ForegroundColor Blue
Write-Host ""

# Test 1: Headers de Sécurité
Write-Host "🔒 Test 1: Headers de Sécurité" -ForegroundColor Cyan
Write-Host ("━" * 60) -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/merchant/me" -Method HEAD -ErrorAction SilentlyContinue
    $headers = $response.Headers

    if ($headers.'X-Content-Type-Options' -eq 'nosniff') {
        Write-Host "  ✅ X-Content-Type-Options" -ForegroundColor Green
    } else {
        Write-Host "  ❌ X-Content-Type-Options manquant" -ForegroundColor Red
    }

    if ($headers.'X-Frame-Options' -eq 'DENY') {
        Write-Host "  ✅ X-Frame-Options" -ForegroundColor Green
    } else {
        Write-Host "  ❌ X-Frame-Options manquant" -ForegroundColor Red
    }

    if ($headers.'Content-Security-Policy') {
        Write-Host "  ✅ Content-Security-Policy" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Content-Security-Policy manquant" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Erreur lors du test des headers" -ForegroundColor Red
}

# Test 2: Rate Limiting
Write-Host ""
Write-Host "⏱️  Test 2: Rate Limiting" -ForegroundColor Cyan
Write-Host ("━" * 60) -ForegroundColor Cyan
Write-Host "  📊 Envoi de 150 requêtes..." -ForegroundColor Yellow

$rateLimited = $false
$count = 0

for ($i = 1; $i -le 150; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/api/merchant/me" -Method GET -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 429) {
            $rateLimited = $true
            $count = $i
            break
        }
    } catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 429) {
            $rateLimited = $true
            $count = $i
            break
        }
    }

    if ($i % 20 -eq 0) {
        Write-Host "  📝 $i requêtes envoyées..."
    }
}

if ($rateLimited) {
    Write-Host "  ✅ Rate limit activé après $count requêtes" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Rate limit non détecté après 150 requêtes" -ForegroundColor Yellow
}

# Test 3: App Check
Write-Host ""
Write-Host "🔐 Test 3: App Check Protection" -ForegroundColor Cyan
Write-Host ("━" * 60) -ForegroundColor Cyan

# Sans token
Write-Host "  📝 Test requête SANS App Check token..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/merchant/me" -Method GET -ErrorAction SilentlyContinue
    Write-Host "  ❌ Requête sans token acceptée" -ForegroundColor Red
} catch {
    $error = $_ | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($error.error -eq "App Check token missing") {
        Write-Host "  ✅ Requête sans token bloquée (401)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Bloquée (raison: $($_.Exception.Message))" -ForegroundColor Yellow
    }
}

# Avec token invalide
Write-Host "  📝 Test requête avec token INVALIDE..." -ForegroundColor Yellow
try {
    $headers = @{ "X-Firebase-AppCheck" = "invalid-token-12345" }
    $response = Invoke-RestMethod -Uri "$API_URL/api/merchant/me" -Method GET -Headers $headers -ErrorAction SilentlyContinue
    Write-Host "  ❌ Token invalide accepté" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 401) {
        Write-Host "  ✅ Token invalide rejeté (401)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Rejeté (status: $statusCode)" -ForegroundColor Yellow
    }
}

# Test 4: CORS
Write-Host ""
Write-Host "🌐 Test 4: CORS" -ForegroundColor Cyan
Write-Host ("━" * 60) -ForegroundColor Cyan

try {
    $headers = @{
        "Origin" = "http://localhost:3000"
        "Access-Control-Request-Method" = "GET"
    }
    $response = Invoke-WebRequest -Uri "$API_URL/api/merchant/me" -Method OPTIONS -Headers $headers -ErrorAction SilentlyContinue
    
    if ($response.Headers.'Access-Control-Allow-Origin') {
        Write-Host "  ✅ CORS configuré" -ForegroundColor Green
    } else {
        Write-Host "  ❌ CORS non configuré" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️  Erreur test CORS" -ForegroundColor Yellow
}

# Résumé
Write-Host ""
Write-Host ("━" * 60) -ForegroundColor Blue
Write-Host "✅ Tests terminés !" -ForegroundColor Green
Write-Host ""

