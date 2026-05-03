export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, isAdmin, isRoot } from "@/lib/auth/middleware";
import { roleModel, logModel } from "@/lib/db/models";
import { updateRoleSchema } from "@/lib/validators/role";
import { success, error, validationError, forbidden, notFound } from "@/lib/utils/response";
import type { JWTPayload, Role } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

// GET single role with permissions
export const GET = withAuth(async (_request: NextRequest, context: RouteContext, auth: JWTPayload) => {
  try {
    if (!isAdmin(auth)) {
      return forbidden("You do not have permission to view roles");
    }

    const params = await context.params;
    const roleId = parseInt(params.id);

    const role = await roleModel.findWithPermissions(roleId);
    if (!role) {
      return notFound("Role not found");
    }

    return success(role);

  } catch (error: unknown) {
    console.error("Get role error:", error);
    return error("Failed to fetch role", 500);
  }
});

// PATCH update role
export const PATCH = withAuth(async (request: NextRequest, context: RouteContext, auth: JWTPayload) => {
  try {
    if (!isAdmin(auth)) {
      return forbidden("You do not have permission to update roles");
    }

    const params = await context.params;
    const roleId = parseInt(params.id);
    const body = await request.json();

    const validation = updateRoleSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const data = validation.data;

    // Check if role exists
    const existingRole = await roleModel.findById(roleId);
    if (!existingRole) {
      return notFound("Role not found");
    }

    // Prevent modifying system roles (root, admin, customer)
    const systemRoles = ["root", "admin", "customer"];
    if (systemRoles.includes(existingRole.slug) && data.slug && data.slug !== existingRole.slug) {
      return error("Cannot modify system role slugs", 400);
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== existingRole.slug) {
      const slugExists = await roleModel.findBySlug(data.slug);
      if (slugExists) {
        return error("A role with this slug already exists", 409);
      }
    }

    // Update role
    const updateData: Partial<Role> = {};
    if (data.name) updateData.name = data.name;
    if (data.slug) updateData.slug = data.slug;

    await roleModel.update(roleId, updateData, auth.userId);

    // Log the action
    await logModel.log("update", "roles", roleId, auth.userId, "Role updated");

    const role = await roleModel.findWithPermissions(roleId);
    return success(role, "Role updated successfully");

  } catch (error: unknown) {
    console.error("Update role error:", error);
    return error("Failed to update role", 500);
  }
});

// DELETE soft delete role
export const DELETE = withAuth(async (_request: NextRequest, context: RouteContext, auth: JWTPayload) => {
  try {
    if (!isRoot(auth)) {
      return forbidden("Only root users can delete roles");
    }

    const params = await context.params;
    const roleId = parseInt(params.id);

    // Check if role exists
    const role = await roleModel.findById(roleId);
    if (!role) {
      return notFound("Role not found");
    }

    // Prevent deleting system roles
    const systemRoles = ["root", "admin", "customer"];
    if (systemRoles.includes(role.slug)) {
      return error("Cannot delete system roles", 400);
    }

    // Soft delete
    await roleModel.delete(roleId, auth.userId);

    // Log the action
    await logModel.log("delete", "roles", roleId, auth.userId, "Role deleted");

    return success(null, "Role deleted successfully");

  } catch (error: unknown) {
    console.error("Delete role error:", error);
    return error("Failed to delete role", 500);
  }
});
