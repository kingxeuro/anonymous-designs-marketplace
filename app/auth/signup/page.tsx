"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { signUpWithProfile } from "@/app/actions/auth"

type UserRole = "designer" | "brand_owner"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [role, setRole] = useState<UserRole>("designer")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting signup process")

      const result = await signUpWithProfile(email, password, displayName, role)

      if (!result.success) {
        throw new Error(result.error || "Signup failed")
      }

      router.push("/auth/check-email")
    } catch (error: unknown) {
      console.error("[v0] Signup error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during signup")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Join Anonymous Designs</CardTitle>
              <CardDescription>Create your anonymous account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">Used only for login. Never shown publicly.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Alias</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="YourAlias"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">Your public identity. Choose wisely.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label>I am a...</Label>
                    <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                      <div className="flex items-center space-x-2 rounded-lg border border-border/40 bg-background/50 p-3">
                        <RadioGroupItem value="designer" id="designer" />
                        <Label htmlFor="designer" className="flex-1 cursor-pointer font-normal">
                          <div className="font-medium">Designer</div>
                          <div className="text-xs text-muted-foreground">I want to sell my designs</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border border-border/40 bg-background/50 p-3">
                        <RadioGroupItem value="brand_owner" id="brand_owner" />
                        <Label htmlFor="brand_owner" className="flex-1 cursor-pointer font-normal">
                          <div className="font-medium">Brand Owner</div>
                          <div className="text-xs text-muted-foreground">I want to buy designs</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-foreground underline underline-offset-4 hover:text-accent">
                    Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
