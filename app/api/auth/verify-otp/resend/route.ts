export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { userModel } from "@/lib/db/models";
import { generateOTP, getOTPExpiration } from "@/lib/auth/jwt";
import { sendMail } from "@/lib/mail/transporter";
import { otpTemplate } from "@/lib/mail/templates";
import { success, error, validationError } from "@/lib/utils/response";

const resendSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = resendSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const { email } = validation.data;

    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      // For security, don't reveal if user exists
      return success({ email }, "Si un compte existe, un nouveau code a été envoyé.");
    }

    // Check if user is activated
    if (user.status === "deactivated") {
      return error("Votre compte a été désactivé. Veuillez contacter le support.", 403);
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
      subject: "Nouveau code de vérification - OtoStop Global+",
      html: otpTemplate(user.first_name, otp),
    });

    if (!emailSent) {
      throw new Error("Failed to send email");
    }

    return success(
      { email: user.email },
      "Un nouveau code a été envoyé à votre adresse email"
    );

  } catch (err: unknown) {
    console.error("Resend OTP error:", err);
    return error("Une erreur est survenue lors de l'envoi du code", 500);
  }
}
