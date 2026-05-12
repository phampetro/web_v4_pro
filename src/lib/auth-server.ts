import { cookies } from 'next/headers';

export interface AuthSession {
  id: string;
  username: string;
  quyenQL: string;
  quyen: string;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) return null;
    
    const decoded = sessionToken.startsWith('%') ? decodeURIComponent(sessionToken) : sessionToken;
    return JSON.parse(decoded) as AuthSession;
  } catch (error) {
    console.error('Lỗi khi đọc session từ cookie:', error);
    return null;
  }
}
