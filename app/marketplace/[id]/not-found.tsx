import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/40 bg-card/50 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="mb-2 text-2xl font-bold">Design Not Found</h2>
            <p className="mb-6 text-muted-foreground">
              This design doesn't exist or is no longer available in the marketplace.
            </p>
            <Button asChild>
              <Link href="/marketplace">Back to Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
