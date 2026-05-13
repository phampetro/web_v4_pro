import type { Metadata } from 'next';
import { SanPhamConfigMomoi } from "@/features/bao-cao/components/san-pham-config-momoi";

export const metadata: Metadata = {
  title: 'Báo cáo mở mới | DMS Report V4',
  description: 'Quản lý cấu hình danh sách sản phẩm mở mới',
};

export default function BaoCaoMoMoiPage() {
  return <SanPhamConfigMomoi />;
}
