import { z } from "zod";

export const createUserSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["activated", "deactivated"]).default("activated"),
  role_ids: z.array(z.number()).optional(),
});

export const updateUserSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters").optional(),
  last_name: z.string().min(2, "Last name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["activated", "deactivated"]).optional(),
  role_ids: z.array(z.number()).optional(),
});

export const toggleStatusSchema = z.object({
  status: z.enum(["activated", "deactivated"]),
});

export const assignRolesSchema = z.object({
  role_ids: z.array(z.number()).min(1, "At least one role is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ToggleStatusInput = z.infer<typeof toggleStatusSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
