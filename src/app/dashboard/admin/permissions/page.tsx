import React from 'react';
import PermissionManager from '@/features/admin/components/permission-manager';
import { getAuthSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Quản lý Phân quyền | DMS Report V4',
};

export default async function PermissionsPage() {
  const session = await getAuthSession();

  // Chỉ cho phép ADMIN vào trang này
  if (!session || session.quyenQL !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Thiết lập Phân quyền hệ thống</h1>
        <p className="text-gray-500">Cấu hình quyền truy cập Menu và Tính năng cho các Nhóm (Role) và Cá nhân (User).</p>
      </div>
      
      <PermissionManager adminUsername={session.username} />
    </div>
  );
}
