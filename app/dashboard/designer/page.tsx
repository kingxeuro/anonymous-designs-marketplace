"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Upload, DollarSign, Package, TrendingUp, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DesignerDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        // Check authentication
        console.log("[v0] Checking authentication...")
        const { data: authData, error: authError } = await supabase.auth.getUser()

        if (authError) {
          console.error("[v0] Auth error:", authError)
          setError(`Authentication failed: ${authError.message}`)
          router.push("/auth/login")
          return
        }

        if (!authData?.user) {
          console.log("[v0] No user found, redirecting to login")
          setError("No authenticated user found. Please log in.")
          router.push("/auth/login")
          return
        }

        console.log("[v0] User authenticated:", authData.user.email)
        setUser(authData.user)

        // Load designs
        console.log("[v0] Loading designs...")
        const { data: designsData, error: designsError } = await supabase
          .from("designs")
          .select(
            "id, title, description, preview_url, image_url, price_non_exclusive, price_exclusive, status, created_at",
          )
          .eq("designer_id", authData.user.id)
          .order("created_at", { ascending: false })

        if (designsError) {
          console.error("[v0] Designs query error:", designsError)
          setError(
            `Failed to load designs: ${designsError.message}. This might be due to database permissions or missing tables.`,
          )
          // Don't return - let user still see dashboard
        } else {
          console.log(`[v0] Loaded ${designsData?.length || 0} designs`)
          setDesigns(designsData || [])
        }
      } catch (err: any) {
        console.error("[v0] Dashboard load exception:", err)
        setError(`Unexpected error: ${err?.message || "Unknown error occurred"}`)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  // Calculate stats safely
  const totalDesigns = designs.length
  const approvedDesigns = designs.filter((d) => d?.status === "approved").length
  const pendingDesigns = designs.filter((d) => d?.status === "pending").length

  const potentialEarnings = designs.reduce((sum, d) => {
    const price = Number.parseFloat(String(d?.price_non_exclusive || 0))
    return sum + (isNaN(price) ? 0 : price)
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav role="designer" displayName={user.email?.split("@")[0] || "Designer"} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Designer Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Manage your designs and track your earnings</p>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard/designer/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Design
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Designs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDesigns}</div>
              <p className="text-xs text-muted-foreground">
                {approvedDesigns} approved, {pendingDesigns} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${potentialEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Based on non-exclusive pricing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalDesigns > 0 ? Math.round((approvedDesigns / totalDesigns) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {approvedDesigns} of {totalDesigns} approved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Designs Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Your Designs</CardTitle>
            <CardDescription>
              {totalDesigns === 0
                ? "Upload your first design to get started!"
                : `${totalDesigns} design${totalDesigns === 1 ? "" : "s"}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalDesigns === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No designs yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Upload your first design to start selling on the marketplace
                </p>
                <Button asChild>
                  <Link href="/dashboard/designer/upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Your First Design
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {designs.map((design, index) => {
                  const imageUrl = design?.preview_url || design?.image_url || "/placeholder.svg?height=300&width=400"
                  const title = design?.title || "Untitled Design"
                  const description = design?.description || "No description"
                  const status = String(design?.status || "pending")
                  const priceNonExclusive = Number.parseFloat(String(design?.price_non_exclusive || 0))
                  const priceExclusive = Number.parseFloat(String(design?.price_exclusive || 0))

                  const badgeVariant =
                    status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"

                  return (
                    <Card key={design?.id || `design-${index}`}>
                      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
                        <img src={imageUrl || "/placeholder.svg"} alt={title} className="h-full w-full object-cover" />
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-1 text-lg">{title}</CardTitle>
                          <Badge variant={badgeVariant as any}>{status}</Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-muted-foreground">Non-Exclusive</p>
                            <p className="font-semibold">
                              ${isNaN(priceNonExclusive) ? "0.00" : priceNonExclusive.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">Exclusive</p>
                            <p className="font-semibold">
                              ${isNaN(priceExclusive) ? "0.00" : priceExclusive.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
