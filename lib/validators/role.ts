import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters").optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only")
    .optional(),
});

export const assignPermissionsSchema = z.object({
  role_id: z.number().positive("Role ID is required"),
  permission_ids: z.array(z.number()).min(1, "At least one permission is required"),
});

export const createPermissionSchema = z.object({
  name: z.string().min(2, "Permission name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9_]+$/, "Slug must be lowercase alphanumeric with underscores only"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
