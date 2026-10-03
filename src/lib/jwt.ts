import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface AdminTokenPayload extends JWTPayload {
  sub: string;
  role: string;
  status: string;
  type: 'access';
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET or ADMIN_JWT_SECRET environment variable');
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: Pick<AdminTokenPayload, 'sub' | 'role' | 'status'>
): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecret());
}

export async function verifyAccessToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
