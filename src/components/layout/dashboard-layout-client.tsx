'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Button, theme, Avatar, Dropdown, Typography, App, Modal, Form, Input, Space
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  DollarOutlined,
  ShopOutlined,
  CheckSquareOutlined,
  AuditOutlined,
  EnvironmentOutlined,
  NodeIndexOutlined,
  ToolOutlined,
  HomeOutlined,
  ReloadOutlined,
  LockOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/features/auth/actions/logout';
import { changePassword } from '@/features/auth/actions/change-password';
import { getNgayUpdate } from '@/features/dashboard/actions/dashboard';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  initialUsername: string;
}

export default function DashboardLayoutClient({
  children,
  initialUsername,
}: DashboardLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [ngayUpdate, setNgayUpdate] = useState<string | null>(null);
  const [ngayUpdateLoading, setNgayUpdateLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const router = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();
  const { message } = App.useApp();

  const fetchNgayUpdate = async () => {
    setNgayUpdateLoading(true);
    try {
      const result = await getNgayUpdate();
      if (result.success) {
        setNgayUpdate(result.ngayUpdate);
      }
    } catch (error) {
      console.error('Fetch NgayUpdate error:', error);
    } finally {
      setNgayUpdateLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setChangePasswordLoading(true);
    try {
      const result = await changePassword({ ...values, username });
      if (result.success) {
        message.success('Đổi mật khẩu thành công!');
        setChangePasswordOpen(false);
        passwordForm.resetFields();
      } else {
        message.error(result.error || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      message.error('Đã có lỗi xảy ra');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchNgayUpdate();
    // Đồng bộ username nếu có sự thay đổi từ prop (hiếm khi xảy ra nhưng tốt cho sự nhất quán)
    if (initialUsername) {
      setUsername(initialUsername);
    }
  }, [initialUsername]);

  // Tránh render nội dung nhạy cảm trước khi mounted để ngăn lỗi hydration
  const renderDate = () => {
    if (!mounted) return '--/--/----';
    if (ngayUpdateLoading) return '...';
    return ngayUpdate ? dayjs(ngayUpdate).format('DD/MM/YYYY') : '--/--/----';
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'khach-hang',
      icon: <TeamOutlined />,
      label: 'Khách hàng',
      children: [
        { key: '/dashboard/khach-hang/kpsds', icon: <DollarOutlined />, label: 'Khách hàng KPSDS' },
        { key: '/dashboard/khach-hang/cho-pho', icon: <ShopOutlined />, label: 'Khách hàng Chợ - Phố' },
        { key: '/dashboard/khach-hang/duyet-cho-pho', icon: <CheckSquareOutlined />, label: 'Duyệt Chợ - Phố' },
        { key: '/dashboard/khach-hang/tam-ngung', icon: <AuditOutlined />, label: 'Duyệt tạm ngưng' },
      ],
    },
    {
      key: 'tuyen-ban-hang',
      icon: <EnvironmentOutlined />,
      label: 'Tuyến bán hàng',
      children: [
        { key: '/dashboard/tuyen-ban-hang/xem-nhanh', icon: <NodeIndexOutlined />, label: 'Xem nhanh tuyến' },
        { key: '/dashboard/tuyen-ban-hang/dieu-chinh', icon: <ToolOutlined />, label: 'Điều chỉnh tuyến' },
        { key: '/dashboard/tuyen-ban-hang/duyet-chinh', icon: <CheckSquareOutlined />, label: 'Duyệt chỉnh tuyến' },
      ],
    },
    {
      key: '/dashboard/cau-hinh',
      icon: <SettingOutlined />,
      label: 'Cấu hình sản phẩm',
    },
  ];

  const handleLogout = async () => {
    await logout();
    message.success('Đã đăng xuất');
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', background: '#0a192f' }}>
      {/* Dynamic Background Layer from Login Page */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/15 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-transparent" />
      </div>

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={260}
        collapsedWidth={80}
        theme="light"
        className="z-10 shadow-[1px_0_10px_rgba(0,0,0,0.03)]"
        style={{
          borderRight: `1px solid #e5e7eb`,
        }}
      >
        {/* Logo Area */}
        <div className={`h-20 flex items-center border-b border-gray-50 overflow-hidden transition-all duration-300 ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
          <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden flex-shrink-0 transition-all ${collapsed ? 'mr-0' : 'mr-3'}`}>
            {!logoError ? (
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-primary font-bold text-xs">DMS</span>
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
              <Text className="text-[13px] text-blue-600 font-extrabold leading-tight tracking-tight uppercase whitespace-nowrap">
                DMS REPORT <span className="text-blue-400">V4</span>
              </Text>
            </div>
          )}
        </div>

        {/* Data Update Date */}
        <div className={`py-3 border-b border-gray-50 flex items-center transition-all duration-300 ${collapsed ? 'justify-center px-0' : 'px-6 justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-1 overflow-hidden animate-in fade-in duration-500">
              <Text className="text-[11px] text-gray-400 italic whitespace-nowrap">Ngày Updated:</Text>
              <Text strong className="text-[11px] text-primary whitespace-nowrap">
                {renderDate()}
              </Text>
            </div>
          )}
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined spin={ngayUpdateLoading} className="text-primary/70" />}
            onClick={fetchNgayUpdate}
            className={`flex items-center justify-center hover:bg-gray-100 rounded-lg ${collapsed ? 'w-10 h-10' : ''}`}
            title="Làm mới dữ liệu"
          />
        </div>

        {/* Navigation Menu */}
        <div className="py-4 h-[calc(100vh-160px)] overflow-y-auto">
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            style={{ border: 'none' }}
            onClick={({ key }) => router.push(key)}
            className="custom-menu-professional"
          />
        </div>
      </Sider>

      <Layout className="bg-transparent z-10">
        <Header
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid #f0f0f0`,
            height: 64,
          }}
        >
          <div className="flex items-center gap-6">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
            />
            <div className="h-4 w-[1px] bg-gray-200" />
            <Text strong className="text-gray-700 text-sm">
              {(() => {
                if (pathname === '/dashboard') return 'Tổng quan hệ thống';
                if (pathname === '/dashboard/khach-hang/kpsds') return 'Khách hàng KPSDS';
                if (pathname === '/dashboard/khach-hang/cho-pho') return 'Khách hàng Chợ - Phố';
                if (pathname === '/dashboard/khach-hang/duyet-cho-pho') return 'Duyệt Chợ - Phố';
                if (pathname === '/dashboard/khach-hang/tam-ngung') return 'Duyệt tạm ngưng';
                if (pathname === '/dashboard/tuyen-ban-hang/xem-nhanh') return 'Xem nhanh tuyến';
                if (pathname === '/dashboard/tuyen-ban-hang/dieu-chinh') return 'Điều chỉnh tuyến';
                if (pathname === '/dashboard/tuyen-ban-hang/duyet-chinh') return 'Duyệt chỉnh tuyến';
                if (pathname === '/dashboard/cau-hinh') return 'Cấu hình sản phẩm';
                return 'Hệ thống báo cáo';
              })()}
            </Text>
          </div>

          <div className="flex items-center gap-3">
            <Dropdown
              menu={{
                items: [
                  { key: 'change-password', icon: <LockOutlined />, label: 'Đổi mật khẩu', onClick: () => setChangePasswordOpen(true) },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout },
                ]
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50/80 p-0.5 pr-2.5 rounded-full transition-all border border-gray-100 bg-white/50 h-8 shadow-sm">
                <Avatar 
                  size={24}
                  className="bg-blue-600 text-white shadow-sm flex-shrink-0"
                  icon={<UserOutlined style={{ fontSize: '12px' }} />} 
                />
                <div className="hidden sm:block leading-none">
                  <Text strong className="text-[11px] text-gray-700 block">{username || 'Người dùng'}</Text>
                </div>
                <DownOutlined className="text-[9px] text-gray-400 ml-0.5" />
              </div>
            </Dropdown>

          </div>
        </Header>

        <Content className="m-4 flex flex-col min-h-0">
          <div className="flex-1 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto p-6">
              {children}
            </div>
          </div>
        </Content>
      </Layout>

      {/* Modal Đổi mật khẩu */}
      <Modal
        title={<Title level={4} className="!m-0">Đổi mật khẩu</Title>}
        open={changePasswordOpen}
        onCancel={() => { setChangePasswordOpen(false); passwordForm.resetFields(); }}
        footer={null}
        destroyOnHidden
        centered
        width={400}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          className="mt-6"
          requiredMark={false}
        >
          <Form.Item
            name="oldPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Nhập mật khẩu hiện tại" className="rounded-lg" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Nhập mật khẩu mới" className="rounded-lg" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Nhập lại mật khẩu mới" className="rounded-lg" />
          </Form.Item>
          <Form.Item className="mb-0 mt-8 text-right">
            <Space>
              <Button onClick={() => { setChangePasswordOpen(false); passwordForm.resetFields(); }} className="rounded-lg">
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={changePasswordLoading} className="rounded-lg">
                Cập nhật mật khẩu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
