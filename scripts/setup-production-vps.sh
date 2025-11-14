#!/bin/bash

# =============================================================================
# Script de Configuration VPS Production pour Nythy
# =============================================================================
# Usage: bash scripts/setup-production-vps.sh
# Ce script doit être exécuté sur le serveur VPS
# =============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Configuration du VPS pour Nythy Production"
echo "=============================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/vitrine_nythy"
ENV_FILE="$APP_DIR/.env.production"

# Vérifier qu'on est sur le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé${NC}"
    echo "   Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# =============================================================================
# 1. Vérifier les prérequis
# =============================================================================

echo -e "${BLUE}1️⃣  Vérification des prérequis...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 n'est pas installé. Installation...${NC}"
    npm install -g pm2
fi
PM2_VERSION=$(pm2 --version)
echo -e "${GREEN}✅ PM2: $PM2_VERSION${NC}"

echo ""

# =============================================================================
# 2. Générer AUTH_SECRET
# =============================================================================

echo -e "${BLUE}2️⃣  Génération de AUTH_SECRET...${NC}"

if command -v openssl &> /dev/null; then
    AUTH_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ AUTH_SECRET généré${NC}"
else
    AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    echo -e "${GREEN}✅ AUTH_SECRET généré (via Node.js)${NC}"
fi

echo ""

# =============================================================================
# 3. Créer le fichier .env.production
# =============================================================================

echo -e "${BLUE}3️⃣  Configuration du fichier .env.production...${NC}"

if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Le fichier .env.production existe déjà${NC}"
    read -p "Voulez-vous le remplacer? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Configuration annulée. Fichier existant conservé.${NC}"
        exit 0
    fi
    # Backup de l'ancien fichier
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backup créé${NC}"
fi

# Créer le fichier .env.production
cat > "$ENV_FILE" << EOF
# =============================================================================
# NYTHY PRODUCTION ENVIRONMENT
# Généré automatiquement le $(date)
# =============================================================================

# -----------------------------------------------------------------------------
# NextAuth Configuration (CRITIQUE)
# -----------------------------------------------------------------------------
AUTH_SECRET=$AUTH_SECRET
NEXTAUTH_URL=https://votre-domaine.com

# -----------------------------------------------------------------------------
# Firebase Configuration (Public)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nythy-72973.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nythy-72973
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nythy-72973.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx

# -----------------------------------------------------------------------------
# Firebase Admin (Backend)
# -----------------------------------------------------------------------------
FIREBASE_PROJECT_ID=nythy-72973
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@nythy-72973.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE_ICI\n-----END PRIVATE KEY-----\n"

# -----------------------------------------------------------------------------
# reCAPTCHA (App Check)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=6LdB3wssAAAAADPeDwitamQ0uBcUu0XMTMb3YhEL
RECAPTCHA_V3_SECRET_KEY=VOTRE_SECRET_KEY_RECAPTCHA

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
NODE_ENV=production

# -----------------------------------------------------------------------------
# Next.js
# -----------------------------------------------------------------------------
NEXT_TELEMETRY_DISABLED=1

# -----------------------------------------------------------------------------
# Optional: IP Intelligence
# -----------------------------------------------------------------------------
# VPNAPI_KEY=votre_cle_api_vpn
EOF

echo -e "${GREEN}✅ Fichier .env.production créé${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Vous devez maintenant éditer le fichier et remplacer:${NC}"
echo -e "${YELLOW}   - NEXTAUTH_URL avec votre vrai domaine${NC}"
echo -e "${YELLOW}   - Les clés Firebase avec vos vraies valeurs${NC}"
echo -e "${YELLOW}   - La clé reCAPTCHA secret${NC}"
echo ""
echo -e "${BLUE}Éditez avec: nano $ENV_FILE${NC}"
echo ""

# =============================================================================
# 4. Installer les dépendances
# =============================================================================

echo -e "${BLUE}4️⃣  Installation des dépendances...${NC}"

# Nettoyer
rm -rf node_modules package-lock.json .next 2>/dev/null || true

# Installer
npm install --production=false

echo -e "${GREEN}✅ Dépendances installées${NC}"

# Vérifier geoip-lite
if [ -f "node_modules/geoip-lite/data/geoip-country.dat" ]; then
    echo -e "${GREEN}✅ geoip-lite correctement installé${NC}"
else
    echo -e "${YELLOW}⚠️  geoip-lite: données manquantes, tentative de rebuild...${NC}"
    npm rebuild geoip-lite
    if [ -f "node_modules/geoip-lite/data/geoip-country.dat" ]; then
        echo -e "${GREEN}✅ geoip-lite réparé${NC}"
    else
        echo -e "${RED}❌ geoip-lite: problème persistant (l'app utilisera l'API externe)${NC}"
    fi
fi

echo ""

# =============================================================================
# 5. Build de l'application
# =============================================================================

echo -e "${BLUE}5️⃣  Build de l'application...${NC}"

# Type check
echo "Type checking..."
npm run type-check

# Build
echo "Building..."
npm run build

if [ -d ".next" ]; then
    echo -e "${GREEN}✅ Build réussi${NC}"
else
    echo -e "${RED}❌ Build échoué${NC}"
    exit 1
fi

echo ""

# =============================================================================
# 6. Configurer PM2
# =============================================================================

echo -e "${BLUE}6️⃣  Configuration de PM2...${NC}"

# Arrêter l'ancienne instance si elle existe
pm2 stop vitrine_nythy 2>/dev/null || true
pm2 delete vitrine_nythy 2>/dev/null || true

# Démarrer avec la nouvelle configuration
pm2 start ecosystem.config.js --env production

# Sauvegarder
pm2 save

# Configurer le démarrage automatique
pm2 startup || true

echo -e "${GREEN}✅ PM2 configuré${NC}"

echo ""

# =============================================================================
# 7. Vérification finale
# =============================================================================

echo -e "${BLUE}7️⃣  Vérification finale...${NC}"

sleep 3

# Vérifier les logs
echo "Logs récents:"
pm2 logs vitrine_nythy --lines 10 --nostream

echo ""
echo -e "${GREEN}=============================================="
echo -e "✅ Configuration terminée avec succès!"
echo -e "==============================================${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo -e "1. Éditez le fichier .env.production:"
echo -e "   ${BLUE}nano $ENV_FILE${NC}"
echo ""
echo -e "2. Redémarrez l'application:"
echo -e "   ${BLUE}pm2 restart vitrine_nythy${NC}"
echo ""
echo -e "3. Surveillez les logs:"
echo -e "   ${BLUE}pm2 logs vitrine_nythy${NC}"
echo ""
echo -e "4. Vérifiez le statut:"
echo -e "   ${BLUE}pm2 status${NC}"
echo ""
echo -e "${GREEN}🔐 AUTH_SECRET sauvegardé dans: $ENV_FILE${NC}"
echo -e "${YELLOW}⚠️  Ne partagez JAMAIS ce fichier publiquement!${NC}"
echo ""

