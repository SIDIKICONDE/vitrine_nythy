#!/bin/bash

# =============================================================================
# Script de diagnostic pour la clé privée Firebase
# Usage: bash scripts/diagnose-firebase-key.sh
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Diagnostic de la clé privée Firebase${NC}"
echo "=============================================="
echo ""

# Vérifier si .env.production existe
ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Fichier $ENV_FILE non trouvé${NC}"
    echo "   Créez ce fichier avec vos variables d'environnement"
    exit 1
fi

echo -e "${GREEN}✅ Fichier $ENV_FILE trouvé${NC}"
echo ""

# Charger les variables d'environnement
set -a
source "$ENV_FILE"
set +a

# Vérifier les variables
echo -e "${BLUE}📋 Variables d'environnement:${NC}"
if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo -e "   ${RED}❌ FIREBASE_PROJECT_ID: Non défini${NC}"
else
    echo -e "   ${GREEN}✅ FIREBASE_PROJECT_ID: Défini${NC}"
fi

if [ -z "$FIREBASE_CLIENT_EMAIL" ]; then
    echo -e "   ${RED}❌ FIREBASE_CLIENT_EMAIL: Non défini${NC}"
else
    echo -e "   ${GREEN}✅ FIREBASE_CLIENT_EMAIL: Défini${NC}"
fi

if [ -z "$FIREBASE_PRIVATE_KEY" ]; then
    echo -e "   ${RED}❌ FIREBASE_PRIVATE_KEY: Non défini${NC}"
    exit 1
else
    echo -e "   ${GREEN}✅ FIREBASE_PRIVATE_KEY: Défini${NC}"
fi

echo ""

# Analyser la clé privée
PRIVATE_KEY="$FIREBASE_PRIVATE_KEY"
KEY_LENGTH=${#PRIVATE_KEY}

echo -e "${BLUE}🔑 Analyse de la clé privée:${NC}"
echo "   Longueur: $KEY_LENGTH caractères"

if [[ "$PRIVATE_KEY" == \"* ]]; then
    echo -e "   ${YELLOW}⚠️  Commence par guillemet double${NC}"
fi

if [[ "$PRIVATE_KEY" == *\" ]]; then
    echo -e "   ${YELLOW}⚠️  Se termine par guillemet double${NC}"
fi

if [[ "$PRIVATE_KEY" == *"\\n"* ]]; then
    echo -e "   ${GREEN}✅ Contient \\n (séquence d'échappement)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Ne contient pas \\n${NC}"
fi

if [[ "$PRIVATE_KEY" == *$'\n'* ]]; then
    echo -e "   ${YELLOW}⚠️  Contient de vrais retours à la ligne (peut causer des problèmes)${NC}"
else
    echo -e "   ${GREEN}✅ Pas de vrais retours à la ligne${NC}"
fi

if [[ "$PRIVATE_KEY" == *"BEGIN PRIVATE KEY"* ]]; then
    echo -e "   ${GREEN}✅ Contient BEGIN PRIVATE KEY${NC}"
else
    echo -e "   ${RED}❌ Ne contient pas BEGIN PRIVATE KEY${NC}"
fi

if [[ "$PRIVATE_KEY" == *"END PRIVATE KEY"* ]]; then
    echo -e "   ${GREEN}✅ Contient END PRIVATE KEY${NC}"
else
    echo -e "   ${RED}❌ Ne contient pas END PRIVATE KEY${NC}"
fi

echo ""

# Nettoyer et analyser
echo -e "${BLUE}🧹 Nettoyage de la clé...${NC}"

# Enlever les guillemets
CLEANED_KEY=$(echo "$PRIVATE_KEY" | sed 's/^"//' | sed 's/"$//' | sed "s/^'//" | sed "s/'$//")

# Remplacer \n par de vrais retours à la ligne
CLEANED_KEY=$(echo "$CLEANED_KEY" | sed 's/\\n/\n/g')

# Compter les lignes
LINE_COUNT=$(echo "$CLEANED_KEY" | wc -l)

echo "   Longueur après nettoyage: ${#CLEANED_KEY} caractères"
echo "   Nombre de lignes: $LINE_COUNT"

if [[ "$CLEANED_KEY" == "-----BEGIN PRIVATE KEY-----"* ]]; then
    echo -e "   ${GREEN}✅ Commence par BEGIN PRIVATE KEY${NC}"
else
    echo -e "   ${RED}❌ Ne commence pas par BEGIN PRIVATE KEY${NC}"
fi

if [[ "$CLEANED_KEY" == *"-----END PRIVATE KEY-----" ]]; then
    echo -e "   ${GREEN}✅ Se termine par END PRIVATE KEY${NC}"
else
    echo -e "   ${RED}❌ Ne se termine pas par END PRIVATE KEY${NC}"
fi

echo ""

# Afficher un aperçu
echo -e "${BLUE}📄 Aperçu de la clé (premières et dernières lignes):${NC}"
echo "$CLEANED_KEY" | head -n 3 | sed 's/^/   /'
echo "   ..."
echo "$CLEANED_KEY" | tail -n 3 | sed 's/^/   /'
echo ""

# Vérifier le format PEM
if [[ "$CLEANED_KEY" == "-----BEGIN PRIVATE KEY-----"* ]] && \
   [[ "$CLEANED_KEY" == *"-----END PRIVATE KEY-----" ]] && \
   [[ "$LINE_COUNT" -gt 1 ]]; then
    echo -e "${GREEN}✅ Format PEM valide détecté${NC}"
    
    # Essayer de valider avec openssl si disponible
    if command -v openssl &> /dev/null; then
        echo ""
        echo -e "${BLUE}🔐 Validation avec OpenSSL:${NC}"
        if echo "$CLEANED_KEY" | openssl rsa -check -noout 2>/dev/null; then
            echo -e "   ${GREEN}✅ La clé est valide (RSA)${NC}"
        elif echo "$CLEANED_KEY" | openssl ec -check -noout 2>/dev/null; then
            echo -e "   ${GREEN}✅ La clé est valide (EC)${NC}"
        else
            echo -e "   ${YELLOW}⚠️  OpenSSL ne peut pas valider la clé (peut être normal pour PKCS#8)${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Format PEM invalide${NC}"
    echo ""
    echo -e "${YELLOW}💡 Recommandations:${NC}"
    if [[ ! "$PRIVATE_KEY" == *"BEGIN PRIVATE KEY"* ]]; then
        echo "   - La clé doit contenir -----BEGIN PRIVATE KEY-----"
    fi
    if [[ ! "$PRIVATE_KEY" == *"END PRIVATE KEY"* ]]; then
        echo "   - La clé doit contenir -----END PRIVATE KEY-----"
    fi
    if [[ ! "$PRIVATE_KEY" == *"\\n"* ]]; then
        echo "   - La clé doit contenir \\n pour les retours à la ligne"
    fi
fi

echo ""
echo "=============================================="
echo ""
echo -e "${YELLOW}💡 Format attendu dans .env.production:${NC}"
echo 'FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n'
echo 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...'
echo '...'
echo '-----END PRIVATE KEY-----\n"'
echo ""
echo -e "${BLUE}📝 Pour corriger:${NC}"
echo "1. Utilisez le script: bash scripts/format-firebase-key.sh <fichier-service-account.json>"
echo "2. Ou formatez manuellement avec \\n pour les retours à la ligne"
echo "3. Assurez-vous que la clé est entre guillemets doubles"
echo ""

