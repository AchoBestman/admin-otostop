import prisma from "./prisma";
import type { BaseModel } from "@/types";

interface FindOptions {
  includeDeleted?: boolean;
  orderBy?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

interface FindWhereOptions extends FindOptions {
  where?: Record<string, unknown>;
}

// Generic repository pattern for all models using Prisma
export function createRepository<T extends BaseModel>(tableName: string, _fields: string[]) {
  // Use a safer way to access the model
  const model = (prisma as Record<string, unknown>)[tableName] as {
    findMany: (args: { where?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number; skip?: number }) => Promise<T[]>;
    findFirst: (args: { where?: Record<string, unknown> }) => Promise<T | null>;
    count: (args: { where?: Record<string, unknown> }) => Promise<number>;
    create: (args: { data: Record<string, unknown> }) => Promise<T>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<T>;
    delete: (args: { where: Record<string, unknown> }) => Promise<T>;
  };

  if (!model) {
    throw new Error(`Model ${tableName} not found in Prisma client`);
  }

  return {
    // Find all records
    async findAll(options: FindOptions = {}): Promise<T[]> {
      const { includeDeleted = false, orderBy = "created_at", order = "desc", limit, offset } = options;
      
      const queryOptions: {
        where: Record<string, unknown>;
        orderBy: Record<string, string>;
        take?: number;
        skip?: number;
      } = {
        where: includeDeleted ? {} : { deleted_at: null },
        orderBy: { [orderBy]: order.toLowerCase() },
      };

      if (limit) {
        queryOptions.take = limit;
        if (offset) {
          queryOptions.skip = offset;
        }
      }

      return model.findMany(queryOptions);
    },

    // Find by ID
    async findById(id: number, includeDeleted = false): Promise<T | null> {
      const where: Record<string, unknown> = { id };
      if (!includeDeleted) {
        where.deleted_at = null;
      }
      return model.findFirst({ where });
    },

    // Find one by conditions
    async findOne(where: Record<string, unknown>, includeDeleted = false): Promise<T | null> {
      const fullWhere: Record<string, unknown> = { ...where };
      if (!includeDeleted) {
        fullWhere.deleted_at = null;
      }
      return model.findFirst({ where: fullWhere });
    },

    // Find many by conditions with options
    async findWhere(options: FindWhereOptions = {}): Promise<T[]> {
      const { where = {}, includeDeleted = false, orderBy = "created_at", order = "desc", limit, offset } = options;
      
      const fullWhere: Record<string, unknown> = { ...where };
      if (!includeDeleted) {
        fullWhere.deleted_at = null;
      }

      const queryOptions: {
        where: Record<string, unknown>;
        orderBy: Record<string, string>;
        take?: number;
        skip?: number;
      } = {
        where: fullWhere,
        orderBy: { [orderBy]: order.toLowerCase() },
      };

      if (limit) {
        queryOptions.take = limit;
        if (offset) {
          queryOptions.skip = offset;
        }
      }

      return model.findMany(queryOptions);
    },

    // Count records
    async count(where: Record<string, unknown> = {}, includeDeleted = false): Promise<number> {
      const fullWhere: Record<string, unknown> = { ...where };
      if (!includeDeleted) {
        fullWhere.deleted_at = null;
      }
      return model.count({ where: fullWhere });
    },

    // Create new record
    async create(data: Partial<T>, createdBy?: number): Promise<number> {
      const result = await model.create({
        data: {
          ...data,
          created_at: new Date(),
          created_by: createdBy || null,
        } as Record<string, unknown>,
      });
      return (result as { id: number }).id;
    },

    // Update record
    async update(id: number, data: Partial<T>, updatedBy?: number): Promise<boolean> {
      try {
        const result = await model.update({
          where: { id } as unknown as Record<string, unknown>,
          data: {
            ...data,
            updated_at: new Date(),
            updated_by: updatedBy || null,
          } as Record<string, unknown>,
        });
        return !!result;
      } catch {
        return false;
      }
    },

    // Soft delete record
    async delete(id: number, deletedBy?: number): Promise<boolean> {
      try {
        const result = await model.update({
          where: { id } as unknown as Record<string, unknown>,
          data: {
            deleted_at: new Date(),
            deleted_by: deletedBy || null,
          } as Record<string, unknown>,
        });
        return !!result;
      } catch {
        return false;
      }
    },

    // Restore soft-deleted record
    async restore(id: number): Promise<boolean> {
      try {
        const result = await model.update({
          where: { id } as unknown as Record<string, unknown>,
          data: {
            deleted_at: null,
            deleted_by: null,
          } as Record<string, unknown>,
        });
        return !!result;
      } catch {
        return false;
      }
    },

    // Hard delete (permanent)
    async hardDelete(id: number): Promise<boolean> {
      try {
        const result = await model.delete({
          where: { id } as unknown as Record<string, unknown>,
        });
        return !!result;
      } catch {
        return false;
      }
    },

    // Search with pagination
    async search(params: {
      searchFields?: string[];
      searchTerm?: string;
      where?: Record<string, unknown>;
      page?: number;
      limit?: number;
      orderBy?: string;
      order?: "asc" | "desc";
      includeDeleted?: boolean;
      include?: Record<string, unknown>;
    }): Promise<{ data: T[]; total: number; page: number; limit: number; totalPages: number }> {
      const {
        searchFields = [],
        searchTerm = "",
        where = {},
        page = 1,
        limit = 10,
        orderBy = "created_at",
        order = "desc",
        includeDeleted = false,
        include,
      } = params;

      const fullWhere: Record<string, unknown> = { ...where };
      
      if (!includeDeleted) {
        fullWhere.deleted_at = null;
      }

      if (searchTerm && searchFields.length > 0) {
        fullWhere.OR = searchFields.map(field => ({
          [field]: { contains: searchTerm }
        }));
      }

      const fullOrder = order.toLowerCase() as "asc" | "desc";

      const total = await model.count({ where: fullWhere });
      
      const skip = (page - 1) * limit;
      const data = await model.findMany({
        where: fullWhere,
        orderBy: { [orderBy]: fullOrder },
        include,
        take: limit,
        skip,
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
  };
}
