import { cookies } from 'next/headers';
import DashboardLayoutClient from '@/components/layout/dashboard-layout-client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getAuthSession } = await import('@/lib/auth-server');
  const session = await getAuthSession();
  const initialUsername = session?.username || '';

  return (
    <DashboardLayoutClient initialUsername={initialUsername}>
      {children}
    </DashboardLayoutClient>
  );
}
