export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, hasPermission } from "@/lib/auth/middleware";
import { carModel, logModel } from "@/lib/db/models";
import { createCarSchema } from "@/lib/validators/car";
import { parseQueryParams, buildPrismaWhere } from "@/lib/utils/query";
import { paginated, success, error, validationError, forbidden, rateLimitError } from "@/lib/utils/response";
import { slugify } from "@/lib/utils/string";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiting";
import type { JWTPayload, Car } from "@/types";

// GET cars list
export const GET = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_view_cars")) {
      return forbidden("Vous n'avez pas la permission de consulter les véhicules");
    }

    const params = parseQueryParams(request);
    const where = buildPrismaWhere(params);

    const result = await carModel.searchWithCategory({
      searchFields: ["title", "sub_title", "description", "slug"],
      searchTerm: params.search,
      where,
      page: params.page,
      limit: params.limit,
      orderBy: params.sortBy || "created_at",
      order: params.order,
    });

    return paginated(result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });

  } catch (err: unknown) {
    console.error("Cars list error:", err);
    return error("Failed to fetch vehicles", 500);
  }
});

// POST create new car
export const POST = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_create_cars")) {
      return forbidden("Vous n'avez pas la permission de créer un véhicule");
    }

    const body = await request.json();
    
    const validation = createCarSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const data = validation.data;

    // Check uniqueness of title
    const isUnique = await carModel.isTitleUnique(data.title);
    if (!isUnique) {
      return error("Un véhicule avec ce titre existe déjà", 409);
    }

    // Generate slug
    const slug = slugify(data.title);

    // Create car
    const carId = await carModel.create({
      title: data.title,
      sub_title: data.sub_title,
      description: data.description,
      slug,
      year: data.year,
      mileage: data.mileage,
      equipments: data.equipments,
      price: data.price,
      cover_image: data.cover_image,
      profile_image: data.profile_image,
      back_image: data.back_image,
      front_image: data.front_image,
      interior_image: data.interior_image,
      category_id: data.category_id,
    } as any, auth.userId);

    // Log the action
    await logModel.log("create", "cars", carId, auth.userId, `Vehicle ${data.title} created`);

    const car = await carModel.findById(carId);
    return success(car, "Véhicule créé avec succès");

  } catch (err: unknown) {
    console.error("Create car error:", err);
    return error("Failed to create vehicle", 500);
  }
});
