"use client"

import React from "react"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UploadIcon, X } from "lucide-react"
import Image from "next/image"

const MAX_FILE_MB = 25

export default function UploadDesignPage() {
  const [loading, setLoading] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [priceNonExclusive, setPriceNonExclusive] = React.useState("")
  const [priceExclusive, setPriceExclusive] = React.useState("")
  const [tags, setTags] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [previewFile, setPreviewFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const fileMB = selectedFile.size / (1024 * 1024)
    if (fileMB > MAX_FILE_MB) {
      setError(`File must be <= ${MAX_FILE_MB}MB. Your file is ${fileMB.toFixed(2)}MB.`)
      e.target.value = ""
      return
    }

    setFile(selectedFile)
    setError(null)

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.onerror = () => {
        setError("Failed to read file. Please try again.")
        setFile(null)
        setImagePreview(null)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setImagePreview(null)
    }
  }

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const fileMB = selectedFile.size / (1024 * 1024)
    if (fileMB > 5) {
      setError(`Preview must be <= 5MB. Your file is ${fileMB.toFixed(2)}MB.`)
      e.target.value = ""
      return
    }

    setPreviewFile(selectedFile)
    setError(null)

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.onerror = () => {
        setError("Failed to read preview. Please try again.")
        setPreviewFile(null)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !file) {
      setError("Title and file are required.")
      return
    }

    const mb = (f: File) => f.size / (1024 * 1024)
    if (mb(file) > MAX_FILE_MB) {
      setError(`File must be <= ${MAX_FILE_MB}MB.`)
      return
    }
    if (previewFile && mb(previewFile) > 5) {
      setError("Optional preview must be <= 5MB.")
      return
    }

    setLoading(true)
    try {
      const fileBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/handle",
      })

      let previewUrl: string | undefined
      if (previewFile) {
        const previewBlob = await upload(previewFile.name, previewFile, {
          access: "public",
          handleUploadUrl: "/api/blob/handle",
        })
        previewUrl = previewBlob.url
      }

      let parsedTags: string[] = []
      if (tags.trim()) {
        parsedTags = tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        price_non_exclusive: priceNonExclusive ? Number(priceNonExclusive) : null,
        price_exclusive: priceExclusive ? Number(priceExclusive) : null,
        tags: parsedTags,
        file_url: fileBlob.url,
        preview_url: previewUrl || null,
      }

      const res = await fetch("/api/designs/submit-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json().catch(() => null)

      if (!res.ok || !result?.ok) {
        const code = result?.code || "UNEXPECTED"
        const errorMap: Record<string, string> = {
          UNAUTHENTICATED: "Please log in to upload.",
          VALIDATION_FAILED: result?.message || "Please fill all required fields.",
          DB_INSERT_FAILED: "We couldn't save your design. Try again shortly.",
          UNEXPECTED: "Unexpected error. Try again.",
        }
        setError(errorMap[code] ?? "Upload failed.")
        return
      }

      window.location.href = "/dashboard/designer/upload/success"
    } catch (err) {
      console.error("[client-upload] error", err)
      setError("Upload failed. Try a smaller file or a different format.")
    } finally {
      setLoading(false)
    }
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
            <CardDescription>Upload your design file and provide details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file">Design File (Required, Max {MAX_FILE_MB}MB)</Label>
                {file ? (
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
                            setFile(null)
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
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null)
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
                    htmlFor="file"
                    className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/40 bg-background/50 transition-colors hover:border-accent/50 hover:bg-accent/5"
                  >
                    <UploadIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload your design</span>
                    <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, PSD, AI, or other formats</span>
                    <span className="mt-1 text-xs text-muted-foreground">Max {MAX_FILE_MB}MB</span>
                    <input id="file" type="file" className="hidden" onChange={handleFileChange} required />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preview_file">Preview Image (Optional, Max 5MB)</Label>
                <p className="text-xs text-muted-foreground">
                  Upload a separate preview if your main file isn't an image
                </p>
                {previewFile ? (
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
                        onClick={() => setPreviewFile(null)}
                        className="rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="preview_file"
                    className="flex min-h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/40 bg-background/50 transition-colors hover:border-accent/50 hover:bg-accent/5"
                  >
                    <UploadIcon className="mb-2 h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Optional: Upload preview image</span>
                    <input
                      id="preview_file"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handlePreviewChange}
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
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Uploading..." : "Submit for Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={loading}
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
