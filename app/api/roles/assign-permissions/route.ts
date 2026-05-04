export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, isAdmin } from "@/lib/auth/middleware";
import { roleModel, logModel } from "@/lib/db/models";
import { assignPermissionsSchema } from "@/lib/validators/role";
import { success, error, validationError, forbidden, notFound } from "@/lib/utils/response";
import type { JWTPayload } from "@/types";

// POST assign permissions to role
export const POST = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    if (!isAdmin(auth)) {
      return forbidden("You do not have permission to assign permissions");
    }

    const body = await request.json();
    
    const validation = assignPermissionsSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const { role_id, permission_ids } = validation.data;

    // Check if role exists
    const role = await roleModel.findById(role_id);
    if (!role) {
      return notFound("Role not found");
    }

    // Assign permissions
    await roleModel.assignPermissions(role_id, permission_ids);

    // Log the action
    await logModel.log(
      "update",
      "roles",
      role_id,
      auth.userId,
      `Permissions assigned: ${permission_ids.join(", ")}`
    );

    const updatedRole = await roleModel.findWithPermissions(role_id);
    return success(updatedRole, "Permissions assigned successfully");

  } catch (err: unknown) {
    console.error("Assign permissions error:", err);
    return error("Failed to assign permissions", 500);
  }
});
