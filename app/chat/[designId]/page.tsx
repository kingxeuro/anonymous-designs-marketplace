import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { ChatInterface } from "@/components/chat-interface"
import { getMessages } from "@/app/actions/messages"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function ChatPage({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params
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

  // Get design details
  const { data: design } = await supabase
    .from("designs")
    .select("*, profiles!designs_designer_id_fkey(display_name)")
    .eq("id", designId)
    .single()

  if (!design) {
    redirect("/marketplace")
  }

  // Get messages
  const { messages } = await getMessages(designId)

  return (
    <div className="min-h-screen">
      <DashboardNav role={profile.role} displayName={profile.display_name} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={profile.role === "designer" ? "/dashboard" : "/marketplace"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Design Info */}
          <Card className="border-border/40 bg-card/50 backdrop-blur lg:col-span-1">
            <CardContent className="p-4">
              <div className="relative mb-4 aspect-square overflow-hidden rounded-lg">
                <Image src={design.preview_url || design.image_url} alt={design.title} fill className="object-cover" />
              </div>
              <h2 className="mb-2 font-semibold">{design.title}</h2>
              <p className="mb-4 text-sm text-muted-foreground">{design.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Non-exclusive:</span>
                  <span className="font-semibold">${Number.parseFloat(design.price_non_exclusive).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exclusive:</span>
                  <span className="font-semibold">${Number.parseFloat(design.price_exclusive).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <div className="lg:col-span-2">
            <ChatInterface
              designId={designId}
              initialMessages={messages as any}
              currentUserId={user.id}
              designStatus={design.status}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
