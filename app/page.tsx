import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { ShieldCheck, Eye, Zap, Upload, ShoppingBag, DollarSign } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              Where Creativity Meets{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Anonymity</span>
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              The underground marketplace for clothing brand graphics. Buy and sell premium designs without revealing
              identities. Pure creativity, zero ego.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/auth/signup">Start Selling Designs</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                <Link href="/marketplace">Browse Marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for Creators</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A marketplace designed for serious creators and brands who value quality and privacy.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-primary/20 bg-card p-6 shadow-lg shadow-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Complete Anonymity</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                No real names, no profiles. Just aliases and artwork. Your identity stays yours.
              </p>
            </Card>

            <Card className="border-primary/20 bg-card p-6 shadow-lg shadow-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Curated Quality</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Every design is reviewed before going live. Only the best make it to the marketplace.
              </p>
            </Card>

            <Card className="border-primary/20 bg-card p-6 shadow-lg shadow-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Flexible Licensing</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Choose non-exclusive for multiple buyers or exclusive buyout for complete ownership.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-secondary/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-12 lg:grid-cols-2">
            {/* For Designers */}
            <div>
              <h3 className="text-2xl font-bold">For Designers</h3>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Upload Your Work</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Submit your designs with pricing for both license types.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Get Approved</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Our team reviews submissions to maintain marketplace quality.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Earn Anonymously</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get paid when brands purchase your designs. No identity required.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Brand Owners */}
            <div>
              <h3 className="text-2xl font-bold">For Brand Owners</h3>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Browse the Marketplace</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Discover curated designs from talented anonymous creators.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Choose Your License</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Non-exclusive for shared use or exclusive buyout for sole ownership.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Instant Download</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Purchase and download high-quality files immediately. Start using them right away.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Join?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you're creating or buying, your identity stays anonymous.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/auth/signup">Create Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                <Link href="/marketplace">Explore Designs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">© 2025 Anonymous Designs. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
