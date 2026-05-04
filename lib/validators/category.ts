import { z } from "zod";

export const categorySchema = z.object({
  libelle: z.string().min(2, "Le libellé doit avoir au moins 2 caractères"),
  description: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  order: z.coerce.number().default(0),
});

export const createCategorySchema = categorySchema;

export const updateCategorySchema = categorySchema.partial().extend({
  id: z.number(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
