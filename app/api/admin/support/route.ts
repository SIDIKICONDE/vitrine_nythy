import { adminDb } from '@/lib/firebase-admin';
import { SupportTicket } from '@/types/admin';
import { NextResponse } from 'next/server';

/**
 * API Route pour la gestion du support
 * GET /api/admin/support - Liste tous les tickets
 */
export async function GET() {
  try {
    const ticketsSnapshot = await adminDb
      .collection('support_tickets')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const tickets: SupportTicket[] = ticketsSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      
      // Log pour debug : voir les champs disponibles pour le premier ticket
      if (index === 0) {
        console.log('📊 [ADMIN Support] Exemple de données ticket:', {
          id: doc.id,
          availableFields: Object.keys(data),
          message: data['message'],
          description: data['description'],
          content: data['content'],
          body: data['body'],
          text: data['text']
        });
      }

      // Essayer plusieurs champs possibles pour le message
      const message = 
        data['message'] || 
        data['description'] || 
        data['content'] || 
        data['body'] || 
        data['text'] || 
        '';

      return {
        id: doc.id,
        userId: data.userId || data.user_id || '',
        userEmail: data.userEmail || data.user_email || '',
        userName: data.userName || data.user_name || data.displayName || 'Utilisateur inconnu',
        subject: data.subject || data.title || '',
        message: message,
        category: data.category || 'other',
        priority: data.priority || 'medium',
        status: data.status || 'open',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        assignedTo: data.assignedTo || data.assigned_to,
        responses: data.responses || [],
      };
    });

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur chargement tickets:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des tickets' },
      { status: 500 }
    );
  }
}

