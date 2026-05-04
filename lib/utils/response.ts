import { NextResponse } from "next/server";
import type { ApiResponse, PaginatedResponse } from "@/types";

// Success response
export function success<T>(data: T, message = "Success"): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data,
  });
}

// Paginated success response
export function paginated<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number; totalPages: number },
  message = "Success"
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data,
    pagination,
  });
}

// Error response
export function error(
  message: string,
  status = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}

// Not found response
export function notFound(message = "Resource not found"): NextResponse<ApiResponse> {
  return error(message, 404);
}

// Unauthorized response
export function unauthorized(message = "Unauthorized"): NextResponse<ApiResponse> {
  return error(message, 401);
}

// Forbidden response
export function forbidden(message = "Forbidden"): NextResponse<ApiResponse> {
  return error(message, 403);
}

// Validation error response
export function validationError(errors: Record<string, string[]>): NextResponse<ApiResponse> {
  return error("Validation failed", 422, errors);
}

// Server error response
export function serverError(message = "Internal server error"): NextResponse<ApiResponse> {
  return error(message, 500);
}

// Rate limit error response
export function rateLimitError(resetAt: number): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message: "Trop de requêtes. Veuillez réessayer plus tard.",
      resetAt,
    },
    { 
      status: 429,
      headers: {
        "Retry-After": Math.ceil((resetAt - Date.now()) / 1000).toString()
      }
    }
  );
}
