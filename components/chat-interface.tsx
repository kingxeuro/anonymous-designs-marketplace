"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { sendMessage } from "@/app/actions/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"

type Message = {
  id: string
  message: string
  created_at: string
  sender_id: string
  profiles: {
    id: string
    role: string
    display_name: string
  }
}

type ChatInterfaceProps = {
  designId: string
  initialMessages: Message[]
  currentUserId: string
  designStatus: string
}

export function ChatInterface({ designId, initialMessages, currentUserId, designStatus }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${designId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `design_id=eq.${designId}`,
        },
        async (payload) => {
          // Fetch the full message with profile data
          const { data } = await supabase
            .from("messages")
            .select("*, profiles!messages_sender_id_fkey(id, role, display_name)")
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as Message])
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [designId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || sending) return

    setSending(true)
    const result = await sendMessage(designId, newMessage)

    if (result.error) {
      alert(result.error)
    } else {
      setNewMessage("")
      router.refresh()
    }

    setSending(false)
  }

  const getDisplayName = (message: Message) => {
    if (message.sender_id === currentUserId) {
      return "You"
    }
    return message.profiles.role === "designer" ? "Designer" : "Brand Owner"
  }

  const getInitials = (message: Message) => {
    if (message.sender_id === currentUserId) {
      return "Y"
    }
    return message.profiles.role === "designer" ? "D" : "B"
  }

  const isClosed = designStatus === "sold_exclusive"

  return (
    <Card className="flex h-[600px] flex-col border-border/40 bg-card/50 backdrop-blur">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Anonymous Chat
        </CardTitle>
        {isClosed && <p className="text-sm text-muted-foreground">This chat is closed (design sold exclusively)</p>}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <MessageCircle className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUserId
              return (
                <div key={message.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}>
                      {getInitials(message)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : ""}`}>
                    <span className="text-xs text-muted-foreground">{getDisplayName(message)}</span>
                    <div
                      className={`rounded-lg px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!isClosed && (
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
