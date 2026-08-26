import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const isSuperAdminRoute = pathname.startsWith("/super-admin");
  const isAdminRoute = pathname.startsWith("/admin");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isStudentRoute = pathname.startsWith("/student");

  if (isSuperAdminRoute || isAdminRoute || isTeacherRoute || isStudentRoute) {
    const token = request.cookies.get("token")?.value;
    const role = request.cookies.get("role")?.value;
    const adminToken = request.cookies.get("admin_token")?.value;

    // 1. If token is missing, redirect to the correct login route
    if (!token) {
      if (isSuperAdminRoute || isAdminRoute) {
        return NextResponse.redirect(new URL("/admin-login", request.url));
      } else {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // Allow impersonation recovery transitions to pass through to DashboardLayout
    if (isAdminRoute && role !== "admin" && adminToken) {
      return NextResponse.next();
    }

    // 2. Prevent cross-role access using securely validated HttpOnly role cookie
    if (isSuperAdminRoute && role !== "super_admin") {
      return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
    }

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
    }

    if (isTeacherRoute && role !== "teacher") {
      return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
    }

    if (isStudentRoute && role !== "student") {
      return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
    }
  }

  return NextResponse.next();
}

function getRoleDashboard(role) {
  switch (role) {
    case "super_admin":
      return "/super-admin/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "teacher":
      return "/teacher/dashboard";
    case "student":
      return "/student/dashboard";
    default:
      return "/login";
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/super-admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
