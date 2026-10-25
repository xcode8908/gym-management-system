import { NextResponse } from 'next/server';
import { gymStore } from '@/lib/store';
import { MemberDocument } from '@/lib/types';

// GET /api/documents?memberId=... - Retrieve documents for a member or all
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (memberId) {
      const docs = gymStore.documents.filter((d) => d.memberId === memberId);
      return NextResponse.json(docs);
    }

    return NextResponse.json(gymStore.documents);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/documents - Attach a new document to a member (Aadhaar, DL, Medical, etc.)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { memberId, documentType, documentName, fileUrl, fileSize } = body;

    if (!memberId || !fileUrl) {
      return NextResponse.json(
        { error: 'memberId and fileUrl are required' },
        { status: 400 }
      );
    }

    const member = gymStore.members.find((m) => m.id === memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const newDoc: MemberDocument = {
      id: `doc-${Date.now()}`,
      memberId,
      documentType: documentType || 'AADHAAR',
      type: documentType || 'AADHAAR',
      documentName: documentName || `${documentType}_Document`,
      fileUrl,
      fileSize: fileSize || 250,
      uploadedAt: new Date().toISOString(),
    };

    gymStore.documents.unshift(newDoc);

    return NextResponse.json({
      success: true,
      message: `Document "${newDoc.documentName}" saved to Vault for ${member.fullName}!`,
      document: newDoc,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/documents?id=... - Remove a document from the vault
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const index = gymStore.documents.findIndex((d) => d.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const deleted = gymStore.documents.splice(index, 1);

    return NextResponse.json({
      success: true,
      message: `Document "${deleted[0].documentName}" removed from Vault.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
