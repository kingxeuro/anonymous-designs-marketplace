"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"

const MAX_PREVIEW_MB = 5
const MAX_SOURCE_MB = 25

export default function UploadDesignPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priceNonExclusive, setPriceNonExclusive] = useState("")
  const [priceExclusive, setPriceExclusive] = useState("")
  const [tags, setTags] = useState("")
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const fileMB = file.size / (1024 * 1024)
      if (fileMB > MAX_PREVIEW_MB) {
        setError(`Preview file must be <= ${MAX_PREVIEW_MB}MB. Your file is ${fileMB.toFixed(2)}MB.`)
        e.target.value = ""
        return
      }

      setPreviewFile(file)
      setError(null)

      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.onerror = () => {
          setError("Failed to read preview file. Please try again.")
          setPreviewFile(null)
          setImagePreview(null)
        }
        reader.readAsDataURL(file)
      } else {
        setImagePreview(null)
      }
    }
  }

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const fileMB = file.size / (1024 * 1024)
      if (fileMB > MAX_SOURCE_MB) {
        setError(`Source file must be <= ${MAX_SOURCE_MB}MB. Your file is ${fileMB.toFixed(2)}MB.`)
        e.target.value = ""
        return
      }

      setSourceFile(file)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!previewFile) {
      setError("Please select a preview image")
      return
    }

    if (!sourceFile) {
      setError("Please select a source file")
      return
    }

    if (!title.trim()) {
      setError("Please enter a title")
      return
    }

    const previewMB = previewFile.size / (1024 * 1024)
    const sourceMB = sourceFile.size / (1024 * 1024)

    if (previewMB > MAX_PREVIEW_MB) {
      setError(`Preview must be <= ${MAX_PREVIEW_MB}MB. Your file is ${previewMB.toFixed(2)}MB.`)
      return
    }

    if (sourceMB > MAX_SOURCE_MB) {
      setError(`Source must be <= ${MAX_SOURCE_MB}MB. Your file is ${sourceMB.toFixed(2)}MB.`)
      return
    }

    const nonExclusivePrice = Number.parseFloat(priceNonExclusive)
    const exclusivePrice = Number.parseFloat(priceExclusive)

    if (!priceNonExclusive || Number.isNaN(nonExclusivePrice) || nonExclusivePrice <= 0) {
      setError("Please enter a valid non-exclusive price")
      return
    }

    if (!priceExclusive || Number.isNaN(exclusivePrice) || exclusivePrice <= 0) {
      setError("Please enter a valid exclusive price")
      return
    }

    const formData = new FormData()
    formData.append("title", title.trim())
    formData.append("description", description.trim())
    formData.append("price_non_exclusive", nonExclusivePrice.toString())
    formData.append("price_exclusive", exclusivePrice.toString())
    formData.append("tags", tags.trim())
    formData.append("preview_file", previewFile)
    formData.append("source_file", sourceFile)

    startTransition(async () => {
      try {
        const res = await fetch("/api/designs/submit", { method: "POST", body: formData })
        const result = await res.json().catch(() => null)

        if (!res.ok || !result?.ok) {
          const code = result?.code || "UNEXPECTED"
          const errorMessages: Record<string, string> = {
            UNAUTHENTICATED: "Please log in to upload designs.",
            VALIDATION_FAILED: result?.message || "Please check your input and try again.",
            FILE_TOO_LARGE: result?.message || "Your files are too large. Please use smaller files.",
            CONFIG_ERROR: "Storage is not configured. Please contact support.",
            BLOB_UPLOAD_FAILED: "File upload failed. Try a smaller file or different format.",
            DB_INSERT_FAILED: "We couldn't save your design. Please try again.",
            UNEXPECTED: "Something went wrong. Please try again.",
          }
          const errorMsg = errorMessages[code] || result?.message || "Upload failed."
          setError(errorMsg)
          return
        }

        window.location.href = `/dashboard/designer/submitted/${result.data.id}`
      } catch (err) {
        setError("Network error. Please try again.")
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Upload Design</h1>
          <p className="mt-2 text-muted-foreground">Submit your design for review and approval</p>
        </div>

        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Design Details</CardTitle>
            <CardDescription>Provide information about your design and set your pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="preview_file">Preview Image (Max {MAX_PREVIEW_MB}MB)</Label>
                {previewFile ? (
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border/40">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewFile(null)
                            setImagePreview(null)
                          }}
                          className="absolute right-2 top-2 rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/40 bg-background/50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{previewFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewFile(null)
                              setImagePreview(null)
                            }}
                            className="rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="preview_file"
                    className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/40 bg-background/50 transition-colors hover:border-accent/50 hover:bg-accent/5"
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload preview</span>
                    <span className="mt-1 text-xs text-muted-foreground">PNG or JPG</span>
                    <span className="mt-1 text-xs text-muted-foreground">Max {MAX_PREVIEW_MB}MB</span>
                    <input
                      id="preview_file"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={handlePreviewChange}
                      required
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_file">Source File (Max {MAX_SOURCE_MB}MB)</Label>
                {sourceFile ? (
                  <div className="rounded-lg border border-border/40 bg-background/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{sourceFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(sourceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSourceFile(null)}
                        className="rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="source_file"
                    className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/40 bg-background/50 transition-colors hover:border-accent/50 hover:bg-accent/5"
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload source file</span>
                    <span className="mt-1 text-xs text-muted-foreground">PSD, AI, Sketch, Figma, or other formats</span>
                    <span className="mt-1 text-xs text-muted-foreground">Max {MAX_SOURCE_MB}MB</span>
                    <input
                      id="source_file"
                      type="file"
                      accept=".psd,.ai,.sketch,.fig,image/*"
                      className="hidden"
                      onChange={handleSourceChange}
                      required
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter design title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your design..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priceNonExclusive">Non-Exclusive Price ($)</Label>
                  <Input
                    id="priceNonExclusive"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="49.99"
                    value={priceNonExclusive}
                    onChange={(e) => setPriceNonExclusive(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Multiple buyers can purchase</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceExclusive">Exclusive Buyout Price ($)</Label>
                  <Input
                    id="priceExclusive"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="499.99"
                    value={priceExclusive}
                    onChange={(e) => setPriceExclusive(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">One buyer gets full rights</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="streetwear, minimal, typography"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Uploading..." : "Submit for Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
