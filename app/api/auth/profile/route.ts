import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { userModel } from "@/lib/db/models";
import { success, unauthorized } from "@/lib/utils/response";

// GET current user profile
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return unauthorized();
    }

    // Get user with roles and permissions
    const user = await userModel.findWithRoles(auth.userId);
    if (!user) {
      return unauthorized("User not found");
    }

    return success({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      city: user.city,
      address: user.address,
      status: user.status,
      created_at: user.created_at,
      roles: user.roles,
      permissions: user.permissions.map(p => p.slug),
    });

  } catch (error: unknown) {
    console.error("Profile fetch error:", error);
    return unauthorized("Failed to fetch profile");
  }
}

// POST logout - clear auth cookie
export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");
  
  if (action === "logout") {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear auth cookie
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  }

  return unauthorized("Invalid action");
}
