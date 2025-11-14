#!/bin/bash

# Script de déploiement complet - Backend Gamification
# Date: 2025-11-03
# Version: 1.0.0

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement Backend Gamification - START"
echo "=========================================="
echo ""

# Couleurs pour output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Build des Cloud Functions
echo -e "${YELLOW}📦 Step 1/4: Building Cloud Functions...${NC}"
cd functions
npm install
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

cd ..
echo ""

# 2. Déployer Firestore Rules & Indexes
echo -e "${YELLOW}🔒 Step 2/4: Deploying Firestore Rules & Indexes...${NC}"
firebase deploy --only firestore:rules,firestore:indexes

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Firestore configuration deployed${NC}"
else
    echo -e "${RED}❌ Firestore deployment failed${NC}"
    exit 1
fi
echo ""

# 3. Déployer les Cloud Functions
echo -e "${YELLOW}☁️  Step 3/4: Deploying Cloud Functions...${NC}"
echo "Functions to deploy:"
echo "  - Tournaments: createTournament, advanceTournamentPhase, checkRegistrationDeadlines, distributePrizes"
echo "  - Analytics: trackTournamentRegistration, trackTournamentPopularity, trackLeagueEngagement"
echo ""

firebase deploy --only \
functions:createTournament,\
functions:advanceTournamentPhase,\
functions:checkRegistrationDeadlines,\
functions:distributePrizes,\
functions:trackTournamentRegistration,\
functions:trackTournamentPopularity,\
functions:trackLeagueEngagement

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cloud Functions deployed${NC}"
else
    echo -e "${RED}❌ Cloud Functions deployment failed${NC}"
    exit 1
fi
echo ""

# 4. Vérifier les logs
echo -e "${YELLOW}📋 Step 4/4: Checking deployment logs...${NC}"
firebase functions:log --lines 50

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Déploiement COMPLET !${NC}"
echo ""
echo "Fonctions déployées:"
echo "  ✅ createTournament (Callable)"
echo "  ✅ advanceTournamentPhase (Scheduled: every 6 hours)"
echo "  ✅ checkRegistrationDeadlines (Scheduled: every 1 hour) ⭐ NOUVEAU"
echo "  ✅ distributePrizes (Trigger: on tournament finished)"
echo "  ✅ trackTournamentRegistration (Trigger: on participant change)"
echo "  ✅ trackTournamentPopularity (Scheduled: daily 02:00)"
echo "  ✅ trackLeagueEngagement (Scheduled: daily 03:00)"
echo ""
echo "🔍 Prochaines étapes:"
echo "  1. Vérifier dans Firebase Console que toutes les fonctions sont actives"
echo "  2. Tester createTournament via l'app"
echo "  3. Surveiller les logs: firebase functions:log"
echo ""
echo "📚 Documentation complète: docs/GAMIFICATION_BACKEND_DEPLOYMENT.md"
echo "=========================================="

