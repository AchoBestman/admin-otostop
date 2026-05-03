"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyOTP, login } = useAuth()
  const [otp, setOtp] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isResending, setIsResending] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)

  const email = searchParams.get("email") || ""

  // Redirect if no email
  React.useEffect(() => {
    if (!email) {
      router.push("/login")
    }
  }, [email, router])

  // Countdown timer for resend
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Auto-submit when OTP is complete
  React.useEffect(() => {
    if (otp.length === 6) {
      handleVerify()
    }
  }, [otp])

  const handleVerify = async () => {
    if (otp.length !== 6) return

    setIsLoading(true)
    try {
      const result = await verifyOTP(email, otp)
      
      if (result.success) {
        toast.success("Connexion reussie", {
          description: "Bienvenue sur OtoStop Global+",
        })
        router.push("/dashboard")
      } else {
        toast.error("Code invalide", {
          description: result.message,
        })
        setOtp("")
      }
    } catch {
      toast.error("Erreur", {
        description: "Une erreur est survenue",
      })
      setOtp("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      // Re-trigger login to send new OTP
      const result = await login(email, "")
      
      if (result.success) {
        toast.success("Code renvoye", {
          description: "Un nouveau code a ete envoye a votre email",
        })
        setCountdown(60) // 60 seconds countdown
      } else {
        toast.error("Erreur", {
          description: "Impossible de renvoyer le code. Veuillez vous reconnecter.",
        })
      }
    } catch {
      toast.error("Erreur", {
        description: "Une erreur est survenue",
      })
    } finally {
      setIsResending(false)
    }
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
          <CardTitle className="text-2xl font-bold">Verification</CardTitle>
          <CardDescription className="text-muted-foreground">
            Entrez le code a 6 chiffres envoye a
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleVerify}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verification...
            </>
          ) : (
            "Verifier le code"
          )}
        </Button>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={isResending || countdown > 0}
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : countdown > 0 ? (
              `Renvoyer dans ${countdown}s`
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Renvoyer le code
              </>
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
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Le code est valide pendant 10 minutes.
          <br />
          Verifiez egalement vos spams.
        </p>
      </CardContent>
    </Card>
  )
}

export default function VerifyOTPPage() {
  return (
    <React.Suspense fallback={
      <Card className="w-full max-w-md border-border/50 shadow-xl p-8 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </Card>
    }>
      <VerifyOTPContent />
    </React.Suspense>
  )
}
