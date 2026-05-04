"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createCategorySchema, type CreateCategoryInput } from "@/lib/validators/category"
import type { Category } from "@/types"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onSuccess: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [preview, setPreview] = React.useState<string | null>(category?.cover_image || null)
  
  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      libelle: category?.libelle || "",
      description: category?.description || "",
      cover_image: category?.cover_image || "",
    },
  })

  // Reset form when category changes
  React.useEffect(() => {
    if (category) {
      form.reset({
        libelle: category.libelle,
        description: category.description || "",
        cover_image: category.cover_image || "",
      })
      setPreview(category.cover_image)
    } else {
      form.reset({
        libelle: "",
        description: "",
        cover_image: "",
      })
      setPreview(null)
    }
  }, [category, form, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5Mo)")
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {
        form.setValue("cover_image", result.data.url)
        setPreview(result.data.url)
        toast.success("Image téléchargée")
      } else {
        toast.error(result.message || "Erreur lors du téléchargement")
      }
    } catch (err) {
      toast.error("Erreur lors du téléchargement de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    form.setValue("cover_image", "")
    setPreview(null)
  }

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      const url = category 
        ? `/api/categories/${category.id}` 
        : "/api/categories"
      
      const method = category ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(category ? "Catégorie modifiée" : "Catégorie créée")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.message || "Une erreur est survenue")
      }
    } catch (err) {
      toast.error("Une erreur est survenue")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Modifier la catégorie" : "Ajouter une catégorie"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour {category ? "modifier" : "créer"} la catégorie.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="libelle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de la catégorie" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brève description..." 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Image de couverture (optionnel)</FormLabel>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 bg-muted/30">
                {preview ? (
                  <div className="relative w-full aspect-video rounded-md overflow-hidden group">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-32 hover:bg-muted transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      )}
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Cliquez pour télécharger</span> ou glisser-déposer
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou WEBP (max 5Mo)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {category ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
