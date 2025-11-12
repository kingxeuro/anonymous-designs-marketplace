import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"

export default async function MessagesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id,
      design_id,
      updated_at,
      designs(title, image_url),
      buyer:profiles!conversations_buyer_id_fkey(display_name),
      designer:profiles!conversations_designer_id_fkey(display_name),
      messages(content, created_at, sender_id, read_at)
    `)
    .order("updated_at", { ascending: false })

  const conversationsWithUnread = conversations?.map((conv) => ({
    ...conv,
    unreadCount: conv.messages?.filter((m: any) => m.sender_id !== user.id && !m.read_at).length || 0,
    lastMessage: conv.messages?.[0],
  }))

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      {!conversationsWithUnread || conversationsWithUnread.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p className="text-muted-foreground">Start a conversation with a designer from their design page</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversationsWithUnread.map((conv: any) => {
            const otherPerson = conv.buyer.display_name === user.id ? conv.designer : conv.buyer

            return (
              <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}>
                <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex gap-4">
                    <img
                      src={conv.designs.image_url || "/placeholder.svg"}
                      alt={conv.designs.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold truncate">{conv.designs.title}</h3>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">with {otherPerson.display_name}</p>
                      {conv.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.content}</p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
