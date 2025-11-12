import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const MAX_PREVIEW_MB = 5
const MAX_SOURCE_MB = 25

function json(body: Record<string, any>, init?: number | ResponseInit) {
  const status = typeof init === "number" ? init : ((init as ResponseInit)?.status ?? 200)
  return NextResponse.json(body, { status })
}

export async function POST(req: Request) {
  try {
    // 1) Auth check
    const supabase = await createClient()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) {
      return json({ ok: false, code: "UNAUTHENTICATED", message: "Please log in to upload." }, 401)
    }

    // 2) Read form data
    const form = await req.formData()
    const title = (form.get("title") as string | null)?.trim() || ""
    const description = (form.get("description") as string | null) ?? ""
    const pneRaw = form.get("price_non_exclusive")
    const pexRaw = form.get("price_exclusive")
    const tagsRaw = form.get("tags")
    const preview = form.get("preview_file") as File | null
    const source = form.get("source_file") as File | null

    // 3) Validate required fields
    if (!title || !preview || !source) {
      return json(
        { ok: false, code: "VALIDATION_FAILED", message: "Title, preview, and source file are required." },
        400,
      )
    }

    const previewMB = preview.size / (1024 * 1024)
    const sourceMB = source.size / (1024 * 1024)
    if (previewMB > MAX_PREVIEW_MB) {
      return json({ ok: false, code: "FILE_TOO_LARGE", message: `Preview must be <= ${MAX_PREVIEW_MB}MB.` }, 413)
    }
    if (sourceMB > MAX_SOURCE_MB) {
      return json({ ok: false, code: "FILE_TOO_LARGE", message: `Source file must be <= ${MAX_SOURCE_MB}MB.` }, 413)
    }

    // Parse tags
    const tags = (() => {
      if (!tagsRaw) return [] as string[]
      try {
        const parsed = JSON.parse(String(tagsRaw))
        return Array.isArray(parsed) ? parsed.map(String) : []
      } catch {
        return String(tagsRaw)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      }
    })()

    const price_non_exclusive = pneRaw != null && String(pneRaw) !== "" ? Number(pneRaw) : null
    const price_exclusive = pexRaw != null && String(pexRaw) !== "" ? Number(pexRaw) : null

    // 4) Check blob storage config
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return json({ ok: false, code: "CONFIG_ERROR", message: "Storage is not configured." }, 500)
    }

    // 5) Upload files to Vercel Blob
    const now = Date.now()
    const { url: preview_url } = await put(`previews/${user.id}/${now}_${preview.name}`, preview, { access: "public" })
    const { url: image_url } = await put(`designs/${user.id}/${now}_${source.name}`, source, { access: "public" })

    // 6) Insert into database
    const payload = {
      designer_id: user.id,
      title,
      description,
      preview_url,
      image_url,
      price_non_exclusive,
      price_exclusive,
      tags,
      status: "pending" as const,
    }

    const { data, error } = await supabase.from("designs").insert(payload).select("id").single()
    if (error) {
      console.error("[v0][upload] Database insert failed:", error)
      return json(
        {
          ok: false,
          code: "DB_INSERT_FAILED",
          message: "We couldn't save your design.",
        },
        500,
      )
    }

    return json({ ok: true, data: { id: data.id } }, 200)
  } catch (e: any) {
    console.error("[v0][upload] Unexpected error:", e)
    const msg = String(e?.message || "").toLowerCase()

    if (msg.includes("too") && msg.includes("large")) {
      return json(
        { ok: false, code: "FILE_TOO_LARGE", message: "Upload too large for server. Use smaller files." },
        413,
      )
    }
    const name = e?.name?.toLowerCase?.() || ""
    if (name.includes("blob")) {
      return json(
        { ok: false, code: "BLOB_UPLOAD_FAILED", message: "File upload failed. Try smaller files or another format." },
        500,
      )
    }
    return json({ ok: false, code: "UNEXPECTED", message: "Something went wrong while uploading." }, 500)
  }
}
