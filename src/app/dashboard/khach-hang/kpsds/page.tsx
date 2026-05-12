import type { Metadata } from 'next';
import { KPSDSContainer } from "@/features/khach-hang/components/kpsds-container";

export const metadata: Metadata = {
  title: 'Khách hàng KPSDS | DMS Report V4',
  description: 'Quản lý khách hàng không phát sinh doanh số',
};

export default function KPSDSPage() {
  return <KPSDSContainer />;
}
