"use client"

import * as React from "react"
import useSWR from "swr"
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, MoreHorizontal, Pencil, Key, Trash2, ChevronLeft, ChevronRight, Shield } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/providers/auth-provider"
import { useDataTable } from "@/lib/hooks/use-data-table"
import { DateRangePicker } from "@/components/date-range-picker"
import { RoleDialog } from "@/components/roles/role-dialog"
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
import type { RoleWithPermissions } from "@/types"

interface RolesResponse {
  success: boolean
  data: RoleWithPermissions[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function RolesPage() {
  const { isAdmin, isRoot, isLoading: isAuthLoading } = useAuth()
  const { 
    state, 
    onPageChange, 
    onSortChange, 
    onSearch, 
    onDateRangeChange 
  } = useDataTable("name", "asc")

  const [deleteRoleId, setDeleteRoleId] = React.useState<number | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<RoleWithPermissions | null>(null)

  if (!isAuthLoading && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <Shield className="h-16 w-16 text-destructive opacity-20" />
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground max-w-md">
          Seuls les administrateurs sont autorisés à accéder à cette section.
        </p>
      </div>
    )
  }

  // Build query string for API
  const queryParams = new URLSearchParams({
    page: state.page.toString(),
    limit: state.limit.toString(),
    sort: state.sort,
    order: state.order,
  })
  if (state.search) queryParams.set("search", state.search)
  if (state.from) queryParams.set("from", state.from)
  if (state.to) queryParams.set("to", state.to)

  const { data, error, isLoading, mutate } = useSWR<RolesResponse>(
    `/api/roles?${queryParams.toString()}`,
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
    if (!deleteRoleId) return

    try {
      const res = await fetch(`/api/roles/${deleteRoleId}`, { method: "DELETE" })
      const result = await res.json()

      if (res.ok) {
        toast.success("Rôle supprimé")
        mutate()
      } else {
        toast.error("Erreur", { description: result.message })
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleteRoleId(null)
    }
  }

  const openCreateDialog = () => {
    setEditingRole(null)
    setIsRoleDialogOpen(true)
  }

  const openEditDialog = (role: RoleWithPermissions) => {
    setEditingRole(role)
    setIsRoleDialogOpen(true)
  }

  const roles = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  const systemRoles = ["root", "admin", "customer"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rôles</h1>
          <p className="text-muted-foreground">
            Gérez les rôles et permissions de la plateforme
          </p>
        </div>
        {isRoot && (
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des rôles</CardTitle>
          <CardDescription>
            {pagination.total} rôle(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un rôle..."
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
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              Erreur lors du chargement des rôles
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rôle trouvé
            </div>
          ) : (
            <>
              <div className="rounded-md border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          Nom {renderSortIcon("name")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("slug")}
                      >
                        <div className="flex items-center">
                          Slug {renderSortIcon("slug")}
                        </div>
                      </TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground border border-border/50">
                            {role.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {role.permissions?.slice(0, 3).map((perm) => (
                              <Badge key={perm.id} variant="outline" className="text-xs border-primary/20 text-primary/80">
                                {perm.name}
                              </Badge>
                            ))}
                            {(role.permissions?.length || 0) > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(role.permissions?.length || 0) - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {systemRoles.includes(role.slug) ? (
                            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                              Système
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              Personnalisé
                            </Badge>
                          )}
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
                              {isRoot && (
                                <>
                                  <DropdownMenuItem onClick={() => openEditDialog(role)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditDialog(role)}>
                                    <Key className="mr-2 h-4 w-4" />
                                    Gérer les permissions
                                  </DropdownMenuItem>
                                </>
                              )}
                              {isRoot && !systemRoles.includes(role.slug) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteRoleId(role.id)}
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
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {"Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible."}
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

      <RoleDialog 
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        role={editingRole}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
