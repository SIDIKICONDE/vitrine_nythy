/**
 * Page de debug pour diagnostiquer les problèmes de données
 */

import { adminDb } from '@/lib/firebase-admin';
import { auth } from '@/lib/auth';

async function getMerchantId(userId: string): Promise<string | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      const merchantsSnapshot = await adminDb
        .collection('merchants')
        .where('owner_user_id', '==', userId)
        .limit(1)
        .get();

      if (merchantsSnapshot.empty || !merchantsSnapshot.docs[0]) {
        return null;
      }

      return merchantsSnapshot.docs[0].id;
    }

    const userData = userDoc.data();
    return userData?.['merchantId'] || userData?.['merchant_id'] || null;
  } catch (error) {
    console.error('❌ Erreur getMerchantId:', error);
    return null;
  }
}

export default async function DebugPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">❌ Non authentifié</h1>
        <p>Vous devez être connecté pour voir cette page de debug.</p>
      </div>
    );
  }

  const merchantId = await getMerchantId(userId);

  // Récupérer toutes les commandes
  let allOrders: any[] = [];
  if (merchantId) {
    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('merchantId', '==', merchantId)
      .limit(5)
      .get();
    
    allOrders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Récupérer TOUTES les commandes pour voir leur structure
  const allOrdersSnapshot = await adminDb
    .collection('orders')
    .limit(10)
    .get();
  
  const sampleOrders = allOrdersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      merchantId: data['merchantId'],
      merchant_id: data['merchant_id'],
      status: data['status'],
      total: data['total'],
      created_at: data['created_at'] ? 
        (typeof data['created_at'] === 'object' && data['created_at']._seconds ? 
          new Date(data['created_at']._seconds * 1000).toISOString() : 
          data['created_at']) : 
        null,
    };
  });

  // Récupérer tous les merchants
  const merchantsSnapshot = await adminDb.collection('merchants').limit(5).get();
  const merchants = merchantsSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data()['name'] || doc.data()['business_name'],
  }));

  return (
    <div className="p-8 bg-surface min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">🔍 Page de Diagnostic</h1>
        
        {/* Info Utilisateur */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">👤 Utilisateur</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({
              userId,
              email: session?.user?.email,
              name: session?.user?.name,
            }, null, 2)}
          </pre>
        </div>

        {/* Info Merchant */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">🏪 Merchant</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({
              merchantId,
              found: !!merchantId,
            }, null, 2)}
          </pre>
        </div>

        {/* Commandes filtrées par merchantId */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">
            📦 Commandes pour merchantId: {merchantId || 'N/A'} ({allOrders.length} trouvées)
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(allOrders, null, 2)}
          </pre>
        </div>

        {/* Échantillon de toutes les commandes */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">
            📋 Échantillon de TOUTES les commandes ({sampleOrders.length})
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(sampleOrders, null, 2)}
          </pre>
        </div>

        {/* Liste des merchants */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">
            🏪 Merchants disponibles ({merchants.length})
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(merchants, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

