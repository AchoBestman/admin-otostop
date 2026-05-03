import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth, isAdmin, isRoot } from "@/lib/auth/middleware";
import { userModel, logModel } from "@/lib/db/models";
import { updateUserSchema } from "@/lib/validators/user";
import { success, error, validationError, forbidden, notFound } from "@/lib/utils/response";
import type { JWTPayload, User } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

// GET single user with roles
export const GET = withAuth(async (_request: NextRequest, context: RouteContext, auth: JWTPayload) => {
  try {
    if (!isAdmin(auth)) {
      return forbidden("You do not have permission to view users");
    }

    const params = await context.params;
    const userId = parseInt(params.id);

    const user = await userModel.findWithRoles(userId);
    if (!user) {
      return notFound("User not found");
    }

    return success(user);

  } catch (error: unknown) {
    console.error("Get user error:", error);
    return error("Failed to fetch user", 500);
  }
});

// PUT update user
export const PUT = withAuth(async (request: NextRequest, context: RouteContext, auth: JWTPayload) => {
  try {
    if (!isAdmin(auth)) {
      return forbidden("You do not have permission to update users");
    }

    const params = await context.params;
    const userId = parseInt(params.id);
    const body = await request.json();

    // Validate input
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const data = validation.data;

    // Check if user exists
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      return notFound("User not found");
    }

    // Check if trying to modify root user without being root
    const isTargetRoot = await userModel.hasRole(userId, "root");
    if (isTargetRoot && !isRoot(auth)) {
      return forbidden("Only root users can modify other root users");
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await userModel.findByEmail(data.email);
      if (emailExists) {
        return error("Email already in use", 409);
      }
    }

    // Build update data
    const updateData: Partial<User> = {};
    if (data.first_name) updateData.first_name = data.first_name;
    if (data.last_name) updateData.last_name = data.last_name;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.country !== undefined) updateData.country = data.country || null;
    if (data.city !== undefined) updateData.city = data.city || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.status) updateData.status = data.status;

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    // Update user
    await userModel.update(userId, updateData, auth.userId);

    // Update roles if provided
    if (data.role_ids) {
      await userModel.assignRoles(userId, data.role_ids);
    }

    // Log the action
    await logModel.log("update", "users", userId, auth.userId, "User updated");

    // Get updated user
    const user = await userModel.findWithRoles(userId);
    return success(user, "User updated successfully");

  } catch (error: unknown) {
    console.error("Update user error:", error);
    return error("Failed to update user", 500);
  }
});

// DELETE soft delete user
export const DELETE = withAuth(async (_request: NextRequest, context: RouteContext, auth: JWTPayload) => {
  try {
    // Check permission
    const hasPermission = auth.permissions.includes("can_delete_user") || isRoot(auth);
    if (!hasPermission) {
      return forbidden("You do not have permission to delete users");
    }

    const params = await context.params;
    const userId = parseInt(params.id);

    // Cannot delete yourself
    if (userId === auth.userId) {
      return error("You cannot delete your own account", 400);
    }

    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return notFound("User not found");
    }

    // Check if trying to delete root user without being root
    const isTargetRoot = await userModel.hasRole(userId, "root");
    if (isTargetRoot && !isRoot(auth)) {
      return forbidden("Only root users can delete other root users");
    }

    // Soft delete
    await userModel.delete(userId, auth.userId);

    // Log the action
    await logModel.log("delete", "users", userId, auth.userId, "User deleted");

    return success(null, "User deleted successfully");

  } catch (error: unknown) {
    console.error("Delete user error:", error);
    return error("Failed to delete user", 500);
  }
});
