"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [isInvalid, setIsInvalid] = React.useState(false)

  const token = searchParams.get("token") || ""

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Check if token exists
  React.useEffect(() => {
    if (!token) {
      setIsInvalid(true)
    }
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      })
      
      const result = await res.json()
      
      if (res.ok) {
        setIsSuccess(true)
        toast.success("Mot de passe reinitialise", {
          description: "Vous pouvez maintenant vous connecter",
        })
      } else {
        if (res.status === 401) {
          setIsInvalid(true)
        }
        toast.error("Erreur", {
          description: result.message,
        })
      }
    } catch {
      toast.error("Erreur", {
        description: "Une erreur est survenue",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isInvalid) {
    return (
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Lien invalide</CardTitle>
            <CardDescription className="text-muted-foreground">
              Ce lien de reinitialisation est invalide ou a expire.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Link href="/forgot-password">
              Demander un nouveau lien
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Mot de passe reinitialise</CardTitle>
            <CardDescription className="text-muted-foreground">
              Votre mot de passe a ete change avec succes.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push("/login")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Se connecter
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-border/50 shadow-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-24 h-24 relative">
          <Image
            src="/logo.jpeg"
            alt="OtoStop Global+"
            fill
            className="object-contain rounded-lg"
            priority
          />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">Nouveau mot de passe</CardTitle>
          <CardDescription className="text-muted-foreground">
            Choisissez un nouveau mot de passe securise
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Votre nouveau mot de passe"
                        className="pl-10 pr-10"
                        disabled={isLoading}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirmez votre mot de passe"
                        className="pl-10"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reinitialisation...
                </>
              ) : (
                "Reinitialiser le mot de passe"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={
      <Card className="w-full max-w-md border-border/50 shadow-xl p-8 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </Card>
    }>
      <ResetPasswordContent />
    </React.Suspense>
  )
}
