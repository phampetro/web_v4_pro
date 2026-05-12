import type { Metadata } from 'next';
import { ChinhtuyenContainer } from "@/features/tuyen-ban-hang/components/chinhtuyen-container";

export const metadata: Metadata = {
  title: 'Duyệt chỉnh tuyến | DMS Report V4',
};

export default function DuyetChinhTuyenPage() {
  return <ChinhtuyenContainer />;
}
