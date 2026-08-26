import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { token, role, adminToken } = await request.json();
    const cookieStore = await cookies();

    if (token) {
      cookieStore.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    } else {
      cookieStore.delete("token");
    }

    if (role) {
      cookieStore.set("role", role, {
        httpOnly: true, // Securely keep the role HttpOnly as required
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    } else {
      cookieStore.delete("role");
    }

    if (adminToken) {
      cookieStore.set("admin_token", adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    } else {
      cookieStore.delete("admin_token");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("role");
  cookieStore.delete("admin_token");
  return NextResponse.json({ success: true });
}
