/**
 * uploadFileToR2
 * ─────────────────────────────────────────────────────────
 * Helper client-side: gửi file lên API Route /api/upload,
 * server sẽ dùng credentials bí mật để upload lên Cloudflare R2.
 *
 * @param file   - File object từ input hoặc drag-drop
 * @param folder - Thư mục con trong R2 bucket (mặc định: "uploads")
 * @returns Public URL của file trên R2
 */
export async function uploadFileToR2(
  file: File,
  folder: string = 'uploads'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Upload thất bại (HTTP ${res.status})`);
  }

  const { url } = await res.json();
  return url as string;
}
