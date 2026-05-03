"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse email invalide"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      const result = await res.json()
      
      if (res.ok) {
        setIsSuccess(true)
        toast.success("Email envoye", {
          description: result.message,
        })
      } else {
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

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Email envoye</CardTitle>
            <CardDescription className="text-muted-foreground">
              Si un compte existe avec cette adresse email, vous recevrez un lien pour reinitialiser votre mot de passe.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            asChild
            className="w-full"
          >
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour a la connexion
            </Link>
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
          <CardTitle className="text-2xl font-bold">Mot de passe oublie</CardTitle>
          <CardDescription className="text-muted-foreground">
            Entrez votre adresse email pour recevoir un lien de reinitialisation
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="votre@email.com"
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
                  Envoi...
                </>
              ) : (
                "Envoyer le lien"
              )}
            </Button>

            <Button
              variant="ghost"
              asChild
              className="w-full"
            >
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour a la connexion
              </Link>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
