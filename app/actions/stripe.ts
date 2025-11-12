"use server"

import { stripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase/server"

export async function createCheckoutSession(designId: string, licenseType: "non_exclusive" | "exclusive_buyout") {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Get design details
  const { data: design } = await supabase
    .from("designs")
    .select("*, profiles!designs_designer_id_fkey(display_name)")
    .eq("id", designId)
    .single()

  if (!design) {
    throw new Error("Design not found")
  }

  const price = licenseType === "exclusive_buyout" ? design.price_exclusive : design.price_non_exclusive

  const priceInCents = Math.round(Number.parseFloat(price) * 100)

  // Create checkout session with escrow metadata
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: design.title,
            description: `${licenseType === "exclusive_buyout" ? "Exclusive" : "Non-Exclusive"} License`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      design_id: designId,
      designer_id: design.designer_id,
      buyer_id: user.id,
      license_type: licenseType,
    },
  })

  return session.client_secret
}

export async function releaseEscrow(transactionId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Get transaction
  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("buyer_id", user.id)
    .single()

  if (!transaction || transaction.escrow_status !== "held") {
    throw new Error("Invalid transaction")
  }

  // Update escrow status
  const { error } = await supabase
    .from("transactions")
    .update({
      escrow_status: "released",
      escrow_release_at: new Date().toISOString(),
    })
    .eq("id", transactionId)

  if (error) {
    throw new Error("Failed to release escrow")
  }

  return { success: true }
}
