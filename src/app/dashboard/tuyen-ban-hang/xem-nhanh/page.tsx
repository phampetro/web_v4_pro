import type { Metadata } from 'next';
import { XemNhanhTuyenContainer } from '@/features/khach-hang/components/xem-nhanh-tuyen-container';

export const metadata: Metadata = {
  title: 'Xem nhanh tuyến | DMS Report V4',
};

export default function XemNhanhTuyenPage() {
  return <XemNhanhTuyenContainer />;
}
