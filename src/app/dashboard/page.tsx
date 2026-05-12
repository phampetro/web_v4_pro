import React from 'react';
import type { Metadata } from 'next';
import { DashboardClient } from '@/features/dashboard/components/dashboard-client';

export const metadata: Metadata = {
  title: 'Dashboard | DMS Report V4',
  description: 'Bảng điều khiển tổng quan hệ thống',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
