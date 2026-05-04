export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, hasPermission } from "@/lib/auth/middleware";
import { categoryModel, logModel } from "@/lib/db/models";
import { createCategorySchema } from "@/lib/validators/category";
import { parseQueryParams, buildPrismaWhere } from "@/lib/utils/query";
import { paginated, success, error, validationError, forbidden, rateLimitError } from "@/lib/utils/response";
import { slugify } from "@/lib/utils/string";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiting";
import type { JWTPayload, Category } from "@/types";

// GET categories list
export const GET = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_view_categories")) {
      return forbidden("Vous n'avez pas la permission de consulter les catégories");
    }

    const params = parseQueryParams(request);
    const where = buildPrismaWhere(params);

    const result = await categoryModel.search({
      searchFields: ["libelle", "slug", "description"],
      searchTerm: params.search,
      where,
      page: params.page,
      limit: params.limit,
      orderBy: params.sortBy || "libelle",
      order: params.order,
    });

    return paginated(result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });

  } catch (err: unknown) {
    console.error("Categories list error:", err);
    return error("Failed to fetch categories", 500);
  }
});

// POST create new category
export const POST = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_create_categories")) {
      return forbidden("Vous n'avez pas la permission de créer une catégorie");
    }

    const body = await request.json();
    
    const validation = createCategorySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const data = validation.data;

    // Check uniqueness of libelle
    const isUnique = await categoryModel.isLibelleUnique(data.libelle);
    if (!isUnique) {
      return error("Une catégorie avec ce libellé existe déjà", 409);
    }

    // Generate slug
    const slug = slugify(data.libelle);

    // Create category
    const categoryId = await categoryModel.create({
      libelle: data.libelle,
      description: data.description,
      slug,
      cover_image: data.cover_image,
    } as Partial<Category>, auth.userId);

    // Log the action
    await logModel.log("create", "categories", categoryId, auth.userId, `Category ${data.libelle} created`);

    const category = await categoryModel.findById(categoryId);
    return success(category, "Catégorie créée avec succès");

  } catch (err: unknown) {
    console.error("Create category error:", err);
    return error("Failed to create category", 500);
  }
});
