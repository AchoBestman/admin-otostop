import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { userModel, logModel } from "@/lib/db/models";
import { verifyResetToken } from "@/lib/auth/jwt";
import { success, error, validationError } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const { token, password } = validation.data;

    // Verify reset token
    const tokenData = verifyResetToken(token);
    if (!tokenData) {
      return error("Invalid or expired reset link", 401);
    }

    // Find user by email
    const user = await userModel.findByEmail(tokenData.email);
    if (!user) {
      return error("User not found", 404);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    await userModel.update(user.id, { password: hashedPassword } as Partial<import("@/types").User>);

    // Log the action
    await logModel.log("update", "users", user.id, undefined, "Password reset");

    return success(null, "Password has been reset successfully");

  } catch (error: unknown) {
    console.error("Reset password error:", error);
    return error("An error occurred. Please try again.", 500);
  }
}
