import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validators/auth";
import { userModel } from "@/lib/db/models";
import { generateOTP, getOTPExpiration } from "@/lib/auth/jwt";
import { sendMail } from "@/lib/mail/transporter";
import { otpTemplate } from "@/lib/mail/templates";
import { success, error, validationError } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      return error("Invalid email or password", 401);
    }

    // Check if user is activated
    if (user.status === "deactivated") {
      return error("Your account has been deactivated. Please contact support.", 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return error("Invalid email or password", 401);
    }

    // Generate OTP and set expiration
    const otp = generateOTP();
    const otpExpires = getOTPExpiration();

    // Store OTP in database
    await userModel.setOTP(user.id, otp, otpExpires);

    // Send OTP email
    const emailSent = await sendMail({
      type: "noreply",
      to: user.email,
      subject: "Code de vérification - OtoStop Global+",
      html: otpTemplate(user.first_name, otp),
    });

    if (!emailSent) {
      console.error("Failed to send OTP email to:", user.email);
      // Continue anyway - in production you might want to handle this differently
    }

    return success(
      { 
        email: user.email,
        message: "OTP sent to your email"
      },
      "Please check your email for the verification code"
    );

  } catch (error: unknown) {
    console.error("Login error:", error);
    return error("An error occurred during login", 500);
  }
}
