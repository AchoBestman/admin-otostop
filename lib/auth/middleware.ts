import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";
import { unauthorized, forbidden } from "@/lib/utils/response";
import { userModel } from "@/lib/db/models";
import type { JWTPayload } from "@/types";

// Extended request with auth context
export interface AuthenticatedRequest extends NextRequest {
  auth?: JWTPayload;
}

// Extract token from request
export function extractToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check cookies
  const tokenCookie = request.cookies.get("auth_token");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

// Verify authentication
export async function verifyAuth(request: NextRequest): Promise<JWTPayload | null> {
  const token = extractToken(request);
  if (!token) return null;

  const payload = verifyToken(token);
  return payload;
}

// Middleware wrapper for protected routes
export function withAuth(
  handler: (request: NextRequest, context: { params: Promise<Record<string, string>> }, auth: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const auth = await verifyAuth(request);
    if (!auth) {
      return unauthorized("Authentication required");
    }

    return handler(request, context, auth);
  };
}

// Middleware wrapper for routes requiring specific permission
export function withPermission(
  permission: string,
  handler: (request: NextRequest, context: { params: Promise<Record<string, string>> }, auth: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const auth = await verifyAuth(request);
    if (!auth) {
      return unauthorized("Authentication required");
    }

    // Check if user has permission
    const hasPermission = await userModel.hasPermission(auth.userId, permission);
    
    // Also check if user is root (root has all permissions)
    const isRoot = auth.roles.includes("root");
    
    if (!hasPermission && !isRoot) {
      return forbidden("You do not have permission to perform this action");
    }

    return handler(request, context, auth);
  };
}

// Middleware wrapper for routes requiring specific role
export function withRole(
  role: string | string[],
  handler: (request: NextRequest, context: { params: Promise<Record<string, string>> }, auth: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const auth = await verifyAuth(request);
    if (!auth) {
      return unauthorized("Authentication required");
    }

    const roles = Array.isArray(role) ? role : [role];
    const hasRole = roles.some(r => auth.roles.includes(r));
    
    // Root has access to everything
    const isRoot = auth.roles.includes("root");

    if (!hasRole && !isRoot) {
      return forbidden("You do not have the required role to access this resource");
    }

    return handler(request, context, auth);
  };
}

// Helper to check if user is root
export function isRoot(auth: JWTPayload): boolean {
  return auth.roles.includes("root");
}

// Helper to check if user is admin or root
export function isAdmin(auth: JWTPayload): boolean {
  return auth.roles.includes("admin") || auth.roles.includes("root");
}
