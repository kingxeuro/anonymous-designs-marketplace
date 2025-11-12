"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { put } from "@vercel/blob"
import { unstable_noStore as noStore } from "next/cache"

// Force cache invalidation: Design upload server actions - v2.0
// This file handles design submissions, approvals, and rejections

export async function submitDesignAction(formData: FormData) {
  noStore() // Prevent caching of this function

  console.log("[v0][upload] Starting design submission")

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("[v0][upload] Authentication failed:", authError)
    return { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in to upload designs" }
  }

  console.log("[v0][upload] User authenticated:", user.email)

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const priceNonExclusive = formData.get("price_non_exclusive") as string
  const priceExclusive = formData.get("price_exclusive") as string
  const tags = formData.get("tags") as string
  const previewFile = formData.get("preview_file") as File
  const sourceFile = formData.get("source_file") as File

  console.log("[v0][upload] Form data:", {
    title,
    priceNonExclusive,
    priceExclusive,
    hasPreview: !!previewFile,
    hasSource: !!sourceFile,
  })

  if (!title || title.trim().length < 3) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Title must be at least 3 characters long" }
  }

  if (!description || description.trim().length < 10) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Description must be at least 10 characters long" }
  }

  const nonExclusivePrice = Number.parseFloat(priceNonExclusive)
  if (isNaN(nonExclusivePrice) || nonExclusivePrice <= 0) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Non-exclusive price must be a valid number greater than $0. Example: 49.99",
    }
  }

  const exclusivePrice = Number.parseFloat(priceExclusive)
  if (isNaN(exclusivePrice) || exclusivePrice <= 0) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Exclusive price must be a valid number greater than $0. Example: 499.99",
    }
  }

  if (exclusivePrice <= nonExclusivePrice) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Exclusive price must be higher than non-exclusive price" }
  }

  if (!previewFile || previewFile.size === 0) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Design preview image is required" }
  }

  if (previewFile.size > 10 * 1024 * 1024) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Preview image must be smaller than 10MB" }
  }

  if (!sourceFile || sourceFile.size === 0) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Design source file is required" }
  }

  if (sourceFile.size > 50 * 1024 * 1024) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Source file must be smaller than 50MB" }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[v0][upload] BLOB_READ_WRITE_TOKEN not configured")
    return { ok: false, code: "CONFIG_ERROR", message: "Storage is not configured. Please contact support." }
  }

  console.log("[v0][upload] Validation passed, uploading files to Blob...")

  let previewUrl: string
  let sourceUrl: string

  try {
    const previewBlob = await put(`designs/${user.id}/${Date.now()}-preview-${previewFile.name}`, previewFile, {
      access: "public",
    })
    previewUrl = previewBlob.url
    console.log("[v0][upload] Preview image uploaded:", previewUrl)

    const sourceBlob = await put(`designs/${user.id}/${Date.now()}-source-${sourceFile.name}`, sourceFile, {
      access: "public",
    })
    sourceUrl = sourceBlob.url
    console.log("[v0][upload] Source file uploaded:", sourceUrl)
  } catch (blobError) {
    console.error("[v0][upload] Blob upload failed:", blobError)
    return {
      ok: false,
      code: "BLOB_UPLOAD_FAILED",
      message: "Failed to upload files. Try smaller files or another format.",
    }
  }

  const tagsArray = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)

  const insertData = {
    designer_id: user.id,
    title: title.trim(),
    description: description.trim(),
    preview_url: previewUrl,
    image_url: sourceUrl,
    price_non_exclusive: nonExclusivePrice,
    price_exclusive: exclusivePrice,
    tags: tagsArray,
    status: "pending",
  }

  console.log("[v0][upload] Inserting into database:", insertData)

  const { data: design, error: dbError } = await supabase.from("designs").insert(insertData).select().single()

  if (dbError) {
    console.error("[v0][upload] Database insert failed:", dbError)

    if (dbError.code === "42501") {
      return {
        ok: false,
        code: "DB_INSERT_FAILED",
        message: "Permission denied. Please ensure you're logged in as a designer.",
      }
    }

    if (dbError.code === "23503") {
      return {
        ok: false,
        code: "DB_INSERT_FAILED",
        message: "Your profile is not set up correctly. Please contact support.",
      }
    }

    return { ok: false, code: "DB_INSERT_FAILED", message: `Database error: ${dbError.message}` }
  }

  console.log("[v0][upload] Design uploaded successfully:", design.id)

  return { ok: true, data: { id: design.id } }
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
