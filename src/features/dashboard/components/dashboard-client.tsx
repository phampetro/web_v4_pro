'use client';

import React from 'react';
import { Typography, Row, Col, Card, Statistic, Button } from 'antd';
import { UserOutlined, ShopOutlined, TransactionOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export function DashboardClient() {
  const router = useRouter();

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <Title level={3} className="!mb-1 text-blue-900">Tổng quan vận hành</Title>
        <Text type="secondary">Chào mừng bạn trở lại hệ thống quản lý DMS Report V4.</Text>
      </div>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-blue-500 bg-white/50 backdrop-blur-sm">
            <Statistic
              title={<span className="text-gray-500 font-medium">Khách hàng mới</span>}
              value={125}
              prefix={<UserOutlined className="text-blue-500 mr-2" />}
              styles={{ content: { fontWeight: 'bold', color: '#1e3a8a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-orange-500 bg-white/50 backdrop-blur-sm">
            <Statistic
              title={<span className="text-gray-500 font-medium">Đơn hàng chờ duyệt</span>}
              value={48}
              prefix={<TransactionOutlined className="text-orange-500 mr-2" />}
              styles={{ content: { fontWeight: 'bold', color: '#9a3412' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-green-500 bg-white/50 backdrop-blur-sm">
            <Statistic
              title={<span className="text-gray-500 font-medium">Điểm bán hoạt động</span>}
              value={1250}
              prefix={<ShopOutlined className="text-green-500 mr-2" />}
              styles={{ content: { fontWeight: 'bold', color: '#065f46' } }}
            />
          </Card>
        </Col>
      </Row>

      <div className="mt-12 p-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-200/50 flex flex-col md:flex-row items-center justify-between overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="z-10 text-center md:text-left mb-6 md:mb-0">
          <Title level={3} className="!mb-2 !text-white">Bắt đầu làm việc ngay</Title>
          <Text className="text-blue-100 text-lg opacity-90">Chọn một chức năng từ menu bên trái hoặc xem nhanh danh sách khách hàng.</Text>
        </div>
        <Button 
          type="default" 
          size="large" 
          onClick={() => router.push('/dashboard/khach-hang/kpsds')}
          className="z-10 h-14 px-10 rounded-2xl font-bold text-blue-700 border-none shadow-lg hover:scale-105 transition-transform"
        >
          Xem KH Không PSDS
        </Button>
      </div>
    </div>
  );
}
