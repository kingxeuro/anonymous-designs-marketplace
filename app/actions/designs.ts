"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { put } from "@vercel/blob"
import { unstable_noStore as noStore } from "next/cache"
import { ok, err, type ActionResult } from "@/lib/actions"

export async function submitDesignAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    noStore()

    if (!formData) {
      return err("VALIDATION_FAILED", "No form data received")
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      return err("UNAUTHENTICATED", "Please log in to upload.")
    }

    const title = ((formData.get("title") as string) || "").trim()
    const description = (formData.get("description") as string) || ""
    const price_non_exclusive = formData.get("price_non_exclusive")
    const price_exclusive = formData.get("price_exclusive")
    const tagsRaw = formData.get("tags")
    const preview = formData.get("preview_file") as File | null
    const source = formData.get("source_file") as File | null

    if (!title || title.length < 3) {
      return err("VALIDATION_FAILED", "Title must be at least 3 characters long")
    }

    if (!description || description.trim().length < 10) {
      return err("VALIDATION_FAILED", "Description must be at least 10 characters long")
    }

    if (!preview || preview.size === 0) {
      return err("VALIDATION_FAILED", "Design preview image is required")
    }

    if (preview.size > 10 * 1024 * 1024) {
      return err("VALIDATION_FAILED", "Preview image must be smaller than 10MB")
    }

    if (!source || source.size === 0) {
      return err("VALIDATION_FAILED", "Design source file is required")
    }

    if (source.size > 50 * 1024 * 1024) {
      return err("VALIDATION_FAILED", "Source file must be smaller than 50MB")
    }

    const pne = price_non_exclusive != null && String(price_non_exclusive) !== "" ? Number(price_non_exclusive) : null
    const pex = price_exclusive != null && String(price_exclusive) !== "" ? Number(price_exclusive) : null

    if (pne === null || isNaN(pne) || pne <= 0) {
      return err("VALIDATION_FAILED", "Non-exclusive price must be a valid number greater than $0")
    }

    if (pex === null || isNaN(pex) || pex <= 0) {
      return err("VALIDATION_FAILED", "Exclusive price must be a valid number greater than $0")
    }

    if (pex <= pne) {
      return err("VALIDATION_FAILED", "Exclusive price must be higher than non-exclusive price")
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return err("CONFIG_ERROR", "Storage is not configured. Contact support.")
    }

    const tags = (() => {
      if (!tagsRaw) return []
      try {
        const parsed = JSON.parse(String(tagsRaw))
        return Array.isArray(parsed) ? parsed.map(String) : []
      } catch {}
      return String(tagsRaw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    })()

    let preview_url: string
    let image_url: string

    try {
      const previewBlob = await put(`previews/${user.id}/${Date.now()}_${preview!.name}`, preview!, {
        access: "public",
      })
      preview_url = previewBlob.url

      const sourceBlob = await put(`designs/${user.id}/${Date.now()}_${source!.name}`, source!, {
        access: "public",
      })
      image_url = sourceBlob.url
    } catch (blobError: any) {
      const blobErrorMsg = blobError?.message || "Unknown blob error"
      return err("BLOB_UPLOAD_FAILED", `Failed to upload files: ${blobErrorMsg}`)
    }

    const payload = {
      designer_id: user.id,
      title,
      description,
      preview_url,
      image_url,
      price_non_exclusive: pne,
      price_exclusive: pex,
      tags,
      status: "pending" as const,
    }

    const { data, error: dbError } = await supabase.from("designs").insert(payload).select("id").single()

    if (dbError) {
      if (dbError.code === "42501") {
        return err("DB_INSERT_FAILED", "Permission denied. Please ensure you're logged in as a designer.")
      }

      if (dbError.code === "23503") {
        return err("DB_INSERT_FAILED", "Profile not found. Please refresh the page and try again.")
      }

      return err("DB_INSERT_FAILED", `Database error: ${dbError.message}`)
    }

    if (!data || !data.id) {
      return err("DB_INSERT_FAILED", "Failed to save design. Please try again.")
    }

    return ok({ id: data.id })
  } catch (unexpectedError: any) {
    const errorMsg = unexpectedError?.message || "Unknown error occurred"
    return err("UNEXPECTED", `An unexpected error occurred: ${errorMsg}`)
  }
}

export async function approveDesign(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("designs").update({ status: "approved" }).eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  redirect("/admin")
}

export async function rejectDesign(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("designs").update({ status: "rejected" }).eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  redirect("/admin")
}
