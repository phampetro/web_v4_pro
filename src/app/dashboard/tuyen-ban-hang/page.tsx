import type { Metadata } from 'next';
import { ChinhtuyenContainer } from "@/features/tuyen-ban-hang/components/chinhtuyen-container";

export const metadata: Metadata = {
  title: 'Tuyến bán hàng | DMS Report V4',
};

export default function TuyenBanHangPage() {
  return <ChinhtuyenContainer />;
}
