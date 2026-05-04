// Base model fields (soft delete, timestamps, audit)
export interface BaseModel {
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
}

// User types
export interface User extends BaseModel {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  status: "activated" | "deactivated";
  otp_code: string | null;
  otp_expires_at: Date | null;
}

export interface UserWithRoles extends Omit<User, "password"> {
  roles: Role[];
  permissions: Permission[];
}

export interface SafeUser extends Omit<User, "password" | "otp_code" | "otp_expires_at"> {
  roles?: Role[];
  permissions?: string[];
}

// Role types
export interface Role extends BaseModel {
  id: number;
  name: string;
  slug: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

// Permission types
export interface Permission extends BaseModel {
  id: number;
  name: string;
  slug: string;
}

// Category types
export interface Category extends BaseModel {
  id: number;
  libelle: string;
  description: string | null;
  slug: string;
  cover_image: string | null;
}

// User-Role junction
export interface UserRole {
  user_id: number;
  role_id: number;
}

// Role-Permission junction
export interface RolePermission {
  role_id: number;
  permission_id: number;
}

// Logs History
export interface LogHistory extends BaseModel {
  id: number;
  action: "create" | "update" | "delete" | "restore";
  model: string;
  model_id: number;
  user_id: number | null;
  details: string | null;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query params for listing
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  from_date?: string;
  to_date?: string;
  status?: string;
  [key: string]: string | number | undefined;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
}

// Email types
export type EmailType = "noreply" | "contact";

export interface EmailOptions {
  type: EmailType;
  to: string;
  subject: string;
  html: string;
}

// Session/Auth context
export interface AuthSession {
  user: SafeUser;
  token: string;
}
