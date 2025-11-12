import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export default async function SubmittedPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch the design; owner can see their own item (RLS policy designer_select_own)
  const { data, error } = await supabase
    .from("designs")
    .select("id, title, status, preview_url, created_at")
    .eq("id", params.id)
    .maybeSingle()

  // If not found due to RLS or missing row, still show a generic success message
  const title = data?.title ?? "Your design"
  const status = data?.status ?? "pending"

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="mb-2 text-sm font-semibold text-green-600">Submission received</div>
            <h1 className="text-2xl font-semibold tracking-tight">{title} has been submitted</h1>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border/40 bg-background/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-700">
                  {status}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                We'll review your design for quality and policy compliance. You'll see it in the marketplace once it's
                approved.
              </p>
              <p className="font-medium text-foreground">Typical review time: 24 hours</p>
            </div>

            {data?.preview_url && (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border/40">
                <Image
                  src={data.preview_url || "/placeholder.svg"}
                  alt="Design preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Button asChild className="w-full">
                <Link href="/dashboard/designer">View my uploads</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/dashboard/designer/upload">Upload another</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/marketplace">Browse marketplace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export const dynamic = "force-dynamic"
