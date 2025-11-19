import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function json(body: any, init?: number | ResponseInit) {
  const status = typeof init === "number" ? init : ((init as ResponseInit)?.status ?? 200)
  return NextResponse.json(body, { status })
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return json({ ok: false, code: "UNAUTHENTICATED", message: "Please log in." }, 401)

    const body = await req.json().catch(() => null)
    if (!body) return json({ ok: false, code: "BAD_REQUEST", message: "Invalid JSON." }, 400)

    const {
      title,
      description = "",
      price_non_exclusive = null,
      price_exclusive = null,
      tags = [],
      file_url,
      preview_url: maybePreviewUrl,
    } = body || {}

    if (!title || !file_url) {
      return json({ ok: false, code: "VALIDATION_FAILED", message: "Title and file are required." }, 400)
    }

    const preview_url = maybePreviewUrl || file_url
    const image_url = file_url

    const payload = {
      designer_id: user.id,
      title,
      description,
      preview_url,
      image_url,
      price_non_exclusive: price_non_exclusive ?? null,
      price_exclusive: price_exclusive ?? null,
      tags: Array.isArray(tags) ? tags.map(String) : [],
      status: "pending" as const,
    }

    const { data, error } = await supabase.from("designs").insert(payload).select("id").single()
    if (error) {
      console.error("[submit-urls][db]", error)
      return json({ ok: false, code: "DB_INSERT_FAILED", message: "Could not save your design." }, 500)
    }

    return json({ ok: true, data: { id: data.id } }, 200)
  } catch (e: any) {
    console.error("[submit-urls][error]", e)
    return json({ ok: false, code: "UNEXPECTED", message: "Unexpected error." }, 500)
  }
}
