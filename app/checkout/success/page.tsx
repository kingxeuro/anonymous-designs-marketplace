import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle, Download } from "lucide-react"
import Image from "next/image"

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ purchaseId?: string }>
}) {
  const supabase = await createClient()
  const { purchaseId } = await searchParams

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

  if (!purchaseId) {
    redirect("/marketplace")
  }

  // Get purchase details
  const { data: purchase } = await supabase
    .from("purchases")
    .select("*, designs(*, profiles!designs_designer_id_fkey(display_name))")
    .eq("id", purchaseId)
    .eq("buyer_id", user.id)
    .single()

  if (!purchase) {
    redirect("/marketplace")
  }

  return (
    <div className="min-h-screen">
      <DashboardNav role={profile.role} displayName={profile.display_name} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Purchase Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border/40 bg-background/50 p-4">
              <div className="flex gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border/40">
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
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">
                      {purchase.license_type === "exclusive_buyout" ? "Exclusive Buyout" : "Non-Exclusive License"}
                    </Badge>
                    <span className="text-sm font-semibold">
                      ${Number.parseFloat(purchase.price_paid.toString()).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full" size="lg" asChild>
                <Link href={purchase.download_url}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Design Files
                </Link>
              </Button>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/marketplace">Continue Shopping</Link>
              </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="mb-2 font-semibold text-foreground">What's next?</p>
              <ul className="space-y-1">
                <li>• Download your design files using the button above</li>
                <li>• Access your purchase anytime from your dashboard</li>
                <li>• Use the design according to your license terms</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
