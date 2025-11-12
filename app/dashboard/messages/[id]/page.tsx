import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/components/chat-interface"
import { markMessagesAsRead } from "@/app/actions/chat"

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      *,
      design:designs(title, image_url),
      buyer:profiles!conversations_buyer_id_fkey(display_name),
      designer:profiles!conversations_designer_id_fkey(display_name),
      messages(*)
    `)
    .eq("id", params.id)
    .single()

  if (!conversation) {
    redirect("/dashboard/messages")
  }

  // Mark messages as read
  await markMessagesAsRead(params.id)

  const otherPerson = conversation.buyer_id === user.id ? conversation.designer : conversation.buyer

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{conversation.design.title}</h1>
        <p className="text-muted-foreground">Chatting with {otherPerson.display_name}</p>
      </div>

      <ChatInterface conversationId={params.id} initialMessages={conversation.messages} currentUserId={user.id} />
    </div>
  )
}
