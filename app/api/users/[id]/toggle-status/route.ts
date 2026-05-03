import { NextRequest } from "next/server";
import { withPermission } from "@/lib/auth/middleware";
import { userModel, logModel } from "@/lib/db/models";
import { toggleStatusSchema } from "@/lib/validators/user";
import { success, error, validationError, notFound } from "@/lib/utils/response";
import type { JWTPayload, User } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH toggle user status
export const PATCH = withPermission(
  "can_toggle_activated_an_account",
  async (request: NextRequest, context: RouteContext, auth: JWTPayload) => {
    try {
      const params = await context.params;
      const userId = parseInt(params.id);
      const body = await request.json();

      // Validate input
      const validation = toggleStatusSchema.safeParse(body);
      if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
        return validationError(errors);
      }

      const { status } = validation.data;

      // Cannot toggle yourself
      if (userId === auth.userId) {
        return error("You cannot change your own account status", 400);
      }

      // Check if user exists
      const user = await userModel.findById(userId);
      if (!user) {
        return notFound("User not found");
      }

      // Check if trying to toggle root user
      const isTargetRoot = await userModel.hasRole(userId, "root");
      if (isTargetRoot) {
        return error("Cannot toggle root user status", 403);
      }

      // Update status
      await userModel.update(userId, { status } as Partial<User>, auth.userId);

      // Log the action
      await logModel.log(
        "update",
        "users",
        userId,
        auth.userId,
        `User status changed to ${status}`
      );

      // Get updated user
      const updatedUser = await userModel.findWithRoles(userId);

      return success(updatedUser, `User ${status === "activated" ? "activated" : "deactivated"} successfully`);

    } catch (err) {
      console.error("Toggle status error:", err);
      return error("Failed to toggle user status", 500);
    }
  }
);
