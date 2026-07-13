/**
 * Middleware — ป้องกันเส้นทาง /admin ทั้งหมด (ยกเว้นหน้า login)
 * ผู้ที่ไม่มี role ADMIN จะถูกส่งกลับไปหน้า login เสมอ
 */
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminArea = req.nextUrl.pathname.startsWith('/admin');
    const isLoginPage = req.nextUrl.pathname === '/admin/login';

    if (isAdminArea && !isLoginPage && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // อนุญาตให้เข้าหน้า login ได้เสมอ ที่เหลือให้ตรวจใน middleware ด้านบน
      authorized: ({ req, token }) =>
        req.nextUrl.pathname === '/admin/login' ? true : !!token,
    },
    pages: { signIn: '/admin/login' },
  },
);

export const config = { matcher: ['/admin/:path*'] };
