import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 })

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (prof?.role !== "admin") return NextResponse.json({ ok: false, code: "FORBIDDEN" }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ ok: false, code: "BAD_REQUEST" }, { status: 400 })

  const { error } = await supabase.from("designs").update({ status: "approved" }).eq("id", id)
  if (error) {
    console.error("[approve][error]", error)
    return NextResponse.json({ ok: false, code: "DB_ERROR" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
