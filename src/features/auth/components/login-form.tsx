'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginSchema, type LoginInput } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { login } from '../actions/login';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef } from 'react';

const { Title, Text } = Typography;

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance>(null);
  const router = useRouter();
  const { message } = App.useApp();

  const onFinish = async (values: LoginInput) => {
    if (!token) {
      message.warning('Vui lòng hoàn thành xác thực bảo mật!');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ ...values, token });
      if (result.success) {
        message.success('Đăng nhập thành công!');
        window.location.href = '/dashboard';
      } else {
        message.error(result.error || 'Tài khoản hoặc mật khẩu không chính xác');
        
        // Reset Mắt thần bằng lệnh chính thống của Cloudflare
        setToken('');
        if (turnstileRef.current) {
          turnstileRef.current.reset();
          console.log('--- Đã gọi lệnh Reset Mắt thần ---');
        }
      }
    } catch (error) {
      message.error('Đã có lỗi xảy ra');
      setToken('');
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      variant="borderless"
      className="w-full shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20"
      styles={{ body: { padding: '40px' } }}
    >
      <div className="text-center mb-10">
        <Title level={3} className="!mb-2 !font-bold text-gray-800">Chào mừng trở lại</Title>
        <Text className="text-gray-500">Vui lòng đăng nhập để truy cập hệ thống báo cáo</Text>
      </div>

      <Form
        name="login"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
        autoComplete="off"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}
          className="mb-6"
        >
          <Input 
            prefix={<UserOutlined className="text-blue-500 mr-2" />} 
            placeholder="Tài khoản hệ thống" 
            className="h-12 rounded-xl border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-all"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          className="mb-8"
        >
          <Input.Password
            prefix={<LockOutlined className="text-blue-500 mr-2" />}
            placeholder="Mật khẩu bảo mật"
            className="h-12 rounded-xl border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-all"
          />
        </Form.Item>

        <div className="mb-6 flex justify-center">
          <Turnstile 
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''} 
            onSuccess={(token) => setToken(token)}
            onExpire={() => setToken('')}
            onError={() => setToken('')}
          />
        </div>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            className="w-full h-12 font-bold text-base rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 border-none shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            loading={loading}
          >
            ĐĂNG NHẬP HỆ THỐNG
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
