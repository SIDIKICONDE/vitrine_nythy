import { adminDb } from '@/lib/firebase-admin';
import { FAQ } from '@/types/admin';
import { NextResponse } from 'next/server';

/**
 * API Route pour la gestion de la FAQ
 * GET /api/admin/faq - Liste toutes les FAQs
 */
export async function GET() {
  try {
    const faqsSnapshot = await adminDb
      .collection('faq')
      .orderBy('order', 'asc')
      .get();

    const faqs: FAQ[] = faqsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        question: data['question'] || '',
        answer: data['answer'] || '',
        category: data['category'] || 'Général',
        order: data['order'] || 0,
        isPublished: data['isPublished'] ?? true,
        createdAt: data['createdAt']?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data['updatedAt']?.toDate?.()?.toISOString() || new Date().toISOString(),
        views: data['views'] || 0,
      };
    });

    return NextResponse.json({ faqs }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur chargement FAQ:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement de la FAQ' },
      { status: 500 }
    );
  }
}

