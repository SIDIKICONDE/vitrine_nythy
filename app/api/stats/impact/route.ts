import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * API Route pour récupérer les statistiques d'impact globales de Nythy
 * GET /api/stats/impact
 * 
 * Calcule :
 * - Repas sauvés (total des commandes complétées)
 * - CO2 économisé (basé sur une formule : 1 repas = 2.5 kg CO2)
 * - Commerces partenaires (marchands actifs/vérifiés)
 * - Utilisateurs actifs (utilisateurs avec au moins une commande)
 */
export async function GET() {
  try {
    // Calculer les statistiques en parallèle
    const [ordersSnapshot, merchantsSnapshot, usersSnapshot] = await Promise.all([
      // Total des commandes complétées
      adminDb
        .collection('orders')
        .where('status', '==', 'completed')
        .count()
        .get(),

      // Tous les marchands (on ne filtre pas pour avoir le total)
      // Si vous voulez filtrer, vérifiez le vrai nom du champ dans votre DB
      adminDb
        .collection('merchants')
        .count()
        .get(),

      // Nombre d'utilisateurs (approximation des actifs)
      adminDb
        .collection('users')
        .count()
        .get(),
    ]);

    // Récupérer le nombre de repas
    const mealsSaved = ordersSnapshot.data().count;

    // Calculer le CO2 économisé
    // Formule : 1 repas sauvé = environ 2.5 kg de CO2 économisé
    // Source : réduction des émissions liées au gaspillage alimentaire
    const co2SavedKg = mealsSaved * 2.5;
    // Garder au moins 2 décimales pour les petites valeurs
    const co2SavedTonnes = Math.round((co2SavedKg / 1000) * 100) / 100;

    const partnersCount = merchantsSnapshot.data().count;
    const activeUsers = usersSnapshot.data().count;

    const stats = {
      mealsSaved,
      co2Saved: co2SavedTonnes,
      partnersCount,
      activeUsers,
      lastUpdated: new Date().toISOString()
    };

    console.log('📊 Stats d\'impact calculées:', stats);

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache 5 min
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stats d\'impact:', error);

    // En cas d'erreur, retourner des valeurs par défaut
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des statistiques',
        mealsSaved: 0,
        co2Saved: 0,
        partnersCount: 0,
        activeUsers: 0,
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

