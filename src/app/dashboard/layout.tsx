import { cookies } from 'next/headers';
import DashboardLayoutClient from '@/components/layout/dashboard-layout-client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  
  let initialUsername = '';
  if (sessionToken) {
    try {
      const session = JSON.parse(decodeURIComponent(sessionToken));
      initialUsername = session.username || '';
    } catch (e) {
      console.error('Failed to parse session token:', e);
    }
  }

  return (
    <DashboardLayoutClient initialUsername={initialUsername}>
      {children}
    </DashboardLayoutClient>
  );
}
