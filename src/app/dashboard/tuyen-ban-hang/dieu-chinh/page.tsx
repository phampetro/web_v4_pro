import type { Metadata } from 'next';
import { DangkyTuyenContainer } from "@/features/tuyen-ban-hang/components/dangky-tuyen-container";

export const metadata: Metadata = {
  title: 'Điều chỉnh tuyến | DMS Report V4',
};

export default function DieuChinhTuyenPage() {
  return <DangkyTuyenContainer />;
}
