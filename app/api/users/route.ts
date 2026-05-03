export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth, isRoot, isAdmin } from "@/lib/auth/middleware";
import { userModel, logModel, roleModel } from "@/lib/db/models";
import { createUserSchema } from "@/lib/validators/user";
import { generateResetToken } from "@/lib/auth/jwt";
import { sendMail } from "@/lib/mail/transporter";
import { passwordResetTemplate } from "@/lib/mail/templates";
import { parseQueryParams, buildPrismaWhere } from "@/lib/utils/query";
import { paginated, success, error, validationError, forbidden } from "@/lib/utils/response";
import type { JWTPayload, User } from "@/types";

// GET users list with pagination and filtering
export const GET = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    // Check if user has permission to view users
    if (!isAdmin(auth)) {
      return forbidden("You do not have permission to view users");
    }

    // Use unified query parser
    const params = parseQueryParams(request);
    const where = buildPrismaWhere(params);

    // Search with pagination
    const result = await userModel.search({
      searchFields: ["first_name", "last_name", "email", "phone", "city", "country"],
      searchTerm: params.search,
      where,
      page: params.page,
      limit: params.limit,
      orderBy: params.sortBy,
      order: params.order,
    });

    // Transform to safe users (remove passwords)
    const safeUsers = result.data.map(user => userModel.toSafeUser(user));

    return paginated(safeUsers, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });

  } catch (error: unknown) {
    console.error("Users list error:", error);
    return error("Failed to fetch users", 500);
  }
});

// POST create new user
export const POST = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    // Only root can create users from the dashboard
    if (!isRoot(auth)) {
      return forbidden("Only root users can create accounts from the dashboard");
    }

    const body = await request.json();
    
    // Validate input
    const validation = createUserSchema.safeParse(body);
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

    // Handle password: if not provided, generate a random one
    // In both cases, we will send a password reset email as per user request
    const password = data.password || Math.random().toString(36).slice(-16);
    const hashedPassword = await bcrypt.hash(password, 12);

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
      status: data.status,
    } as Partial<User>, auth.userId);

    // Assign roles if provided
    if (data.role_ids && data.role_ids.length > 0) {
      await userModel.assignRoles(userId, data.role_ids);
    } else {
      // Assign default customer role
      const customerRole = await roleModel.findBySlug("customer");
      if (customerRole) {
        await userModel.assignRoles(userId, [customerRole.id]);
      }
    }

    // Log the action
    await logModel.log("create", "users", userId, auth.userId, "User created by root");

    // Generate reset token and send email
    const resetToken = generateResetToken(data.email);
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    await sendMail({
      type: "noreply",
      to: data.email,
      subject: "Initialisation de votre compte - OtoStop Global+",
      html: passwordResetTemplate(data.first_name, resetLink),
    });

    // Get created user with roles
    const user = await userModel.findWithRoles(userId);
    if (!user) {
      return error("Failed to create user", 500);
    }

    return success(user, "User created successfully. A password reset email has been sent.");

  } catch (error: unknown) {
    console.error("Create user error:", error);
    return error("Failed to create user", 500);
  }
});
