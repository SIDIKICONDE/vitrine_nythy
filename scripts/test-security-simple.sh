#!/bin/bash

# Script de test de sécurité simplifié
# Usage: ./scripts/test-security-simple.sh

API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3000}"

echo "🔐 Test de Sécurité - API Nythy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 API: $API_URL"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Headers de Sécurité
echo "🔒 Test 1: Headers de Sécurité"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -I "$API_URL/api/merchant/me")

if echo "$RESPONSE" | grep -q "X-Content-Type-Options: nosniff"; then
  echo -e "  ${GREEN}✅ X-Content-Type-Options${NC}"
else
  echo -e "  ${RED}❌ X-Content-Type-Options manquant${NC}"
fi

if echo "$RESPONSE" | grep -q "X-Frame-Options: DENY"; then
  echo -e "  ${GREEN}✅ X-Frame-Options${NC}"
else
  echo -e "  ${RED}❌ X-Frame-Options manquant${NC}"
fi

if echo "$RESPONSE" | grep -q "Content-Security-Policy"; then
  echo -e "  ${GREEN}✅ Content-Security-Policy${NC}"
else
  echo -e "  ${RED}❌ Content-Security-Policy manquant${NC}"
fi

# Test 2: Rate Limiting
echo ""
echo "⏱️  Test 2: Rate Limiting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 Envoi de 150 requêtes..."

COUNT=0
RATE_LIMITED=false

for i in {1..150}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/merchant/me")
  
  if [ "$STATUS" == "429" ]; then
    RATE_LIMITED=true
    COUNT=$i
    break
  fi
  
  # Afficher progression toutes les 20 requêtes
  if [ $((i % 20)) -eq 0 ]; then
    echo "  📝 $i requêtes envoyées..."
  fi
done

if [ "$RATE_LIMITED" = true ]; then
  echo -e "  ${GREEN}✅ Rate limit activé après $COUNT requêtes${NC}"
else
  echo -e "  ${YELLOW}⚠️  Rate limit non détecté après 150 requêtes${NC}"
fi

# Test 3: App Check
echo ""
echo "🔐 Test 3: App Check Protection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Sans token
RESPONSE=$(curl -s "$API_URL/api/merchant/me")
if echo "$RESPONSE" | grep -q "App Check token missing"; then
  echo -e "  ${GREEN}✅ Requête sans token bloquée${NC}"
else
  echo -e "  ${RED}❌ Requête sans token acceptée${NC}"
fi

# Avec token invalide
RESPONSE=$(curl -s -H "X-Firebase-AppCheck: invalid-token" "$API_URL/api/merchant/me")
if echo "$RESPONSE" | grep -q "Invalid App Check token"; then
  echo -e "  ${GREEN}✅ Token invalide rejeté${NC}"
else
  echo -e "  ${RED}❌ Token invalide accepté${NC}"
fi

# Test 4: Authentification
echo ""
echo "🔑 Test 4: Authentification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/merchant/me")
if [ "$STATUS" == "401" ]; then
  echo -e "  ${GREEN}✅ Route protégée par authentification${NC}"
else
  echo -e "  ${RED}❌ Route accessible sans authentification (Status: $STATUS)${NC}"
fi

# Test 5: CORS
echo ""
echo "🌐 Test 5: CORS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/api/merchant/me")
if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "  ${GREEN}✅ CORS configuré${NC}"
else
  echo -e "  ${RED}❌ CORS non configuré${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tests terminés !"
echo ""

