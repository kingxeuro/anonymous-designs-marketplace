"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function StartAnonChatButton({
  designId,
  designerId,
}: {
  designId: string
  designerId: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design_id: designId, designer_id: designerId }),
      })
      const json = await res.json()

      if (!res.ok || !json?.ok) {
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        alert(json?.message || "Could not start chat.")
        return
      }

      router.push(`/chat/${json.data.id}`)
    } catch (error) {
      console.error("[StartAnonChatButton] Error:", error)
      alert("Failed to start chat.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={onClick} disabled={loading} variant="outline" className="w-full bg-transparent">
      <MessageCircle className="mr-2 h-4 w-4" />
      {loading ? "Starting…" : "Message Designer (Anonymous)"}
    </Button>
  )
}
