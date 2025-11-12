import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import StartAnonChatButton from "./start-anon-chat-button"

export default async function DesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
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

  // Check if user already purchased this design
  let hasPurchased = false
  if (user) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("design_id", design.id)
      .eq("buyer_id", user.id)
      .single()
    hasPurchased = !!purchase
  }

  // Check if design is sold exclusively
  const { data: exclusivePurchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("design_id", design.id)
    .eq("license_type", "exclusive_buyout")
    .single()

  const isSoldExclusively = !!exclusivePurchase

  return (
    <div className="min-h-screen">
      {profile ? <DashboardNav role={profile.role} displayName={profile.display_name} /> : <Navigation />}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/40 bg-card/50">
            <Image src={design.image_url || "/placeholder.svg"} alt={design.title} fill className="object-cover" />
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{design.title}</h1>
              <p className="mt-2 text-muted-foreground">by {design.profiles?.display_name || "Anonymous"}</p>
            </div>

            {design.description && (
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </h2>
                <p className="leading-relaxed text-foreground">{design.description}</p>
              </div>
            )}

            {design.tags && design.tags.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {design.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="space-y-4 rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold">License Options</h2>

              {/* Non-Exclusive */}
              <Card className="border-border/40 bg-background/50">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">Non-Exclusive License</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Use the design for your brand. Others can purchase too.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${Number.parseFloat(design.price_non_exclusive.toString()).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {!user ? (
                    <Button className="w-full" asChild>
                      <Link href="/auth/login">Login to Purchase</Link>
                    </Button>
                  ) : hasPurchased ? (
                    <Button className="w-full" disabled>
                      Already Purchased
                    </Button>
                  ) : isSoldExclusively ? (
                    <Button className="w-full" disabled>
                      Sold Exclusively
                    </Button>
                  ) : (
                    <Button className="w-full" asChild>
                      <Link href={`/checkout/${design.id}?license=non_exclusive`}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase Non-Exclusive
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Exclusive */}
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Exclusive Buyout</h3>
                        <Badge variant="outline" className="bg-accent/10 text-accent">
                          Exclusive
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Full ownership. Design removed from marketplace after purchase.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${Number.parseFloat(design.price_exclusive.toString()).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {!user ? (
                    <Button className="w-full" asChild>
                      <Link href="/auth/login">Login to Purchase</Link>
                    </Button>
                  ) : hasPurchased ? (
                    <Button className="w-full" disabled>
                      Already Purchased
                    </Button>
                  ) : isSoldExclusively ? (
                    <Button className="w-full" disabled>
                      Sold Exclusively
                    </Button>
                  ) : (
                    <Button className="w-full" asChild>
                      <Link href={`/checkout/${design.id}?license=exclusive_buyout`}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase Exclusive
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Anonymous Chat Button */}
            {user && user.id !== design.designer_id && (
              <StartAnonChatButton designId={design.id} designerId={design.designer_id} />
            )}

            {/* Info */}
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p>
                All purchases include high-resolution files ready for production. Instant download after payment
                confirmation.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
