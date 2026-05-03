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
export function createRepository<T extends BaseModel>(tableName: string, fields: string[]) {
  // @ts-ignore - Dynamic access to prisma models
  const model = prisma[tableName];

  return {
    // Find all records
    async findAll(options: FindOptions = {}): Promise<T[]> {
      const { includeDeleted = false, orderBy = "created_at", order = "desc", limit, offset } = options;
      
      const queryOptions: any = {
        where: includeDeleted ? {} : { deleted_at: null },
        orderBy: { [orderBy]: order },
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
      const where: any = { id };
      if (!includeDeleted) {
        where.deleted_at = null;
      }
      return model.findFirst({ where });
    },

    // Find one by conditions
    async findOne(where: Record<string, unknown>, includeDeleted = false): Promise<T | null> {
      const fullWhere: any = { ...where };
      if (!includeDeleted) {
        fullWhere.deleted_at = null;
      }
      return model.findFirst({ where: fullWhere });
    },

    // Find many by conditions with options
    async findWhere(options: FindWhereOptions = {}): Promise<T[]> {
      const { where = {}, includeDeleted = false, orderBy = "created_at", order = "desc", limit, offset } = options;
      
      const fullWhere: any = { ...where };
      if (!includeDeleted) {
        fullWhere.deleted_at = null;
      }

      const queryOptions: any = {
        where: fullWhere,
        orderBy: { [orderBy]: order },
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
      const fullWhere: any = { ...where };
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
        },
      });
      return result.id;
    },

    // Update record
    async update(id: number, data: Partial<T>, updatedBy?: number): Promise<boolean> {
      try {
        const result = await model.update({
          where: { id, deleted_at: null },
          data: {
            ...data,
            updated_at: new Date(),
            updated_by: updatedBy || null,
          },
        });
        return !!result;
      } catch (error) {
        return false;
      }
    },

    // Soft delete record
    async delete(id: number, deletedBy?: number): Promise<boolean> {
      try {
        const result = await model.update({
          where: { id, deleted_at: null },
          data: {
            deleted_at: new Date(),
            deleted_by: deletedBy || null,
          },
        });
        return !!result;
      } catch (error) {
        return false;
      }
    },

    // Restore soft-deleted record
    async restore(id: number): Promise<boolean> {
      try {
        const result = await model.update({
          where: { id },
          data: {
            deleted_at: null,
            deleted_by: null,
          },
        });
        return !!result;
      } catch (error) {
        return false;
      }
    },

    // Hard delete (permanent)
    async hardDelete(id: number): Promise<boolean> {
      try {
        const result = await model.delete({
          where: { id },
        });
        return !!result;
      } catch (error) {
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
      } = params;

      const fullWhere: any = { ...where };
      
      if (!includeDeleted) {
        fullWhere.deleted_at = null;
      }

      if (searchTerm && searchFields.length > 0) {
        fullWhere.OR = searchFields.map(field => ({
          [field]: { contains: searchTerm }
        }));
      }

      const total = await model.count({ where: fullWhere });
      
      const skip = (page - 1) * limit;
      const data = await model.findMany({
        where: fullWhere,
        orderBy: { [orderBy]: order },
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
