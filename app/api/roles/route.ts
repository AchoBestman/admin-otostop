export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, isAdmin, isRoot } from "@/lib/auth/middleware";
import { roleModel, logModel } from "@/lib/db/models";
import { createRoleSchema } from "@/lib/validators/role";
import { parseQueryParams, buildPrismaWhere } from "@/lib/utils/query";
import { paginated, success, error, validationError, forbidden } from "@/lib/utils/response";
import type { JWTPayload, Role } from "@/types";

// GET roles list
export const GET = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    if (!isRoot(auth)) {
      return forbidden("Seul le super admin peut gérer l'administration");
    }

    // Use unified query parser
    const params = parseQueryParams(request);
    const where = buildPrismaWhere(params);

    const result = await roleModel.search({
      searchFields: ["name", "slug"],
      searchTerm: params.search,
      where,
      page: params.page,
      limit: params.limit,
      orderBy: params.sortBy === "created_at" ? "name" : params.sortBy, // Default sort for roles
      order: params.order,
    });

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      result.data.map(async (role) => {
        const roleWithPerms = await roleModel.findWithPermissions(role.id);
        return roleWithPerms;
      })
    );

    return paginated(rolesWithPermissions.filter(Boolean), {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });

  } catch (error: unknown) {
    console.error("Roles list error:", error);
    return error("Failed to fetch roles", 500);
  }
});

// POST create new role
export const POST = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    if (!isRoot(auth)) {
      return forbidden("Seul le super admin peut gérer l'administration");
    }

    const body = await request.json();
    
    const validation = createRoleSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const data = validation.data;

    // Check if slug already exists
    const existingRole = await roleModel.findBySlug(data.slug);
    if (existingRole) {
      return error("A role with this slug already exists", 409);
    }

    // Create role
    const roleId = await roleModel.create({
      name: data.name,
      slug: data.slug,
    } as Partial<Role>, auth.userId);

    // Assign permissions if provided
    if (data.permission_ids && data.permission_ids.length > 0) {
      await roleModel.assignPermissions(roleId, data.permission_ids);
    }

    // Log the action
    await logModel.log("create", "roles", roleId, auth.userId, "Role created");

    const role = await roleModel.findWithPermissions(roleId);
    return success(role, "Rôle créé avec succès");

  } catch (error: unknown) {
    console.error("Create role error:", error);
    return error("Failed to create role", 500);
  }
});
