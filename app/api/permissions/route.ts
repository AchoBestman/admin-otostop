import { NextRequest } from "next/server";
import { withAuth, isAdmin } from "@/lib/auth/middleware";
import { permissionModel } from "@/lib/db/models";
import { success, error, forbidden } from "@/lib/utils/response";
import type { JWTPayload } from "@/types";

// GET all permissions list
export const GET = withAuth(async (_request: NextRequest, _context, auth: JWTPayload) => {
  try {
    if (!isAdmin(auth)) {
      return forbidden("You do not have permission to view permissions");
    }

    const permissions = await permissionModel.findAll({
      orderBy: "name",
      order: "ASC",
    });

    return success(permissions);

  } catch (err) {
    console.error("Permissions list error:", err);
    return error("Failed to fetch permissions", 500);
  }
});
