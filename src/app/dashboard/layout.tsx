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
  const initialPermissions = session?.permissions || [];
  const initialRole = session?.quyenQL || '';

  return (
    <DashboardLayoutClient 
      initialUsername={initialUsername} 
      initialPermissions={initialPermissions}
      initialRole={initialRole}
    >
      {children}
    </DashboardLayoutClient>
  );
}
