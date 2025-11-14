#!/bin/bash

# Script pour configurer les variables d'environnement Firebase Functions
# Usage: ./setup-firebase-config.sh

echo "🔧 Configuration des variables Firebase Functions pour Stripe"
echo ""

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé"
    echo "📝 Créez le fichier .env à partir de .env.example"
    echo "   cp .env.example .env"
    exit 1
fi

# Charger les variables depuis .env
source .env

echo "📋 Configuration des clés Stripe..."

# Configurer les variables Firebase
firebase functions:config:set \
  stripe.secret_key_test="$STRIPE_SECRET_KEY_TEST" \
  stripe.secret_key_live="$STRIPE_SECRET_KEY_LIVE" \
  stripe.webhook_secret="$STRIPE_WEBHOOK_SECRET"

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Compiler TypeScript: npm run build"
echo "2. Tester localement: npm run serve"
echo "3. Déployer: npm run deploy"
