export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, hasPermission } from "@/lib/auth/middleware";
import { carModel, logModel } from "@/lib/db/models";
import { updateCarSchema } from "@/lib/validators/car";
import { success, error, validationError, forbidden, notFound, rateLimitError } from "@/lib/utils/response";
import { slugify } from "@/lib/utils/string";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiting";
import type { JWTPayload, Car } from "@/types";

// GET car detail
export const GET = withAuth(async (request: NextRequest, { params }, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_view_cars")) {
      return forbidden("Vous n'avez pas la permission de consulter les véhicules");
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return error("ID invalide", 400);

    const car = await carModel.findById(id);
    if (!car) return notFound("Véhicule non trouvé");

    return success(car);

  } catch (err: unknown) {
    console.error("Car detail error:", err);
    return error("Failed to fetch vehicle details", 500);
  }
});

// PUT update car
export const PUT = withAuth(async (request: NextRequest, { params }, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_update_cars")) {
      return forbidden("Vous n'avez pas la permission de modifier un véhicule");
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return error("ID invalide", 400);

    const body = await request.json();
    const validation = updateCarSchema.safeParse({ ...body, id });
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const data = validation.data;

    const existingCar = await carModel.findById(id);
    if (!existingCar) return notFound("Véhicule non trouvé");

    // Check uniqueness of title if changed
    if (data.title && data.title !== existingCar.title) {
      const isUnique = await carModel.isTitleUnique(data.title, id);
      if (!isUnique) {
        return error("Un véhicule avec ce titre existe déjà", 409);
      }
    }

    const updateData: any = {
      title: data.title,
      sub_title: data.sub_title,
      description: data.description,
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
    };

    // Update slug if title changed
    if (data.title) {
      updateData.slug = slugify(data.title);
    }

    await carModel.update(id, updateData, auth.userId);

    // Log the action
    await logModel.log("update", "cars", id, auth.userId, `Vehicle ${existingCar.title} updated`);

    const updatedCar = await carModel.findById(id);
    return success(updatedCar, "Véhicule modifié avec succès");

  } catch (err: unknown) {
    console.error("Update car error:", err);
    return error("Failed to update vehicle", 500);
  }
});

// DELETE car
export const DELETE = withAuth(async (request: NextRequest, { params }, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_delete_cars")) {
      return forbidden("Vous n'avez pas la permission de supprimer un véhicule");
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return error("ID invalide", 400);

    const existingCar = await carModel.findById(id);
    if (!existingCar) return notFound("Véhicule non trouvé");

    await carModel.delete(id, auth.userId);

    // Log the action
    await logModel.log("delete", "cars", id, auth.userId, `Vehicle ${existingCar.title} deleted`);

    return success(null, "Véhicule supprimé avec succès");

  } catch (err: unknown) {
    console.error("Delete car error:", err);
    return error("Failed to delete vehicle", 500);
  }
});
