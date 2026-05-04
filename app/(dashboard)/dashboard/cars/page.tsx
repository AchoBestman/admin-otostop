"use client"

import * as React from "react"
import useSWR from "swr"
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Car as CarIcon, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

import { useAuth } from "@/components/providers/auth-provider"
import { useDataTable } from "@/lib/hooks/use-data-table"
import { DateRangePicker } from "@/components/date-range-picker"
import { CarDialog } from "@/components/dashboard/cars/car-dialog"
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
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { Car } from "@/types"

interface CarsResponse {
  success: boolean
  data: Car[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CarsPage() {
  const { hasPermission, isLoading: isAuthLoading } = useAuth()
  const { 
    state, 
    onPageChange, 
    onSortChange, 
    onSearch,
    onFilterChange,
    onDateRangeChange 
  } = useDataTable("created_at", "desc")

  const [deleteCarId, setDeleteCarId] = React.useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCar, setEditingCar] = React.useState<Car | null>(null)

  const canView = hasPermission("can_view_cars")
  const canCreate = hasPermission("can_create_cars")
  const canUpdate = hasPermission("can_update_cars")
  const canDelete = hasPermission("can_delete_cars")

  if (!isAuthLoading && !canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <CarIcon className="h-16 w-16 text-destructive opacity-20" />
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
  if (state.year) queryParams.set("year", state.year)
  if (state.mileage) queryParams.set("mileage", state.mileage)
  if (state.from) queryParams.set("from", state.from)
  if (state.to) queryParams.set("to", state.to)

  const { data, error, isLoading, mutate } = useSWR<CarsResponse>(
    `/api/cars?${queryParams.toString()}`,
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
    if (!deleteCarId) return

    try {
      const res = await fetch(`/api/cars/${deleteCarId}`, { method: "DELETE" })
      const result = await res.json()

      if (res.ok) {
        toast.success("Véhicule supprimé")
        mutate()
      } else {
        toast.error("Erreur", { description: result.message })
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleteCarId(null)
    }
  }

  const openCreateDialog = () => {
    setEditingCar(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (car: Car) => {
    setEditingCar(car)
    setIsDialogOpen(true)
  }

  const cars = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Véhicules</h1>
          <p className="text-muted-foreground">
            Gérez le catalogue des véhicules disponibles
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
          <CardTitle>Liste des véhicules</CardTitle>
          <CardDescription>
            {pagination.total} véhicule(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, modèle..."
                value={state.search}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <DateRangePicker 
              from={state.from}
              to={state.to}
              onRangeChange={onDateRangeChange}
            />

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Input
                type="number"
                placeholder="Année"
                className="w-24"
                value={state.year || ""}
                onChange={(e) => onFilterChange("year", e.target.value || null)}
              />
              <Input
                type="number"
                placeholder="Km max"
                className="w-28"
                value={state.mileage || ""}
                onChange={(e) => onFilterChange("mileage", e.target.value || null)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              Erreur lors du chargement des véhicules
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun véhicule trouvé
            </div>
          ) : (
            <>
              <div className="rounded-md border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Photo</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("title")}
                      >
                        <div className="flex items-center">
                          Véhicule {renderSortIcon("title")}
                        </div>
                      </TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors text-center"
                        onClick={() => handleSort("year")}
                      >
                        <div className="flex items-center justify-center">
                          Année {renderSortIcon("year")}
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Kilométrage</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center justify-center">
                          Ajouté le {renderSortIcon("created_at")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors text-right"
                        onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center justify-end">
                          Prix {renderSortIcon("price")}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cars.map((car) => (
                      <TableRow key={car.id}>
                        <TableCell>
                          <div className="relative h-12 w-20 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border/50">
                            {car.cover_image ? (
                              <Image 
                                src={car.cover_image} 
                                alt={car.title} 
                                fill 
                                className="object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{car.title}</span>
                            <span className="text-xs text-muted-foreground">{car.sub_title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                            {car.category?.libelle || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{car.year}</TableCell>
                        <TableCell className="text-center">{car.mileage?.toLocaleString()} km</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {car.created_at ? format(new Date(car.created_at), "dd/MM/yyyy", { locale: fr }) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {car.price?.toLocaleString()} FCFA
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
                                <DropdownMenuItem onClick={() => openEditDialog(car)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteCarId(car.id)}
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
      <AlertDialog open={!!deleteCarId} onOpenChange={() => setDeleteCarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {"Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible."}
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

      <CarDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        car={editingCar}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
