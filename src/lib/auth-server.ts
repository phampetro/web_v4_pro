import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export interface AuthSession {
  id: string;
  username: string;
  quyenQL: string;
  quyen: string;
}

const secretKey = process.env.SESSION_SECRET || 'phampetro_dms_v4_secret_key_2026_safe';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) return null;
    
    const payload = await decrypt(sessionToken);
    return payload as AuthSession;
  } catch (error) {
    // Session không hợp lệ hoặc đã hết hạn
    return null;
  }
}
