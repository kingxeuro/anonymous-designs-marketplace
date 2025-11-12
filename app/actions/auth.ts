"use server"

import { createClient } from "@/lib/supabase/server"

export async function signUpWithProfile(
  email: string,
  password: string,
  displayName: string,
  role: "designer" | "brand_owner",
) {
  const supabase = await createClient()

  console.log("[v0] Starting signup")

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role: role,
      },
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        "https://v0-anonymous-designs-marketplace.vercel.app/auth/callback",
    },
  })

  if (authError) {
    console.error("[v0] Auth error:", authError)
    return {
      success: false,
      error: authError.message.includes("already registered")
        ? "This email is already registered. Please login instead."
        : authError.message,
    }
  }

  if (!authData.user) {
    return { success: false, error: "Failed to create user account" }
  }

  console.log("[v0] User created successfully:", authData.user.id)
  console.log("[v0] Database trigger will create profile automatically")

  return {
    success: true,
    message: "Account created! Please check your email to confirm.",
  }
}

export async function createProfile(userId: string, displayName: string, role: "designer" | "brand_owner" | "admin") {
  const supabase = await createClient()

  console.log("[v0] Creating profile fallback for user:", userId)

  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle()

  if (existingProfile) {
    console.log("[v0] Profile already exists")
    return { success: true }
  }

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    display_name: displayName,
    role: role,
  })

  if (error) {
    // Ignore duplicate key errors
    if (error.code === "23505") {
      console.log("[v0] Profile already exists (duplicate)")
      return { success: true }
    }
    console.error("[v0] Error creating profile:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Profile created successfully")
  return { success: true }
}
