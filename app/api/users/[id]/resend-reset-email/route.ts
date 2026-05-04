export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, isRoot } from "@/lib/auth/middleware";
import { userModel, logModel } from "@/lib/db/models";
import { generateResetToken } from "@/lib/auth/jwt";
import { sendMail } from "@/lib/mail/transporter";
import { passwordResetTemplate } from "@/lib/mail/templates";
import { success, error, forbidden, notFound } from "@/lib/utils/response";
import type { JWTPayload } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/users/[id]/resend-reset-email
export const POST = withAuth(async (_request: NextRequest, context: RouteContext, auth: JWTPayload) => {
  try {
    // Only root (super admin) can resend reset emails from the user list
    if (!isRoot(auth)) {
      return forbidden("Only root users can resend password reset emails");
    }

    const params = await context.params;
    const userId = parseInt(params.id);

    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      return notFound("User not found");
    }

    // Generate reset token and send email
    const resetToken = generateResetToken(user.email);
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    await sendMail({
      type: "noreply",
      to: user.email,
      subject: "Réinitialisation de votre mot de passe - OtoStop Global+",
      html: passwordResetTemplate(user.first_name, resetLink),
    });

    // Log the action
    await logModel.log("update", "users", userId, auth.userId, "Password reset email resent by root");

    return success(null, "Reset email sent successfully to " + user.email);

  } catch (err: unknown) {
    console.error("Resend reset email error:", err);
    return error("Failed to send reset email", 500);
  }
});
