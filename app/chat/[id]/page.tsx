"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useRef, use } from "react"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

interface Profile {
  id: string
  display_name: string
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params)
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Record<string, Profile>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })
  }, [supabase.auth])

  // Load messages and participants
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      // Load conversation details
      const { data: conversation } = await supabase
        .from("conversations")
        .select(
          "buyer_id, designer_id, profiles!conversations_buyer_id_fkey(id, display_name), profiles!conversations_designer_id_fkey(id, display_name)",
        )
        .eq("id", conversationId)
        .single()

      if (conversation && isMounted) {
        const buyerProfile = Array.isArray(conversation.profiles) ? conversation.profiles[0] : conversation.profiles
        const designerProfile = Array.isArray(conversation.profiles) ? conversation.profiles[1] : conversation.profiles

        setParticipants({
          [conversation.buyer_id]: buyerProfile || { id: conversation.buyer_id, display_name: "Buyer" },
          [conversation.designer_id]: designerProfile || { id: conversation.designer_id, display_name: "Designer" },
        })
      }

      // Load messages
      const { data } = await supabase
        .from("messages")
        .select("id, content, sender_id, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (isMounted && data) setMessages(data)
    }

    loadData()

    // Subscribe to new messages
    const channel = supabase
      .channel(`msgs:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (isMounted) {
            setMessages((prev) => [...prev, payload.new as Message])
          }
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, message: text }),
      })

      if (!res.ok) {
        const json = await res.json()
        alert(json?.message || "Failed to send message.")
      }
    } catch (error) {
      console.error("[ChatPage] Error sending message:", error)
      alert("Failed to send message.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Anonymous Chat</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-4">
        <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground">
          Anonymous chat: Only display names are shown to protect your identity.
        </div>

        <div className="mb-4 flex-1 space-y-4 overflow-auto rounded-lg border border-border/40 bg-card/50 p-4">
          {messages.map((msg) => {
            const isCurrentUser = msg.sender_id === currentUserId
            const senderName = participants[msg.sender_id]?.display_name || "Unknown"

            return (
              <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] space-y-1 ${isCurrentUser ? "items-end" : "items-start"}`}>
                  <div className="text-xs font-medium text-muted-foreground">{senderName}</div>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </main>
    </div>
  )
}
