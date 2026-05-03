import { NextRequest, NextResponse } from "next/server";
import { otpSchema } from "@/lib/validators/auth";
import { userModel } from "@/lib/db/models";
import { generateToken, isOTPExpired } from "@/lib/auth/jwt";
import { success, error, validationError } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = otpSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const { email, otp } = validation.data;

    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      return error("Invalid verification code", 401);
    }

    // Check if OTP exists and matches
    if (!user.otp_code || user.otp_code !== otp) {
      return error("Invalid verification code", 401);
    }

    // Check if OTP is expired
    if (!user.otp_expires_at || isOTPExpired(user.otp_expires_at)) {
      return error("Verification code has expired. Please request a new one.", 401);
    }

    // Clear OTP after successful verification
    await userModel.clearOTP(user.id);

    // Get user with roles and permissions
    const userWithRoles = await userModel.findWithRoles(user.id);
    if (!userWithRoles) {
      return error("User not found", 404);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roles: userWithRoles.roles.map(r => r.slug),
      permissions: userWithRoles.permissions.map(p => p.slug),
    });

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: userWithRoles.id,
          first_name: userWithRoles.first_name,
          last_name: userWithRoles.last_name,
          email: userWithRoles.email,
          phone: userWithRoles.phone,
          country: userWithRoles.country,
          city: userWithRoles.city,
          address: userWithRoles.address,
          status: userWithRoles.status,
          roles: userWithRoles.roles,
          permissions: userWithRoles.permissions.map(p => p.slug),
        },
        token,
      },
    });

    // Set httpOnly cookie for server-side auth
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;

  } catch (error: unknown) {
    console.error("OTP verification error:", error);
    return error("An error occurred during verification", 500);
  }
}
