"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun, Bell, Shield, Database } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground">
          Gerez les parametres de votre compte
        </p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Apparence
            </CardTitle>
            <CardDescription>
              Personnalisez {"l'apparence"} de {"l'application"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <RadioGroup
                value={theme}
                onValueChange={setTheme}
                className="grid grid-cols-3 gap-4"
              >
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="light" id="light" className="sr-only" />
                  <Sun className="mb-2 h-6 w-6" />
                  Clair
                </Label>
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="dark" id="dark" className="sr-only" />
                  <Moon className="mb-2 h-6 w-6" />
                  Sombre
                </Label>
                <Label
                  htmlFor="system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="system" id="system" className="sr-only" />
                  <Monitor className="mb-2 h-6 w-6" />
                  Systeme
                </Label>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configurez vos preferences de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevez des emails pour les mises a jour importantes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertes de securite</Label>
                <p className="text-sm text-muted-foreground">
                  Soyez alerte en cas de connexion suspecte
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Newsletter</Label>
                <p className="text-sm text-muted-foreground">
                  Recevez nos actualites et offres speciales
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Securite
            </CardTitle>
            <CardDescription>
              Gerez la securite de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Authentification a deux facteurs (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  Verification par code OTP a chaque connexion
                </p>
              </div>
              <Switch checked disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              {"L'authentification"} 2FA est obligatoire sur OtoStop Global+
            </p>
          </CardContent>
        </Card>

        {/* Data Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Donnees
            </CardTitle>
            <CardDescription>
              Gerez vos donnees personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exporter mes donnees</Label>
                <p className="text-sm text-muted-foreground">
                  Telechargez une copie de vos donnees
                </p>
              </div>
              <button className="text-sm text-primary hover:underline">
                Exporter
              </button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-destructive">Supprimer mon compte</Label>
                <p className="text-sm text-muted-foreground">
                  Supprimez definitivement votre compte et vos donnees
                </p>
              </div>
              <button className="text-sm text-destructive hover:underline">
                Supprimer
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
