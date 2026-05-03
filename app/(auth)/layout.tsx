import { AuthProvider } from "@/components/providers/auth-provider"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        {children}
      </div>
    </AuthProvider>
  )
}
