import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Nếu đã đăng nhập mà cố vào trang login -> chuyển về dashboard
  if (pathname === '/' && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Nếu chưa đăng nhập mà cố vào dashboard -> chuyển về trang login
  if (pathname.startsWith('/dashboard') && !sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Bảo vệ API routes (nếu có dùng API routes truyền thống)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/api/:path*'],
};
