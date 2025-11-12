import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }

    const { conversation_id, message } = await request.json()

    if (!conversation_id || !message?.trim()) {
      return NextResponse.json({ ok: false, message: "Missing required fields" }, { status: 400 })
    }

    // Verify user is part of conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("buyer_id, designer_id")
      .eq("id", conversation_id)
      .single()

    if (!conversation || (conversation.buyer_id !== user.id && conversation.designer_id !== user.id)) {
      return NextResponse.json({ ok: false, message: "Not authorized for this conversation" }, { status: 403 })
    }

    // Insert message
    const { data: newMessage, error } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_id: user.id,
        content: message.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("[chat/message] Error inserting message:", error)
      return NextResponse.json({ ok: false, message: "Failed to send message" }, { status: 500 })
    }

    // Update conversation timestamp
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation_id)

    return NextResponse.json({ ok: true, data: newMessage })
  } catch (error) {
    console.error("[chat/message] Error:", error)
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 })
  }
}
