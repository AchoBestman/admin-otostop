export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { passwordRequestSchema } from "@/lib/validators/auth";
import { userModel } from "@/lib/db/models";
import { generateResetToken } from "@/lib/auth/jwt";
import { sendMail } from "@/lib/mail/transporter";
import { passwordResetTemplate } from "@/lib/mail/templates";
import { success, error, validationError } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = passwordRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const { email } = validation.data;

    // Find user by email
    const user = await userModel.findByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return success(
        { email },
        "If an account exists with this email, you will receive a password reset link"
      );
    }

    // Generate reset token
    const resetToken = generateResetToken(email);
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    // Send reset email
    await sendMail({
      type: "noreply",
      to: user.email,
      subject: "Réinitialisation du mot de passe - OtoStop Global+",
      html: passwordResetTemplate(user.first_name, resetLink),
    });

    return success(
      { email },
      "If an account exists with this email, you will receive a password reset link"
    );

  } catch (error: unknown) {
    console.error("Password request error:", error);
    return error("An error occurred. Please try again.", 500);
  }
}
