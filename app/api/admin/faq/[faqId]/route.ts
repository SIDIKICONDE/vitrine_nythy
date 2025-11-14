import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Modifier ou supprimer une FAQ
 * PATCH /api/admin/faq/[faqId] - Modifier
 * DELETE /api/admin/faq/[faqId] - Supprimer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { faqId: string } }
) {
  try {
    const { faqId } = params;
    const body = await request.json();

    await adminDb.collection('faq').doc(faqId).update({
      ...body,
      updatedAt: new Date(),
    });

    console.log(`✅ [ADMIN] FAQ ${faqId} modifiée`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur modification FAQ:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { faqId: string } }
) {
  try {
    const { faqId } = params;

    await adminDb.collection('faq').doc(faqId).delete();

    console.log(`✅ [ADMIN] FAQ ${faqId} supprimée`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur suppression FAQ:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}

