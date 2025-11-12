"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createConversation(designId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get design to find designer
  const { data: design } = await supabase.from("designs").select("designer_id").eq("id", designId).single()

  if (!design) {
    return { success: false, error: "Design not found" }
  }

  // Create or get existing conversation
  const { data: conversation, error } = await supabase
    .from("conversations")
    .upsert(
      {
        design_id: designId,
        buyer_id: user.id,
        designer_id: design.designer_id,
        status: "active",
      },
      {
        onConflict: "design_id,buyer_id",
      },
    )
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/messages")
  return { success: true, conversationId: conversation.id }
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Update conversation timestamp
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)

  revalidatePath("/dashboard/messages")
  return { success: true }
}

export async function markMessagesAsRead(conversationId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .is("read_at", null)
    .neq("sender_id", user.id)

  revalidatePath("/dashboard/messages")
}
