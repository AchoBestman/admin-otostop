"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Upload, X, Plus, Trash2, ImageIcon } from "lucide-react"
import Image from "next/image"
import useSWR from "swr"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createCarSchema, type CreateCarInput } from "@/lib/validators/car"
import type { Car, Category } from "@/types"

interface CarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  car: Car | null
  onSuccess: () => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function CarDialog({
  open,
  onOpenChange,
  car,
  onSuccess,
}: CarDialogProps) {
  const [uploadingField, setUploadingField] = React.useState<string | null>(null)
  
  const { data: categoriesData } = useSWR<{ data: Category[] }>("/api/categories?limit=100", fetcher)
  const categories = categoriesData?.data || []

  const form = useForm<CreateCarInput>({
    resolver: zodResolver(createCarSchema),
    defaultValues: {
      title: "",
      sub_title: "",
      description: "",
      year: new Date().getFullYear(),
      mileage: 0,
      equipments: [],
      price: 0,
      cover_image: "",
      profile_image: "",
      back_image: "",
      front_image: "",
      interior_image: "",
      category_id: 0,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "equipments",
  })

  // Reset form when car changes
  React.useEffect(() => {
    if (car) {
      form.reset({
        title: car.title,
        sub_title: car.sub_title,
        description: car.description || "",
        year: car.year,
        mileage: car.mileage,
        equipments: car.equipments || [],
        price: car.price,
        cover_image: car.cover_image,
        profile_image: car.profile_image || "",
        back_image: car.back_image || "",
        front_image: car.front_image || "",
        interior_image: car.interior_image || "",
        category_id: car.category_id,
      })
    } else {
      form.reset({
        title: "",
        sub_title: "",
        description: "",
        year: new Date().getFullYear(),
        mileage: 0,
        equipments: [],
        price: 0,
        cover_image: "",
        profile_image: "",
        back_image: "",
        front_image: "",
        interior_image: "",
        category_id: 0,
      })
    }
  }, [car, form, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent, fieldName: keyof CreateCarInput) => {
    let file: File | undefined

    if ("files" in e.target && e.target.files?.[0]) {
      file = e.target.files[0]
    } else if ("dataTransfer" in e && e.dataTransfer.files?.[0]) {
      file = e.dataTransfer.files[0]
      e.preventDefault()
    }

    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5Mo)")
      return
    }

    try {
      setUploadingField(fieldName)
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {
        form.setValue(fieldName as any, result.data.url)
        toast.success("Image téléchargée")
      } else {
        toast.error(result.message || "Erreur lors du téléchargement")
      }
    } catch (err) {
      toast.error("Erreur lors du téléchargement de l'image")
    } finally {
      setUploadingField(null)
    }
  }

  const removeImage = (fieldName: keyof CreateCarInput) => {
    form.setValue(fieldName as any, "")
  }

  const onSubmit = async (data: CreateCarInput) => {
    try {
      const url = car ? `/api/cars/${car.id}` : "/api/cars"
      const method = car ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(car ? "Véhicule modifié" : "Véhicule créé")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.message || "Une erreur est survenue")
      }
    } catch (err) {
      toast.error("Une erreur est survenue")
    }
  }

  const renderImageUploader = (fieldName: keyof CreateCarInput, label: string, required = false) => {
    const value = form.watch(fieldName as any)
    const isUploading = uploadingField === fieldName

    return (
      <div className="space-y-2">
        <FormLabel className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
          {label}
        </FormLabel>
        <div className="relative aspect-video rounded-lg border-2 border-dashed border-border bg-muted/30 overflow-hidden group">
          {value ? (
            <>
              <Image src={value} alt={label} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => removeImage(fieldName)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <label 
              className="flex flex-col items-center justify-center cursor-pointer w-full h-full hover:bg-muted transition-colors border-2 border-dashed border-transparent hover:border-primary/50"
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleImageUpload(e, fieldName)
              }}
            >
              <div className="flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                )}
                <span className="text-xs text-muted-foreground">Cliquez ou glissez-déposez</span>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, fieldName)}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {car ? "Modifier le véhicule" : "Ajouter un véhicule"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les détails techniques et téléchargez les photos du véhicule.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre (Marque & Modèle)</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Toyota Camry 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sub_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sous-titre (Version/Finition)</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: 2.5L Hybrid XLE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseInt(val))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilométrage (km)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Détails supplémentaires sur le véhicule..." 
                      className="min-h-[100px]"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Équipements & Options</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => append({ id: fields.length + 1, title: "", description: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start border p-3 rounded-md bg-muted/10">
                    <div className="flex-1 space-y-3">
                      <FormField
                        control={form.control}
                        name={`equipments.${index}.title`}
                        render={({ field }) => (
                          <Input placeholder="Nom (ex: Toit ouvrant)" {...field} />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`equipments.${index}.description`}
                        render={({ field }) => (
                          <Input placeholder="Description (optionnel)" {...field} />
                        )}
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                    Aucun équipement ajouté
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <FormLabel>Photos du véhicule</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderImageUploader("cover_image", "Image principale", true)}
                {renderImageUploader("profile_image", "Profil")}
                {renderImageUploader("front_image", "Avant")}
                {renderImageUploader("back_image", "Arrière")}
                {renderImageUploader("interior_image", "Intérieur")}
              </div>
            </div>

            <DialogFooter>
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
                {car ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
