/**
 * Configuration des commissions et frais de la plateforme
 * 
 * ⚙️ ACTIVATION/DÉSACTIVATION DES COMMISSIONS
 * 
 * Pour les paiements en CASH (sur place), aucune commission n'est prélevée
 * car la plateforme ne traite pas le paiement.
 * 
 * Pour les paiements en ligne (Stripe, etc.), une commission peut être prélevée
 * pour couvrir les frais de transaction et les services de la plateforme.
 * 
 * 💡 COMMENT ACTIVER LES COMMISSIONS À L'AVENIR :
 * 1. Changer COMMISSION_ENABLED de false à true
 * 2. Ajuster COMMISSION_RATE si besoin (0.15 = 15%)
 * 3. Redémarrer le serveur Next.js
 */

// 🔧 PARAMÈTRES DE COMMISSION
export const COMMISSION_ENABLED = false; // ⚠️ Mettre à true pour activer les commissions
export const COMMISSION_RATE = 0.15;     // 15% de commission (si activé)

// 📝 NOTES :
// - COMMISSION_RATE = 0.15 signifie 15% de commission
// - Si COMMISSION_ENABLED = false, commission = 0 (aucun frais)
// - Si COMMISSION_ENABLED = true, commission = montant × COMMISSION_RATE

