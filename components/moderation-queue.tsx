"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Check, X, Eye } from "lucide-react"
import { moderateDesign } from "@/app/actions/moderation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Design {
  id: string
  title: string
  description: string | null
  image_url: string
  preview_url: string | null
  price_non_exclusive: number
  price_exclusive: number
  status: string
  tags: string[] | null
  created_at: string
  profiles?: {
    display_name: string
  }
}

interface ModerationQueueProps {
  designs: Design[]
  showAll?: boolean
}

export function ModerationQueue({ designs, showAll = false }: ModerationQueueProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const handleApprove = async (designId: string) => {
    setProcessingId(designId)
    try {
      await moderateDesign(designId, "approved")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (designId: string, reason: string) => {
    setProcessingId(designId)
    try {
      await moderateDesign(designId, "rejected", reason)
      setSelectedDesign(null)
      setRejectionReason("")
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "sold_exclusive":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Check className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">All caught up!</h3>
        <p className="text-sm text-muted-foreground">
          {showAll ? "No designs to display" : "No designs pending review"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {designs.map((design) => (
        <Card key={design.id} className="overflow-hidden border-border/40 bg-background/50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-border/40">
                <Image src={design.preview_url || design.image_url} alt={design.title} fill className="object-cover" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{design.title}</h3>
                    <p className="text-sm text-muted-foreground">by {design.profiles?.display_name || "Anonymous"}</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(design.status)}>
                    {design.status}
                  </Badge>
                </div>

                {design.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{design.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Non-exclusive: </span>
                    <span className="font-semibold">
                      ${Number.parseFloat(design.price_non_exclusive.toString()).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exclusive: </span>
                    <span className="font-semibold">
                      ${Number.parseFloat(design.price_exclusive.toString()).toFixed(2)}
                    </span>
                  </div>
                  {design.tags && design.tags.length > 0 && (
                    <div className="flex gap-1">
                      {design.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {design.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => handleApprove(design.id)} disabled={processingId === design.id}>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent"
                          onClick={() => setSelectedDesign(design)}
                          disabled={processingId === design.id}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-border/40 bg-card/95 backdrop-blur">
                        <DialogHeader>
                          <DialogTitle>Reject Design</DialogTitle>
                          <DialogDescription>
                            Provide a reason for rejecting this design. This will help the designer improve.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reason">Rejection Reason</Label>
                            <Textarea
                              id="reason"
                              placeholder="Please explain why this design is being rejected..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={4}
                              className="bg-background/50"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                if (selectedDesign) {
                                  handleReject(selectedDesign.id, rejectionReason)
                                }
                              }}
                              disabled={!rejectionReason.trim() || processingId === selectedDesign?.id}
                              className="flex-1"
                            >
                              Confirm Rejection
                            </Button>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="bg-transparent">
                                Cancel
                              </Button>
                            </DialogTrigger>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl border-border/40 bg-card/95 backdrop-blur">
                        <DialogHeader>
                          <DialogTitle>{design.title}</DialogTitle>
                          <DialogDescription>by {design.profiles?.display_name || "Anonymous"}</DialogDescription>
                        </DialogHeader>
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                          <Image
                            src={design.image_url || "/placeholder.svg"}
                            alt={design.title}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
