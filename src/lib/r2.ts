import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function deleteR2FileByUrl(publicUrl?: string | null) {
  if (!publicUrl) return;

  try {
    const url = new URL(publicUrl);
    // Bỏ dấu gạch chéo đầu để lấy đúng Object Key trên R2 (ví dụ: temp/abc.jpg)
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