"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function moderateDesign(designId: string, status: "approved" | "rejected", reason?: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Not authenticated" }
    }

    // Verify user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return { error: "Unauthorized" }
    }

    // Update design status
    const { error } = await supabase.from("designs").update({ status }).eq("id", designId)

    if (error) throw error

    // In production, you might want to notify the designer about the decision
    // For now, we'll just log it
    console.log(`[v0] Design ${designId} ${status}${reason ? ` - Reason: ${reason}` : ""}`)

    revalidatePath("/admin")
    revalidatePath("/marketplace")
    revalidatePath("/dashboard/designer")

    return { success: true }
  } catch (error) {
    console.error("[v0] Moderation error:", error)
    return { error: "Failed to moderate design" }
  }
}
