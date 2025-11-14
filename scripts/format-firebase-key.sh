#!/bin/bash

# =============================================================================
# Script de Formatage de la Clé Privée Firebase
# =============================================================================
# Usage: bash scripts/format-firebase-key.sh <fichier-service-account.json>
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 Formatage de la Clé Privée Firebase${NC}"
echo "=============================================="
echo ""

# Vérifier les arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Erreur: Fichier service account manquant${NC}"
    echo ""
    echo "Usage: bash scripts/format-firebase-key.sh <fichier-service-account.json>"
    echo ""
    echo "Exemple:"
    echo "  bash scripts/format-firebase-key.sh nythy-72973-firebase-adminsdk-xxxxx.json"
    exit 1
fi

SERVICE_ACCOUNT_FILE="$1"

# Vérifier que le fichier existe
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo -e "${RED}❌ Erreur: Fichier non trouvé: $SERVICE_ACCOUNT_FILE${NC}"
    exit 1
fi

# Vérifier que jq est installé
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq n'est pas installé. Installation...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v yum &> /dev/null; then
        sudo yum install -y jq
    else
        echo -e "${RED}❌ Impossible d'installer jq automatiquement${NC}"
        echo "   Installez jq manuellement: https://stedolan.github.io/jq/download/"
        exit 1
    fi
fi

echo -e "${BLUE}📄 Lecture du fichier: $SERVICE_ACCOUNT_FILE${NC}"

# Extraire les informations
PROJECT_ID=$(jq -r '.project_id' "$SERVICE_ACCOUNT_FILE")
CLIENT_EMAIL=$(jq -r '.client_email' "$SERVICE_ACCOUNT_FILE")
PRIVATE_KEY=$(jq -r '.private_key' "$SERVICE_ACCOUNT_FILE")

# Vérifier que les données sont valides
if [ "$PROJECT_ID" == "null" ] || [ "$CLIENT_EMAIL" == "null" ] || [ "$PRIVATE_KEY" == "null" ]; then
    echo -e "${RED}❌ Erreur: Fichier JSON invalide ou données manquantes${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Données extraites avec succès${NC}"
echo ""

# Formater la clé privée pour .env (remplacer les retours à la ligne par \n)
FORMATTED_KEY=$(echo "$PRIVATE_KEY" | sed ':a;N;$!ba;s/\n/\\n/g')

echo -e "${BLUE}📋 Variables pour .env.production:${NC}"
echo ""
echo "# Firebase Admin (Backend)"
echo "FIREBASE_PROJECT_ID=$PROJECT_ID"
echo "FIREBASE_CLIENT_EMAIL=$CLIENT_EMAIL"
echo "FIREBASE_PRIVATE_KEY=\"$FORMATTED_KEY\""
echo ""

# Afficher un aperçu (masquer le milieu de la clé)
KEY_PREVIEW=$(echo "$FORMATTED_KEY" | head -c 50)
KEY_SUFFIX=$(echo "$FORMATTED_KEY" | tail -c 50)
echo -e "${YELLOW}💡 Aperçu de la clé formatée:${NC}"
echo "   $KEY_PREVIEW...$KEY_SUFFIX"
echo ""

# Option: Sauvegarder dans un fichier
read -p "Voulez-vous sauvegarder dans un fichier .env.firebase? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    OUTPUT_FILE=".env.firebase"
    cat > "$OUTPUT_FILE" << EOF
# =============================================================================
# Firebase Admin Configuration
# Généré automatiquement le $(date)
# =============================================================================

FIREBASE_PROJECT_ID=$PROJECT_ID
FIREBASE_CLIENT_EMAIL=$CLIENT_EMAIL
FIREBASE_PRIVATE_KEY="$FORMATTED_KEY"
EOF
    echo -e "${GREEN}✅ Variables sauvegardées dans: $OUTPUT_FILE${NC}"
    echo -e "${YELLOW}⚠️  Copiez ces valeurs dans votre fichier .env.production${NC}"
    echo -e "${YELLOW}⚠️  Ne commitez JAMAIS ce fichier dans Git!${NC}"
fi

echo ""
echo -e "${GREEN}✅ Formatage terminé!${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo "1. Copiez les variables ci-dessus dans votre fichier .env.production"
echo "2. Vérifiez que FIREBASE_PRIVATE_KEY est bien entre guillemets"
echo "3. Vérifiez que les \\n sont présents (pas de vrais retours à la ligne)"
echo "4. Redémarrez l'application: pm2 restart vitrine_nythy"
echo ""

