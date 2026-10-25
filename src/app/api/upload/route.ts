import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 Object Storage (100% Free 10GB + Zero Egress)
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET_NAME || 'gym-documents';
const r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://pub-r2.dev';

const isR2Configured =
  r2AccountId &&
  !r2AccountId.includes('dummy') &&
  r2AccessKey &&
  !r2AccessKey.includes('dummy') &&
  r2SecretKey;

const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKey,
        secretAccessKey: r2SecretKey,
      },
    })
  : null;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('type') as string) || 'DOCUMENT';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${documentType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${fileExt}`;

    // If Cloudflare R2 is configured, upload directly to R2 bucket
    if (r2Client) {
      const command = new PutObjectCommand({
        Bucket: r2Bucket,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      });

      await r2Client.send(command);
      const publicUrl = `${r2PublicUrl}/${fileName}`;

      return NextResponse.json({
        success: true,
        fileName,
        fileUrl: publicUrl,
        fileSize: Math.round(file.size / 1024),
        storage: 'CLOUDFLARE_R2',
      });
    }

    // Dev Fallback: Return a base64 Data URL so the user can test photo & doc upload immediately without R2 credentials!
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      fileName,
      fileUrl: dataUrl,
      fileSize: Math.round(file.size / 1024),
      storage: 'LOCAL_DEV_SIMULATION',
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
