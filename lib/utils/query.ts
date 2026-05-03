import { NextRequest } from "next/server";

export interface QueryParams {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  order: "asc" | "desc";
  from?: Date;
  to?: Date;
  status?: string;
  [key: string]: any;
}

export function parseQueryParams(request: NextRequest): QueryParams {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "created_at";
  const order = (searchParams.get("order")?.toLowerCase() || "desc") as "asc" | "desc";
  const status = searchParams.get("status") || undefined;

  const params: QueryParams = {
    page,
    limit,
    search,
    sortBy,
    order,
    status,
  };

  // Date range
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      params.from = fromDate;
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      // Set to end of day if only date is provided
      if (to.length <= 10) {
        toDate.setHours(23, 59, 59, 999);
      }
      params.to = toDate;
    }
  }

  // Add all other params as potential filters
  searchParams.forEach((value, key) => {
    if (!["page", "limit", "search", "sort", "order", "from", "to"].includes(key)) {
      params[key] = value;
    }
  });

  return params;
}

export function buildPrismaWhere(params: QueryParams) {
  const where: Record<string, any> = {
    deleted_at: null,
  };

  // Date range filter
  if (params.from || params.to) {
    where.created_at = {};
    if (params.from) {
      where.created_at.gte = params.from;
    }
    if (params.to) {
      where.created_at.lte = params.to;
    }
  }

  // Status filter
  if (params.status) {
    where.status = params.status;
  }

  // Add other generic filters
  Object.keys(params).forEach(key => {
    if (!["page", "limit", "search", "sortBy", "order", "from", "to", "status"].includes(key)) {
      where[key] = params[key];
    }
  });

  return where;
}
