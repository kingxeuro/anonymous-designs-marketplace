import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Download, ShoppingBag } from "lucide-react"
import Image from "next/image"

export default async function PurchasesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Get user's purchases
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*, designs(*, profiles!designs_designer_id_fkey(display_name))")
    .eq("buyer_id", user.id)
    .order("purchased_at", { ascending: false })

  return (
    <div className="min-h-screen">
      <DashboardNav role={profile.role} displayName={profile.display_name} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Purchases</h1>
          <p className="mt-2 text-muted-foreground">Access and download your purchased designs</p>
        </div>

        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
            <CardDescription>All your purchased designs in one place</CardDescription>
          </CardHeader>
          <CardContent>
            {!purchases || purchases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No purchases yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">Browse the marketplace to find designs you love</p>
                <Button asChild>
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <Card key={purchase.id} className="overflow-hidden border-border/40 bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border/40">
                          <Image
                            src={purchase.designs.preview_url || purchase.designs.image_url}
                            alt={purchase.designs.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{purchase.designs.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {purchase.designs.profiles?.display_name || "Anonymous"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {purchase.license_type === "exclusive_buyout"
                                ? "Exclusive Buyout"
                                : "Non-Exclusive License"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Purchased {new Date(purchase.purchased_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                          <div className="text-lg font-bold">
                            ${Number.parseFloat(purchase.price_paid.toString()).toFixed(2)}
                          </div>
                          <Button size="sm" asChild>
                            <Link href={purchase.download_url}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
