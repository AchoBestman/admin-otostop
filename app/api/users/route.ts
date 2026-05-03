import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth, isAdmin } from "@/lib/auth/middleware";
import { userModel, logModel, roleModel } from "@/lib/db/models";
import { createUserSchema } from "@/lib/validators/user";
import { paginated, success, error, validationError, forbidden } from "@/lib/utils/response";
import type { JWTPayload, User } from "@/types";

// GET users list with pagination and filtering
export const GET = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    // Check if user has permission to view users
    if (!isAdmin(auth)) {
      return forbidden("You do not have permission to view users");
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const orderBy = searchParams.get("sort") || "created_at";
    const order = (searchParams.get("order") || "DESC").toUpperCase() as "ASC" | "DESC";

    // Build where conditions
    const where: Record<string, unknown> = {};
    if (status && (status === "activated" || status === "deactivated")) {
      where.status = status;
    }

    // Search with pagination
    const result = await userModel.search({
      searchFields: ["first_name", "last_name", "email", "phone", "city", "country"],
      searchTerm: search,
      where,
      page,
      limit,
      orderBy,
      order,
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
    // Check if user has permission to create users
    if (!isAdmin(auth)) {
      return forbidden("You do not have permission to create users");
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
    await logModel.log("create", "users", userId, auth.userId, "User created by admin");

    // Get created user with roles
    const user = await userModel.findWithRoles(userId);
    if (!user) {
      return error("Failed to create user", 500);
    }

    return success(user, "User created successfully");

  } catch (error: unknown) {
    console.error("Create user error:", error);
    return error("Failed to create user", 500);
  }
});
