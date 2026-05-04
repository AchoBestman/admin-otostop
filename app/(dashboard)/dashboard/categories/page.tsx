"use client"

import * as React from "react"
import useSWR from "swr"
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Layers, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

import { useAuth } from "@/components/providers/auth-provider"
import { useDataTable } from "@/lib/hooks/use-data-table"
import { CategoryDialog } from "@/components/dashboard/categories/category-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { Category } from "@/types"

interface CategoriesResponse {
  success: boolean
  data: Category[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CategoriesPage() {
  const { hasPermission, isAdmin, isLoading: isAuthLoading } = useAuth()
  const { 
    state, 
    onPageChange, 
    onSortChange, 
    onSearch 
  } = useDataTable("libelle", "asc")

  const [deleteCategoryId, setDeleteCategoryId] = React.useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)

  const canView = hasPermission("can_view_categories")
  const canCreate = hasPermission("can_create_categories")
  const canUpdate = hasPermission("can_update_categories")
  const canDelete = hasPermission("can_delete_categories")

  if (!isAuthLoading && !canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <Layers className="h-16 w-16 text-destructive opacity-20" />
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground max-w-md">
          Vous n'avez pas la permission de consulter cette section.
        </p>
      </div>
    )
  }

  // Build query string for API
  const queryParams = new URLSearchParams({
    page: state.page.toString(),
    limit: state.limit.toString(),
    sortBy: state.sort,
    order: state.order,
  })
  if (state.search) queryParams.set("search", state.search)

  const { data, error, isLoading, mutate } = useSWR<CategoriesResponse>(
    `/api/categories?${queryParams.toString()}`,
    fetcher
  )

  const handleSort = (field: string) => {
    onSortChange(field)
  }

  const renderSortIcon = (field: string) => {
    if (state.sort !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    return state.order === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const handleDelete = async () => {
    if (!deleteCategoryId) return

    try {
      const res = await fetch(`/api/categories/${deleteCategoryId}`, { method: "DELETE" })
      const result = await res.json()

      if (res.ok) {
        toast.success("Catégorie supprimée")
        mutate()
      } else {
        toast.error("Erreur", { description: result.message })
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleteCategoryId(null)
    }
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setIsDialogOpen(true)
  }

  const categories = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catégories</h1>
          <p className="text-muted-foreground">
            Gérez les catégories de véhicules et services
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des catégories</CardTitle>
          <CardDescription>
            {pagination.total} catégorie(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={state.search}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              Erreur lors du chargement des catégories
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune catégorie trouvée
            </div>
          ) : (
            <>
              <div className="rounded-md border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("libelle")}
                      >
                        <div className="flex items-center">
                          Libellé {renderSortIcon("libelle")}
                        </div>
                      </TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border/50">
                            {category.cover_image ? (
                              <Image 
                                src={category.cover_image} 
                                alt={category.libelle} 
                                fill 
                                className="object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{category.libelle}</TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground border border-border/50">
                            {category.slug}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-muted-foreground text-sm">
                            {category.description || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteCategoryId(category.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} sur {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(state.page - 1)}
                    disabled={state.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(state.page + 1)}
                    disabled={state.page >= pagination.totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {"Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={editingCategory}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
