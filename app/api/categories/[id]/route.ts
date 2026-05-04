export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, hasPermission } from "@/lib/auth/middleware";
import { categoryModel, logModel } from "@/lib/db/models";
import { updateCategorySchema } from "@/lib/validators/category";
import { success, error, validationError, forbidden, notFound, rateLimitError } from "@/lib/utils/response";
import { slugify } from "@/lib/utils/string";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiting";
import type { JWTPayload, Category } from "@/types";

// GET category detail
export const GET = withAuth(async (request: NextRequest, { params }, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_view_categories")) {
      return forbidden("Vous n'avez pas la permission de consulter les catégories");
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return error("ID invalide", 400);

    const category = await categoryModel.findById(id);
    if (!category) return notFound("Catégorie non trouvée");

    return success(category);

  } catch (err: unknown) {
    console.error("Category detail error:", err);
    return error("Failed to fetch category details", 500);
  }
});

// PUT update category
export const PUT = withAuth(async (request: NextRequest, { params }, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_update_categories")) {
      return forbidden("Vous n'avez pas la permission de modifier une catégorie");
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return error("ID invalide", 400);

    const body = await request.json();
    const validation = updateCategorySchema.safeParse({ ...body, id });
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return validationError(errors);
    }

    const data = validation.data;

    const existingCategory = await categoryModel.findById(id);
    if (!existingCategory) return notFound("Catégorie non trouvée");

    // Check uniqueness of libelle if changed
    if (data.libelle && data.libelle !== existingCategory.libelle) {
      const isUnique = await categoryModel.isLibelleUnique(data.libelle, id);
      if (!isUnique) {
        return error("Une catégorie avec ce libellé existe déjà", 409);
      }
    }

    const updateData: Partial<Category> = {
      libelle: data.libelle,
      description: data.description,
      cover_image: data.cover_image,
      order: data.order,
    };

    // Update slug if libelle changed
    if (data.libelle) {
      updateData.slug = slugify(data.libelle);
    }

    await categoryModel.update(id, updateData, auth.userId);

    // Log the action
    await logModel.log("update", "categories", id, auth.userId, `Category ${existingCategory.libelle} updated`);

    const updatedCategory = await categoryModel.findById(id);
    return success(updatedCategory, "Catégorie modifiée avec succès");

  } catch (err: unknown) {
    console.error("Update category error:", err);
    return error("Failed to update category", 500);
  }
});

// DELETE category
export const DELETE = withAuth(async (request: NextRequest, { params }, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "api");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    if (!hasPermission(auth, "can_delete_categories")) {
      return forbidden("Vous n'avez pas la permission de supprimer une catégorie");
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return error("ID invalide", 400);

    const existingCategory = await categoryModel.findById(id);
    if (!existingCategory) return notFound("Catégorie non trouvée");

    await categoryModel.delete(id, auth.userId);

    // Log the action
    await logModel.log("delete", "categories", id, auth.userId, `Category ${existingCategory.libelle} deleted`);

    return success(null, "Catégorie supprimée avec succès");

  } catch (err: unknown) {
    console.error("Delete category error:", err);
    return error("Failed to delete category", 500);
  }
});
