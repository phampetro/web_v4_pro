'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Button, Spin, Progress, List, Tag, Flex } from 'antd';
import { 
  UserOutlined, 
  ShopOutlined, 
  AreaChartOutlined, 
  BarChartOutlined, 
  CheckCircleOutlined,
  CalendarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getDashboardStats, DashboardStats } from '../actions/get-dashboard-stats';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const result = await getDashboardStats();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Load stats error:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Spin size="large" description="Đang tải dữ liệu tổng quan..." />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700">
      <div className="mb-8">
        <Text type="secondary" className="flex items-center gap-2">
          Dữ liệu được cập nhật mới nhất vào: 
          <Tag color="blue" icon={<CalendarOutlined />}>
            {stats?.lastUpdate ? dayjs(stats.lastUpdate).format('DD/MM/YYYY') : '--/--/----'}
          </Tag>
        </Text>
      </div>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-blue-500 bg-white">
            <Statistic
              title={<span className="text-gray-500 font-medium">Tổng số khách hàng</span>}
              value={stats?.totalCustomers || 0}
              prefix={<UserOutlined className="text-blue-500 mr-2" />}
              styles={{ content: { fontWeight: 'bold', color: '#1e3a8a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-red-500 bg-white">
            <Statistic
              title={<span className="text-gray-500 font-medium">Mất bao phủ</span>}
              value={stats?.lossCustomers || 0}
              prefix={<AreaChartOutlined className="text-red-500 mr-2" />}
              styles={{ content: { fontWeight: 'bold', color: '#991b1b' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-purple-500 bg-white">
            <Statistic
              title={<span className="text-gray-500 font-medium">KH Trưng bày</span>}
              value={stats?.displayCustomers || 0}
              prefix={<CheckCircleOutlined className="text-purple-500 mr-2" />}
              styles={{ content: { fontWeight: 'bold', color: '#581c87' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-green-500 bg-white">
            <Statistic
              title={<span className="text-gray-500 font-medium">Nhân viên quản lý</span>}
              value={stats?.totalStaff || 0}
              prefix={<TeamOutlined className="text-green-500 mr-2" />}
              styles={{ content: { fontWeight: 'bold', color: '#065f46' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-8">
        <Col xs={24} lg={10}>
          <Card 
            title={<Title level={5} className="!m-0 flex items-center gap-2"><BarChartOutlined className="text-blue-600" /> Tỷ lệ bao phủ hệ thống</Title>}
            className="h-full shadow-sm rounded-2xl border-none"
          >
            <div className="flex flex-col items-center justify-center py-6">
              <Progress
                type="dashboard"
                percent={stats?.coverageRate || 0}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                strokeWidth={10}
                size={200}
                format={(percent) => (
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-gray-800">{percent}%</span>
                    <span className="text-[12px] text-gray-400 font-normal mt-1">Độ bao phủ</span>
                  </div>
                )}
              />
              <div className="mt-6 text-center px-6">
                <Text type="secondary">Độ bao phủ tính trên khách hàng có doanh số SKU so với tổng khách hàng quản lý.</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card 
            title={<Title level={5} className="!m-0 flex items-center gap-2"><TeamOutlined className="text-blue-600" /> Hiệu quả theo Nhân viên (Top 5)</Title>}
            className="h-full shadow-sm rounded-2xl border-none"
          >
            <div className="flex flex-col gap-4">
              {stats?.topStaff?.map((item, index) => (
                <div key={index} className="w-full py-2 border-b border-gray-50 last:border-0">
                  <Flex justify="space-between" align="center" className="mb-2">
                    <Text strong className="text-gray-700">{item.name}</Text>
                    <Tag color={item.rate > 50 ? 'success' : 'warning'}>{item.rate}%</Tag>
                  </Flex>
                  <Progress 
                    percent={item.rate} 
                    status={item.rate > 50 ? 'active' : 'normal'} 
                    strokeColor={item.rate > 50 ? '#52c41a' : '#faad14'}
                    showInfo={false} 
                    size={['100%', 8]}
                  />
                  <Flex justify="space-between" className="mt-1">
                    <Text type="secondary" className="text-[11px]">{item.active} / {item.count} Khách hàng</Text>
                  </Flex>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>


    </div>
  );
}
