"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Activity, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const { user, isAdmin, isRoot } = useAuth()

  const roleLabel = isRoot ? "Super Administrateur" : isAdmin ? "Administrateur" : "Utilisateur"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bonjour, {user?.first_name} !
        </h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre tableau de bord OtoStop Global+
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Votre role
            </CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{roleLabel}</div>
            <p className="text-xs text-muted-foreground">
              {user?.roles?.map(r => r.name).join(", ") || "Aucun role"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Permissions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.permissions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Permissions actives
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Utilisateurs
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  Total enregistres
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Activite
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">+12%</div>
                <p className="text-xs text-muted-foreground">
                  Depuis le mois dernier
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Apercu</CardTitle>
            <CardDescription>
              Vos statistiques et activites recentes
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              Les statistiques seront disponibles prochainement
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Activites recentes</CardTitle>
            <CardDescription>
              Vos dernieres actions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Connexion reussie
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {"Aujourd'hui"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
