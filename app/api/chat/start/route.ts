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

    const { design_id, designer_id } = await request.json()

    if (!design_id || !designer_id) {
      return NextResponse.json({ ok: false, message: "Missing required fields" }, { status: 400 })
    }

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("design_id", design_id)
      .eq("buyer_id", user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ ok: true, data: { id: existing.id } })
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        design_id,
        buyer_id: user.id,
        designer_id,
        status: "active",
      })
      .select("id")
      .single()

    if (error) {
      console.error("[chat/start] Error creating conversation:", error)
      return NextResponse.json({ ok: false, message: "Failed to create conversation" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: { id: conversation.id } })
  } catch (error) {
    console.error("[chat/start] Error:", error)
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 })
  }
}
