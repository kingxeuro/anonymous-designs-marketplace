import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Search, MessageCircle } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tag?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  }

  let query = supabase
    .from("designs")
    .select("*, profiles!designs_designer_id_fkey(display_name)")
    .eq("status", "approved")

  // Apply search filter
  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  // Apply tag filter
  if (params.tag) {
    query = query.contains("tags", [params.tag])
  }

  const { data: designs } = await query.order("created_at", { ascending: false })

  // Get all unique tags
  const { data: allDesigns } = await supabase.from("designs").select("tags").eq("status", "approved")
  const allTags = Array.from(new Set(allDesigns?.flatMap((d) => d.tags || []) || []))

  return (
    <div className="min-h-screen">
      {profile ? <DashboardNav role={profile.role} displayName={profile.display_name} /> : <Navigation />}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="mt-2 text-muted-foreground">Discover premium designs from anonymous creators</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form action="/marketplace" method="get" className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search designs..."
              defaultValue={params.search}
              className="bg-background/50 pl-10"
            />
          </form>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link href="/marketplace">
                <Badge
                  variant="outline"
                  className={`cursor-pointer transition-colors hover:bg-accent/10 ${!params.tag ? "bg-accent/10" : ""}`}
                >
                  All
                </Badge>
              </Link>
              {allTags.map((tag) => (
                <Link key={tag} href={`/marketplace?tag=${tag}`}>
                  <Badge
                    variant="outline"
                    className={`cursor-pointer transition-colors hover:bg-accent/10 ${params.tag === tag ? "bg-accent/10" : ""}`}
                  >
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Designs Grid */}
        {!designs || designs.length === 0 ? (
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="mb-2 text-lg font-semibold">No designs found</h3>
              <p className="text-sm text-muted-foreground">
                {params.search || params.tag ? "Try adjusting your filters" : "Check back soon for new designs"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designs.map((design) => (
              <Card
                key={design.id}
                className="group overflow-hidden border-border/40 bg-card/50 backdrop-blur transition-all hover:border-accent/50 hover:shadow-lg"
              >
                <Link href={`/marketplace/${design.id}`}>
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={design.preview_url || design.image_url}
                      alt={design.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link href={`/marketplace/${design.id}`}>
                    <h3 className="mb-1 font-semibold leading-tight">{design.title}</h3>
                    <p className="mb-2 text-xs text-muted-foreground">
                      by {design.profiles?.display_name || "Anonymous"}
                    </p>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">From </span>
                        <span className="font-semibold">
                          ${Number.parseFloat(design.price_non_exclusive.toString()).toFixed(2)}
                        </span>
                      </div>
                      {design.tags && design.tags.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {design.tags[0]}
                        </Badge>
                      )}
                    </div>
                  </Link>
                  {profile && profile.role === "brand_owner" && (
                    <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                      <Link href={`/chat/${design.id}`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message Designer
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
