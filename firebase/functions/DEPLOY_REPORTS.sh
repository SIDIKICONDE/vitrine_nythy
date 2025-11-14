#!/bin/bash

# Script de déploiement de la fonction de signalement
# Usage: ./DEPLOY_REPORTS.sh

echo "🚀 Déploiement de la fonction de signalement..."
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis firebase/functions/"
    exit 1
fi

# 2. Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "${BLUE}📦 Installation des dépendances...${NC}"
    npm install
fi

# 3. Build TypeScript
echo "${BLUE}🔨 Build du projet TypeScript...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo "${YELLOW}❌ Erreur lors du build${NC}"
    exit 1
fi

echo "${GREEN}✅ Build réussi${NC}"
echo ""

# 4. Déployer la fonction
echo "${BLUE}🚀 Déploiement de la fonction onReportCreated...${NC}"
firebase deploy --only functions:onReportCreated

if [ $? -eq 0 ]; then
    echo ""
    echo "${GREEN}✅ Déploiement réussi !${NC}"
    echo ""
    echo "📊 Vérifiez les logs avec:"
    echo "   firebase functions:log --only onReportCreated"
    echo ""
    echo "🧪 Testez en créant un signalement depuis l'app"
else
    echo ""
    echo "${YELLOW}❌ Erreur lors du déploiement${NC}"
    exit 1
fi

