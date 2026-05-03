"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { SafeUser, Role } from "@/types"

interface AuthContextType {
  user: SafeUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; email?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isRoot: boolean;
  isAdmin: boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<SafeUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Check auth status on mount
  React.useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/profile")
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setUser(data.data)
          // Token is stored in httpOnly cookie, so we don't have direct access
          setToken("authenticated")
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        return { success: false, message: data.message || "Login failed" }
      }

      return { success: true, message: data.message, email: data.data?.email }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "An error occurred during login" }
    }
  }

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        return { success: false, message: data.message || "Verification failed" }
      }

      // Set user and token from response
      if (data.data) {
        setUser(data.data.user)
        setToken(data.data.token)
      }

      return { success: true, message: data.message }
    } catch (error) {
      console.error("OTP verification error:", error)
      return { success: false, message: "An error occurred during verification" }
    }
  }

  const resendOTP = async (email: string) => {
    try {
      const res = await fetch("/api/auth/verify-otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        return { success: false, message: data.message || "Failed to resend code" }
      }

      return { success: true, message: data.message }
    } catch (error) {
      console.error("OTP resend error:", error)
      return { success: false, message: "An error occurred while resending the code" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/profile?action=logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setToken(null)
      router.push("/login")
    }
  }

  const refreshProfile = async () => {
    await checkAuth()
  }

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false
    // Root has all permissions
    if (user.roles?.some((r: Role) => r.slug === "root")) return true
    return user.permissions.includes(permission)
  }

  const hasRole = (role: string): boolean => {
    if (!user?.roles) return false
    return user.roles.some((r: Role) => r.slug === role)
  }

  const isRoot = user?.roles?.some((r: Role) => r.slug === "root") ?? false
  const isAdmin = isRoot || (user?.roles?.some((r: Role) => r.slug === "admin") ?? false)

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    verifyOTP,
    resendOTP,
    logout,
    refreshProfile,
    hasPermission,
    hasRole,
    isRoot,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
