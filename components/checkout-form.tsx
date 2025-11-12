"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPurchase } from "@/app/actions/purchase"
import { CreditCard } from "lucide-react"

interface CheckoutFormProps {
  designId: string
  designerId: string
  licenseType: "non_exclusive" | "exclusive_buyout"
  price: number
  platformFee: number
  designerEarnings: number
}

export function CheckoutForm({
  designId,
  designerId,
  licenseType,
  price,
  platformFee,
  designerEarnings,
}: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    try {
      // In production, this would integrate with Stripe
      // For demo purposes, we'll simulate a successful payment
      const result = await createPurchase({
        designId,
        designerId,
        licenseType,
        price,
        platformFee,
        designerEarnings,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Redirect to success page
      router.push(`/checkout/success?purchaseId=${result.purchaseId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>Enter your payment information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="4242 4242 4242 4242"
                className="bg-background/50 pl-10"
                required
                disabled={isProcessing}
              />
              <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" placeholder="MM/YY" className="bg-background/50" required disabled={isProcessing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" placeholder="123" className="bg-background/50" required disabled={isProcessing} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input id="name" placeholder="John Doe" className="bg-background/50" required disabled={isProcessing} />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? "Processing..." : `Pay $${price.toFixed(2)}`}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            This is a demo. No real payment will be processed.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
