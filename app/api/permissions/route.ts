export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, isAdmin, isRoot } from "@/lib/auth/middleware";
import { permissionModel } from "@/lib/db/models";
import { success, error, forbidden } from "@/lib/utils/response";
import type { JWTPayload } from "@/types";

// GET all permissions list
export const GET = withAuth(async (_request: NextRequest, _context, auth: JWTPayload) => {
  try {
    if (!isRoot(auth)) {
      return forbidden("Seul le super admin peut gérer l'administration");
    }

    const permissions = await permissionModel.findAll({
      orderBy: "name",
      order: "ASC",
    });

    return success(permissions);

  } catch (error: unknown) {
    console.error("Permissions list error:", error);
    return error("Failed to fetch permissions", 500);
  }
});
