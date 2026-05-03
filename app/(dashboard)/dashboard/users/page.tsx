"use client"

import * as React from "react"
import useSWR from "swr"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Power, ChevronLeft, ChevronRight, Mail, Shield, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/providers/auth-provider"
import { useDataTable } from "@/lib/hooks/use-data-table"
import { DateRangePicker } from "@/components/date-range-picker"
import { UserDialog } from "@/components/users/user-dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { SafeUser } from "@/types"

interface UsersResponse {
  success: boolean
  data: SafeUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function UsersPage() {
  const { hasPermission, isRoot, isLoading: isAuthLoading } = useAuth()
  const { 
    state, 
    onPageChange, 
    onSortChange, 
    onSearch, 
    onFilterChange, 
    onDateRangeChange 
  } = useDataTable("created_at", "desc")

  const [deleteUserId, setDeleteUserId] = React.useState<number | null>(null)
  const [toggleUserId, setToggleUserId] = React.useState<number | null>(null)
  const [toggleStatus, setToggleStatus] = React.useState<"activated" | "deactivated">("activated")
  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<SafeUser | null>(null)

  if (!isAuthLoading && !isRoot) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <Shield className="h-16 w-16 text-destructive opacity-20" />
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground max-w-md">
          Seul le super administrateur (Root) est autorisé à accéder aux outils de gestion de l'administration.
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
  if (state.status && state.status !== "all") queryParams.set("status", state.status)
  if (state.from) queryParams.set("from", state.from)
  if (state.to) queryParams.set("to", state.to)

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/users?${queryParams.toString()}`,
    fetcher
  )

  const canToggleStatus = hasPermission("can_toggle_activated_an_account")
  const canDeleteUser = hasPermission("can_delete_user")

  const handleSort = (field: string) => {
    onSortChange(field)
  }

  const renderSortIcon = (field: string) => {
    if (state.sort !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    return state.order === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const handleDelete = async () => {
    if (!deleteUserId) return

    try {
      const res = await fetch(`/api/users/${deleteUserId}`, { method: "DELETE" })
      const result = await res.json()

      if (res.ok) {
        toast.success("Utilisateur supprimé")
        mutate()
      } else {
        toast.error("Erreur", { description: result.message })
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleteUserId(null)
    }
  }

  const handleToggleStatus = async () => {
    if (!toggleUserId) return

    try {
      const res = await fetch(`/api/users/${toggleUserId}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toggleStatus }),
      })
      const result = await res.json()

      if (res.ok) {
        toast.success(`Utilisateur ${toggleStatus === "activated" ? "activé" : "désactivé"}`)
        // Force revalidation of the SWR cache
        mutate()
      } else {
        toast.error("Erreur", { description: result.message })
      }
    } catch {
      toast.error("Erreur lors du changement de statut")
    } finally {
      setToggleUserId(null)
    }
  }

  const handleResendEmail = async (userId: number) => {
    const promise = fetch(`/api/users/${userId}/resend-reset-email`, {
      method: "POST",
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to resend email")
      return data
    })

    toast.promise(promise, {
      loading: "Envoi de l'email en cours...",
      success: "Email de réinitialisation envoyé avec succès",
      error: (err) => `Erreur: ${err.message}`,
    })
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setIsUserDialogOpen(true)
  }

  const openEditDialog = (user: SafeUser) => {
    setEditingUser(user)
    setIsUserDialogOpen(true)
  }

  const users = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs de la plateforme
          </p>
        </div>
        {(isRoot || hasPermission("can_create_user")) && (
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {pagination.total} utilisateur(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email..."
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

            <Select 
              value={state.status || "all"} 
              onValueChange={(value) => onFilterChange("status", value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="activated">Actifs</SelectItem>
                <SelectItem value="deactivated">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              Erreur lors du chargement des utilisateurs
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <>
              <div className="rounded-md border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("first_name")}
                      >
                        <div className="flex items-center">
                          Nom {renderSortIcon("first_name")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center">
                          Email {renderSortIcon("email")}
                        </div>
                      </TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center">
                          Inscription {renderSortIcon("created_at")}
                        </div>
                      </TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role) => (
                              <Badge 
                                key={role.id} 
                                variant={role.slug === "root" ? "default" : "secondary"}
                                className={role.slug === "root" ? "bg-primary" : ""}
                              >
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: fr }) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.status === "activated" ? "default" : "destructive"}
                            className={user.status === "activated" ? "bg-green-600/20 text-green-500 border-green-600/20" : ""}
                          >
                            {user.status === "activated" ? "Actif" : "Inactif"}
                          </Badge>
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
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              {isRoot && (
                                <DropdownMenuItem onClick={() => handleResendEmail(user.id)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Renvoyer l'email
                                </DropdownMenuItem>
                              )}
                              {canToggleStatus && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setToggleUserId(user.id)
                                    setToggleStatus(user.status === "activated" ? "deactivated" : "activated")
                                  }}
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  {user.status === "activated" ? "Désactiver" : "Activer"}
                                </DropdownMenuItem>
                              )}
                              {(canDeleteUser || isRoot) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteUserId(user.id)}
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
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {"Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."}
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

      {/* Toggle Status Confirmation Dialog */}
      <AlertDialog open={!!toggleUserId} onOpenChange={() => setToggleUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de statut</AlertDialogTitle>
            <AlertDialogDescription>
              {"Êtes-vous sûr de vouloir"} {toggleStatus === "activated" ? "activer" : "désactiver"} {"cet utilisateur ?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserDialog
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        user={editingUser}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
