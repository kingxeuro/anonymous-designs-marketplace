"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CreatePurchaseParams {
  designId: string
  designerId: string
  licenseType: "non_exclusive" | "exclusive_buyout"
  price: number
  platformFee: number
  designerEarnings: number
}

export async function createPurchase({
  designId,
  designerId,
  licenseType,
  price,
  platformFee,
  designerEarnings,
}: CreatePurchaseParams) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Not authenticated" }
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("design_id", designId)
      .eq("buyer_id", user.id)
      .single()

    if (existingPurchase) {
      return { error: "You have already purchased this design" }
    }

    // Check if sold exclusively
    const { data: exclusivePurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("design_id", designId)
      .eq("license_type", "exclusive_buyout")
      .single()

    if (exclusivePurchase) {
      return { error: "This design has been sold exclusively" }
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        design_id: designId,
        buyer_id: user.id,
        license_type: licenseType,
        price_paid: price,
        download_url: `/downloads/${designId}`, // In production, this would be a secure download URL
      })
      .select()
      .single()

    if (purchaseError) throw purchaseError

    // Create transaction record
    const { error: transactionError } = await supabase.from("transactions").insert({
      purchase_id: purchase.id,
      buyer_id: user.id,
      designer_id: designerId,
      amount: price,
      platform_fee: platformFee,
      designer_earnings: designerEarnings,
      status: "completed",
      stripe_payment_intent_id: `demo_${Date.now()}`, // In production, this would be the actual Stripe payment intent ID
    })

    if (transactionError) throw transactionError

    // If exclusive buyout, update design status
    if (licenseType === "exclusive_buyout") {
      await supabase.from("designs").update({ status: "sold_exclusive" }).eq("id", designId)
    }

    revalidatePath("/marketplace")
    revalidatePath(`/marketplace/${designId}`)
    revalidatePath("/dashboard/designer")

    return { success: true, purchaseId: purchase.id }
  } catch (error) {
    console.error("[v0] Purchase error:", error)
    return { error: "Failed to process purchase" }
  }
}
