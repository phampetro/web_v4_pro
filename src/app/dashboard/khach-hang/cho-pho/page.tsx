import type { Metadata } from 'next';
import { ChoPhoContainer } from '@/features/khach-hang/components/cho-pho-container';

export const metadata: Metadata = {
  title: 'Khách hàng Chợ - Phố | DMS Report V4',
  description: 'Quản lý trạng thái khách hàng Chợ - Phố',
};

export default function ChoPhoPage() {
  return <ChoPhoContainer />;
}
