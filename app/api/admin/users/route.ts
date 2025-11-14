import { adminDb } from '@/lib/firebase-admin';
import { AdminUser } from '@/types/admin';
import { NextResponse } from 'next/server';

/**
 * API Route pour la gestion des utilisateurs
 * GET /api/admin/users - Liste tous les utilisateurs
 */
export async function GET() {
  try {
    const usersSnapshot = await adminDb
      .collection('users')
      .orderBy('createdAt', 'desc')
      .limit(1000) // Limiter pour la performance
      .get();

    const users: AdminUser[] = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userRole = userData['role'] || 'user';

      // Exclure les commerçants (merchant et storeOwner) de la liste
      // Ils sont gérés dans /admin/merchants
      if (userRole === 'merchant' || userRole === 'storeOwner') {
        continue; // Passer à l'utilisateur suivant
      }

      // Log pour debug : voir les champs disponibles pour le premier utilisateur
      if (users.length === 0) {
        console.log('📊 [ADMIN] Exemple de données utilisateur:', {
          id: doc.id,
          availableFields: Object.keys(userData),
          displayName: userData['displayName'],
          name: userData['name'],
          firstName: userData['firstName'],
          lastName: userData['lastName'],
          email: userData['email'],
          role: userRole
        });
      }

      // Compter les commandes de l'utilisateur
      const ordersSnapshot = await adminDb
        .collection('orders')
        .where('userId', '==', doc.id)
        .get();

      let totalSpent = 0;
      ordersSnapshot.docs.forEach(orderDoc => {
        const order = orderDoc.data();
        if (order['status'] === 'completed') {
          totalSpent += order['amount'] || 0;
        }
      });

      // Essayer de construire le nom complet depuis plusieurs champs possibles
      let displayName =
        userData['displayName'] ||
        userData['name'] ||
        userData['full_name'] ||
        userData['fullName'];

      // Si pas de displayName, essayer de combiner firstName et lastName
      if (!displayName) {
        const firstName = userData['firstName'] || userData['first_name'] || userData['prenom'];
        const lastName = userData['lastName'] || userData['last_name'] || userData['nom'];

        if (firstName && lastName) {
          displayName = `${firstName} ${lastName}`;
        } else if (firstName) {
          displayName = firstName;
        } else if (lastName) {
          displayName = lastName;
        }
      }

      users.push({
        id: doc.id,
        email: userData['email'] || '',
        displayName: displayName || undefined,
        photoURL: userData['photoURL'] || userData['photoUrl'] || userData['photo_url'] || userData['avatar'] || undefined,
        role: userData['role'] || 'user',
        createdAt: userData['createdAt']?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastActive: userData['lastActive']?.toDate?.()?.toISOString(),
        isBanned: userData['isBanned'] || false,
        totalOrders: ordersSnapshot.size,
        totalSpent,
      });
    }

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur chargement utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des utilisateurs' },
      { status: 500 }
    );
  }
}

