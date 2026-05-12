import type { Metadata } from 'next';
import { TamNgungContainer } from "@/features/khach-hang/components/tam-ngung-container";

export const metadata: Metadata = {
  title: 'Duyệt tạm ngưng | DMS Report V4',
  description: 'Quản lý duyệt yêu cầu tạm ngưng khách hàng',
};

export default function TamNgungPage() {
  return <TamNgungContainer />;
}
