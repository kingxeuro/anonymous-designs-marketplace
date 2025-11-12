"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { put } from "@vercel/blob"
import { unstable_noStore as noStore } from "next/cache"
import { ok, err, type ActionResult } from "@/lib/actions"

export async function submitDesignAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    noStore()
    console.log("[v0][upload] ==> START")

    const supabase = await createClient()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      console.error("[v0][upload] UNAUTHENTICATED", userErr?.message)
      return err("UNAUTHENTICATED", "Please log in to upload.")
    }
    console.log("[v0][upload] authenticated as:", user.email)

    const { data: profile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("id, display_name, role")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile) {
      console.log("[v0][upload] Profile missing, creating fallback profile...")

      const displayName =
        user.user_metadata?.display_name || user.email?.split("@")[0] || `User_${user.id.substring(0, 8)}`

      const role = user.user_metadata?.role || "designer"

      const { error: createError } = await supabase.from("profiles").insert({
        id: user.id,
        display_name: displayName,
        role: role,
      })

      // Ignore duplicate errors (race condition)
      if (createError && createError.code !== "23505") {
        console.error("[v0][upload] Failed to create profile:", createError)
        return err("PROFILE_ERROR", "Your profile could not be created. Please log out and log back in.")
      }

      console.log("[v0][upload] Fallback profile created successfully")
    } else {
      console.log("[v0][upload] Profile exists:", profile.display_name, profile.role)
    }

    const title = ((formData.get("title") as string) || "").trim()
    const description = (formData.get("description") as string) || ""
    const price_non_exclusive = formData.get("price_non_exclusive")
    const price_exclusive = formData.get("price_exclusive")
    const tagsRaw = formData.get("tags")
    const preview = formData.get("preview_file") as File | null
    const source = formData.get("source_file") as File | null

    console.log("[v0][upload] form data:", {
      title,
      description: description.substring(0, 50),
      pne: price_non_exclusive,
      pex: price_exclusive,
      previewName: preview?.name,
      previewSize: preview?.size,
      sourceName: source?.name,
      sourceSize: source?.size,
    })

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
      console.log("[v0][upload] invalid non-exclusive price:", price_non_exclusive)
      return err("VALIDATION_FAILED", "Non-exclusive price must be a valid number greater than $0. Example: 49.99")
    }

    if (pex === null || isNaN(pex) || pex <= 0) {
      console.log("[v0][upload] invalid exclusive price:", price_exclusive)
      return err("VALIDATION_FAILED", "Exclusive price must be a valid number greater than $0. Example: 499.99")
    }

    if (pex <= pne) {
      console.log("[v0][upload] exclusive price not higher than non-exclusive")
      return err("VALIDATION_FAILED", "Exclusive price must be higher than non-exclusive price")
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0][upload] MISSING BLOB TOKEN")
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

    console.log("[v0][upload] validation passed, tags:", tags)
    console.log("[v0][upload] uploading to blob storage...")

    let preview_url: string
    let image_url: string

    try {
      console.log("[v0][upload] uploading preview:", { name: preview!.name, size: preview!.size })
      const previewBlob = await put(`previews/${user.id}/${Date.now()}_${preview!.name}`, preview!, {
        access: "public",
      })
      preview_url = previewBlob.url
      console.log("[v0][upload] preview uploaded:", preview_url)

      console.log("[v0][upload] uploading source:", { name: source!.name, size: source!.size })
      const sourceBlob = await put(`designs/${user.id}/${Date.now()}_${source!.name}`, source!, {
        access: "public",
      })
      image_url = sourceBlob.url
      console.log("[v0][upload] source uploaded:", image_url)
    } catch (blobError: any) {
      console.error("[v0][upload] BLOB ERROR:", blobError?.message || blobError)
      return err("BLOB_UPLOAD_FAILED", "Failed to upload files. Try smaller files or another format.")
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

    console.log("[v0][upload] inserting into database...")
    const { data, error: dbError } = await supabase.from("designs").insert(payload).select("id").single()

    if (dbError) {
      console.error("[v0][upload] DB ERROR:", {
        code: dbError.code,
        message: dbError.message,
        hint: dbError.hint,
        details: dbError.details,
      })

      if (dbError.code === "42501") {
        return err("DB_INSERT_FAILED", "Permission denied. Please ensure you're logged in as a designer.")
      }

      if (dbError.code === "23503") {
        return err("DB_INSERT_FAILED", "Profile error occurred. Please refresh the page and try again.")
      }

      return err("DB_INSERT_FAILED", `Database error: ${dbError.message}`)
    }

    if (!data || !data.id) {
      console.error("[v0][upload] No data returned from insert")
      return err("DB_INSERT_FAILED", "Failed to save design. Please try again.")
    }

    console.log("[v0][upload] ==> SUCCESS! Design ID:", data.id)
    return ok({ id: data.id })
  } catch (unexpectedError: any) {
    console.error("[v0][upload] UNEXPECTED ERROR:", unexpectedError?.message || unexpectedError)
    return err("UNEXPECTED", "An unexpected error occurred. Please try again.")
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
