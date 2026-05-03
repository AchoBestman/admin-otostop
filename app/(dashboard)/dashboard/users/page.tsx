"use client"

import * as React from "react"
import useSWR from "swr"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Power, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/providers/auth-provider"
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
  const { hasPermission, isRoot } = useAuth()
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(10)
  const [deleteUserId, setDeleteUserId] = React.useState<number | null>(null)
  const [toggleUserId, setToggleUserId] = React.useState<number | null>(null)
  const [toggleStatus, setToggleStatus] = React.useState<"activated" | "deactivated">("activated")

  // Build query string
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  if (search) queryParams.set("search", search)
  if (status && status !== "all") queryParams.set("status", status)

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/users?${queryParams.toString()}`,
    fetcher
  )

  const canToggleStatus = hasPermission("can_toggle_activated_an_account")
  const canDeleteUser = hasPermission("can_delete_user")

  const handleDelete = async () => {
    if (!deleteUserId) return

    try {
      const res = await fetch(`/api/users/${deleteUserId}`, { method: "DELETE" })
      const result = await res.json()

      if (res.ok) {
        toast.success("Utilisateur supprime")
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
        toast.success(`Utilisateur ${toggleStatus === "activated" ? "active" : "desactive"}`)
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

  const users = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gerez les utilisateurs de la plateforme
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {pagination.total} utilisateur(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Select 
              value={status} 
              onValueChange={(value) => {
                setStatus(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
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
              Aucun utilisateur trouve
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
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
                        <Badge 
                          variant={user.status === "activated" ? "default" : "destructive"}
                          className={user.status === "activated" ? "bg-green-600" : ""}
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
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            {canToggleStatus && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setToggleUserId(user.id)
                                  setToggleStatus(user.status === "activated" ? "deactivated" : "activated")
                                }}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                {user.status === "activated" ? "Desactiver" : "Activer"}
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} sur {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Precedent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
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
              {"Etes-vous sur de vouloir supprimer cet utilisateur ? Cette action est irreversible."}
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
              {"Etes-vous sur de vouloir"} {toggleStatus === "activated" ? "activer" : "desactiver"} {"cet utilisateur ?"}
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
    </div>
  )
}
