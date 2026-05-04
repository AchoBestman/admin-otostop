import { createRepository } from "./base-model";
import prisma from "./prisma";
import type { User, Role, Permission, LogHistory, UserWithRoles, SafeUser, RoleWithPermissions, Category } from "@/types";

// User Repository
export const userRepository = createRepository<User>("users", [
  "id",
  "first_name",
  "last_name",
  "email",
  "password",
  "phone",
  "country",
  "city",
  "address",
  "status",
  "otp_code",
  "otp_expires_at",
]);

// Role Repository
export const roleRepository = createRepository<Role>("roles", ["id", "name", "slug"]);

// Permission Repository
export const permissionRepository = createRepository<Permission>("permissions", ["id", "name", "slug"]);

// Log History Repository
export const logRepository = createRepository<LogHistory>("logs_histories", [
  "id",
  "action",
  "model",
  "model_id",
  "user_id",
  "details",
]);

// Category Repository
export const categoryRepository = createRepository<Category>("categories", [
  "id",
  "libelle",
  "description",
  "slug",
  "cover_image",
]);

// Extended User Functions
export const userModel = {
  ...userRepository,

  // Find by email
  async findByEmail(email: string): Promise<User | null> {
    return userRepository.findOne({ email });
  },

  // Get user with roles and permissions
  async findWithRoles(userId: number): Promise<UserWithRoles | null> {
    const user = await prisma.users.findFirst({
      where: { id: userId, deleted_at: null },
      include: {
        user_roles: {
          include: {
            role: {
              include: {
                role_permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) return null;

    // Extract and flatten roles
    const roles = user.user_roles
      .map(ur => ur.role)
      .filter(r => r.deleted_at === null) as unknown as Role[];

    // Extract and flatten permissions
    const allPermissions = user.user_roles
      .flatMap(ur => ur.role.role_permissions.map(rp => rp.permission))
      .filter(p => p.deleted_at === null);
    
    // Deduplicate permissions by slug
    const uniquePermissionsMap = new Map();
    allPermissions.forEach(p => {
      uniquePermissionsMap.set(p.slug, p);
    });
    const permissions = Array.from(uniquePermissionsMap.values()) as unknown as Permission[];

    // Remove sensitive fields
    const { password: _, otp_code: __, otp_expires_at: ___, ...safeUser } = user;

    return {
      ...safeUser,
      roles,
      permissions,
    } as unknown as UserWithRoles;
  },

  // Convert to safe user (remove password, otp)
  toSafeUser(user: User, roles?: Role[], permissions?: string[]): SafeUser {
    const { password: _, otp_code: __, otp_expires_at: ___, ...safeUser } = user;
    return {
      ...safeUser,
      roles,
      permissions,
    };
  },

  // Assign roles to user
  async assignRoles(userId: number, roleIds: number[]): Promise<void> {
    await prisma.$transaction([
      // Remove existing roles
      prisma.user_roles.deleteMany({
        where: { user_id: userId }
      }),
      // Assign new roles
      ...(roleIds.length > 0 ? [
        prisma.user_roles.createMany({
          data: roleIds.map(roleId => ({
            user_id: userId,
            role_id: roleId
          }))
        })
      ] : [])
    ]);
  },

  // Set OTP for user
  async setOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: {
        otp_code: otp,
        otp_expires_at: expiresAt
      }
    });
  },

  // Clear OTP
  async clearOTP(userId: number): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: {
        otp_code: null,
        otp_expires_at: null
      }
    });
  },

  // Check if user has permission
  async hasPermission(userId: number, permissionSlug: string): Promise<boolean> {
    const count = await prisma.permissions.count({
      where: {
        slug: permissionSlug,
        deleted_at: null,
        role_permissions: {
          some: {
            role: {
              user_roles: {
                some: {
                  user_id: userId
                }
              }
            }
          }
        }
      }
    });
    return count > 0;
  },

  // Check if user has role
  async hasRole(userId: number, roleSlug: string): Promise<boolean> {
    const count = await prisma.roles.count({
      where: {
        slug: roleSlug,
        deleted_at: null,
        user_roles: {
          some: {
            user_id: userId
          }
        }
      }
    });
    return count > 0;
  },
};

// Extended Role Functions
export const roleModel = {
  ...roleRepository,

  // Find by slug
  async findBySlug(slug: string): Promise<Role | null> {
    return roleRepository.findOne({ slug });
  },

  // Get role with permissions
  async findWithPermissions(roleId: number): Promise<RoleWithPermissions | null> {
    const role = await prisma.roles.findFirst({
      where: { id: roleId, deleted_at: null },
      include: {
        role_permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) return null;

    const permissions = role.role_permissions
      .map(rp => rp.permission)
      .filter(p => p.deleted_at === null) as unknown as Permission[];

    return {
      ...role,
      permissions,
    } as unknown as RoleWithPermissions;
  },

  // Assign permissions to role
  async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await prisma.$transaction([
      // Remove existing permissions
      prisma.role_permissions.deleteMany({
        where: { role_id: roleId }
      }),
      // Assign new permissions
      ...(permissionIds.length > 0 ? [
        prisma.role_permissions.createMany({
          data: permissionIds.map(permId => ({
            role_id: roleId,
            permission_id: permId
          }))
        })
      ] : [])
    ]);
  },
};

// Extended Permission Functions
export const permissionModel = {
  ...permissionRepository,

  // Find by slug
  async findBySlug(slug: string): Promise<Permission | null> {
    return permissionRepository.findOne({ slug });
  },
};

// Log History Functions
export const logModel = {
  ...logRepository,

  // Create log entry
  async log(
    action: "create" | "update" | "delete" | "restore",
    model: string,
    modelId: number,
    userId?: number,
    details?: string
  ): Promise<void> {
    await prisma.logs_histories.create({
      data: {
        action,
        model,
        model_id: modelId,
        user_id: userId || null,
        details: details || null,
        created_at: new Date()
      }
    });
  },
};

// Category Functions
export const categoryModel = {
  ...categoryRepository,

  // Find by slug
  async findBySlug(slug: string): Promise<Category | null> {
    return categoryRepository.findOne({ slug });
  },

  // Find by libelle
  async findByLibelle(libelle: string): Promise<Category | null> {
    return categoryRepository.findOne({ libelle });
  },

  // Check uniqueness of libelle (excluding an ID for updates)
  async isLibelleUnique(libelle: string, excludeId?: number): Promise<boolean> {
    const where: any = { libelle, deleted_at: null };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await prisma.categories.count({ where });
    return count === 0;
  },
};
