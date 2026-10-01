import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload một file (Buffer) lên Cloudflare R2.
 * @param key         - Object key trong bucket (VD: "frames/abc.png")
 * @param body        - Buffer hoặc Uint8Array nội dung file
 * @param contentType - MIME type của file
 * @returns Public URL của file vừa upload
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Public URL theo custom domain hoặc domain R2 mặc định (không có dấu / cuối)
  const publicDomain = process.env.R2_PUBLIC_URL!.replace(/\/$/, '');
  return `${publicDomain}/${key}`;
}

/**
 * Xóa file khỏi Cloudflare R2 dựa vào public URL.
 */
export async function deleteR2FileByUrl(publicUrl?: string | null) {
  if (!publicUrl) return;

  try {
    const url = new URL(publicUrl);
    // Bỏ dấu gạch chéo đầu để lấy đúng Object Key (VD: frames/abc.jpg)
    const fileKey = url.pathname.replace(/^\/+/, '');

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileKey,
      })
    );
    console.log(`Đã xóa file R2: ${fileKey}`);
  } catch (error) {
    console.error('Lỗi khi xóa file trên R2:', error);
  }
}