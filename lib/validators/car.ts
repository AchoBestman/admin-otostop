import { z } from "zod";

export const equipmentSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Le titre de l'équipement est requis"),
  description: z.string().optional(),
});

export const carSchema = z.object({
  title: z.string().min(2, "Le titre doit avoir au moins 2 caractères"),
  sub_title: z.string().min(2, "Le sous-titre doit avoir au moins 2 caractères"),
  description: z.string().optional().nullable(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().min(0),
  equipments: z.array(equipmentSchema).optional().nullable(),
  price: z.coerce.number().min(0),
  cover_image: z.string().min(1, "L'image de couverture est requise"),
  profile_image: z.string().optional().nullable(),
  back_image: z.string().optional().nullable(),
  front_image: z.string().optional().nullable(),
  interior_image: z.string().optional().nullable(),
  category_id: z.coerce.number().min(1, "La catégorie est requise"),
});

export const createCarSchema = carSchema;

export const updateCarSchema = carSchema.partial().extend({
  id: z.number(),
});

export type CreateCarInput = z.infer<typeof createCarSchema>;
export type UpdateCarInput = z.infer<typeof updateCarSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
