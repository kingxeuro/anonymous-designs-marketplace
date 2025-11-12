import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { redirect, notFound } from "next/navigation"
import Image from "next/image"
import { CheckoutForm } from "@/components/checkout-form"

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ license?: string }>
}) {
  const supabase = await createClient()
  const { id } = await params
  const { license } = await searchParams

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

  // Get design details
  const { data: design } = await supabase
    .from("designs")
    .select("*, profiles!designs_designer_id_fkey(display_name)")
    .eq("id", id)
    .single()

  if (!design || design.status !== "approved") {
    notFound()
  }

  // Check if user already purchased
  const { data: existingPurchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("design_id", design.id)
    .eq("buyer_id", user.id)
    .single()

  if (existingPurchase) {
    redirect(`/dashboard/purchases`)
  }

  // Check if sold exclusively
  const { data: exclusivePurchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("design_id", design.id)
    .eq("license_type", "exclusive_buyout")
    .single()

  if (exclusivePurchase) {
    redirect(`/marketplace/${design.id}`)
  }

  const licenseType = license === "exclusive_buyout" ? "exclusive_buyout" : "non_exclusive"
  const price =
    licenseType === "exclusive_buyout"
      ? Number.parseFloat(design.price_exclusive.toString())
      : Number.parseFloat(design.price_non_exclusive.toString())

  const platformFee = price * 0.1 // 10% platform fee
  const designerEarnings = price - platformFee

  return (
    <div className="min-h-screen">
      <DashboardNav role={profile.role} displayName={profile.display_name} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="mt-2 text-muted-foreground">Complete your purchase to download the design</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border/40">
                    <Image
                      src={design.preview_url || design.image_url}
                      alt={design.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{design.title}</h3>
                    <p className="text-sm text-muted-foreground">by {design.profiles?.display_name || "Anonymous"}</p>
                    <Badge variant="outline" className="mt-2">
                      {licenseType === "exclusive_buyout" ? "Exclusive Buyout" : "Non-Exclusive License"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">${price.toFixed(2)}</div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border/40 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (10%)</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span>${price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  <h4 className="mb-2 font-semibold">What you'll get:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• High-resolution design files</li>
                    <li>• Instant download after payment</li>
                    <li>
                      • {licenseType === "exclusive_buyout" ? "Full exclusive rights" : "Commercial usage rights"}
                    </li>
                    <li>• Lifetime access to your purchase</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-1">
            <CheckoutForm
              designId={design.id}
              designerId={design.designer_id}
              licenseType={licenseType}
              price={price}
              platformFee={platformFee}
              designerEarnings={designerEarnings}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
