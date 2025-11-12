import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, Users, DollarSign, TrendingUp } from "lucide-react"
import { ModerationQueue } from "@/components/moderation-queue"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  console.log("[v0] Admin user profile:", { userId: user.id, role: profile?.role, hasProfile: !!profile })

  if (!profile || profile.role !== "admin") {
    redirect("/marketplace")
  }

  // Get platform statistics
  const { data: allDesigns } = await supabase.from("designs").select("status")
  const { data: allUsers } = await supabase.from("profiles").select("role")
  const { data: allTransactions } = await supabase
    .from("transactions")
    .select("amount, status")
    .eq("status", "completed")

  const stats = {
    totalDesigns: allDesigns?.length || 0,
    pendingDesigns: allDesigns?.filter((d) => d.status === "pending").length || 0,
    approvedDesigns: allDesigns?.filter((d) => d.status === "approved").length || 0,
    totalUsers: allUsers?.length || 0,
    designers: allUsers?.filter((u) => u.role === "designer").length || 0,
    brandOwners: allUsers?.filter((u) => u.role === "brand_owner").length || 0,
    totalRevenue: allTransactions?.reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0) || 0,
  }

  console.log("[v0] Platform stats:", stats)

  const { data: pendingDesigns, error: pendingError } = await supabase
    .from("designs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  console.log("[v0] Pending designs query:", {
    count: pendingDesigns?.length || 0,
    error: pendingError?.message || null,
    errorDetails: pendingError,
    designs: pendingDesigns,
  })

  let designsWithProfiles = []
  if (pendingDesigns && pendingDesigns.length > 0) {
    const designerIds = [...new Set(pendingDesigns.map((d) => d.designer_id))]
    const { data: designers } = await supabase.from("profiles").select("id, display_name").in("id", designerIds)

    console.log("[v0] Designers data:", designers)

    designsWithProfiles = pendingDesigns.map((design) => ({
      ...design,
      profiles: designers?.find((d) => d.id === design.designer_id) || { display_name: "Unknown" },
    }))
  }

  // Get all designs for overview
  const { data: allDesignsData, error: allError } = await supabase
    .from("designs")
    .select("*")
    .order("created_at", { ascending: false })

  console.log("[v0] All designs query:", {
    count: allDesignsData?.length || 0,
    error: allError?.message || null,
  })

  let allDesignsWithProfiles = []
  if (allDesignsData && allDesignsData.length > 0) {
    const designerIds = [...new Set(allDesignsData.map((d) => d.designer_id))]
    const { data: designers } = await supabase.from("profiles").select("id, display_name").in("id", designerIds)

    allDesignsWithProfiles = allDesignsData.map((design) => ({
      ...design,
      profiles: designers?.find((d) => d.id === design.designer_id) || { display_name: "Unknown" },
    }))
  }

  return (
    <div className="min-h-screen">
      <DashboardNav role="admin" displayName={profile.display_name} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Moderate designs and manage the platform</p>
        </div>

        {pendingError && (
          <Card className="mb-4 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Database Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Error loading pending designs: {pendingError.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Check browser console for details. You may need to run the RLS policy SQL script.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Designs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDesigns}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingDesigns} pending review</p>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.designers} designers, {stats.brandOwners} brands
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From {allTransactions?.length || 0} transactions</p>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Designs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedDesigns}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalDesigns > 0 ? Math.round((stats.approvedDesigns / stats.totalDesigns) * 100) : 0}% approval
                rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Moderation Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Review
              {stats.pendingDesigns > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {stats.pendingDesigns}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Designs</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Moderation Queue</CardTitle>
                <CardDescription>Review and approve or reject submitted designs</CardDescription>
              </CardHeader>
              <CardContent>
                <ModerationQueue designs={designsWithProfiles || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>All Designs</CardTitle>
                <CardDescription>Overview of all designs on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ModerationQueue designs={allDesignsWithProfiles || []} showAll />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
