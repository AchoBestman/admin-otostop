import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validators/auth";
import { userModel, roleModel, logModel } from "@/lib/db/models";
import { sendMail } from "@/lib/mail/transporter";
import { welcomeTemplate } from "@/lib/mail/templates";
import { success, error, validationError } from "@/lib/utils/response";
import type { User } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const data = validation.data;

    // Check if email already exists
    const existingUser = await userModel.findByEmail(data.email);
    if (existingUser) {
      return error("An account with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const userId = await userModel.create({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone || null,
      country: data.country || null,
      city: data.city || null,
      address: data.address || null,
      status: "activated",
    } as Partial<User>);

    // Assign default customer role
    const customerRole = await roleModel.findBySlug("customer");
    if (customerRole) {
      await userModel.assignRoles(userId, [customerRole.id]);
    }

    // Log the action
    await logModel.log("create", "users", userId, undefined, "User registered");

    // Send welcome email
    await sendMail({
      type: "noreply",
      to: data.email,
      subject: "Bienvenue chez OtoStop Global+",
      html: welcomeTemplate(data.first_name),
    });

    // Get created user without password
    const user = await userModel.findById(userId);
    if (!user) {
      return error("Failed to create user", 500);
    }

    const safeUser = userModel.toSafeUser(user);

    return success(safeUser, "Account created successfully");

  } catch (err: unknown) {
    console.error("Registration error:", err);
    return error("An error occurred during registration", 500);
  }
}
