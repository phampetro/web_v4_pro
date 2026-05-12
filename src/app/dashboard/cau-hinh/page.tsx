import type { Metadata } from 'next';
import { SanPhamConfig } from "@/features/bao-cao/components/san-pham-config";

export const metadata: Metadata = {
  title: 'Cấu hình sản phẩm | DMS Report V4',
  description: 'Quản lý cấu hình báo cáo sản phẩm',
};

export default function CauHinhPage() {
  return <SanPhamConfig />;
}
