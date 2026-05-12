import type { Metadata } from 'next';
import { ChoPhoPendingContainer } from '@/features/khach-hang/components/cho-pho-pending-container';

export const metadata: Metadata = {
  title: 'Duyệt Chợ - Phố | DMS Report V4',
  description: 'Quản lý duyệt thay đổi thông tin Chợ - Phố',
};

export default function DuyetChoPhoPage() {
  return <ChoPhoPendingContainer />;
}
