"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function sendMessage(designId: string, message: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Check if design exists and is not sold exclusively
  const { data: design } = await supabase.from("designs").select("status").eq("id", designId).single()

  if (!design) {
    return { error: "Design not found" }
  }

  if (design.status === "sold_exclusive") {
    return { error: "Chat is closed for this design" }
  }

  const { error } = await supabase.from("messages").insert({
    design_id: designId,
    sender_id: user.id,
    message: message.trim(),
  })

  if (error) {
    console.error("[v0] Error sending message:", error)
    return { error: "Failed to send message" }
  }

  revalidatePath(`/chat/${designId}`)
  return { success: true }
}

export async function getMessages(designId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated", messages: [] }
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*, profiles!messages_sender_id_fkey(id, role, display_name)")
    .eq("design_id", designId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching messages:", error)
    return { error: "Failed to fetch messages", messages: [] }
  }

  return { messages: messages || [], error: null }
}

export async function markMessagesAsRead(designId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("design_id", designId)
    .neq("sender_id", user.id)

  if (error) {
    console.error("[v0] Error marking messages as read:", error)
    return { error: "Failed to mark messages as read" }
  }

  return { success: true }
}
