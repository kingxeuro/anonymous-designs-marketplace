import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    console.error("[v0] Profile not found for user:", user.id)
    console.error("[v0] Profile error:", profileError)

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Profile Setup Required</CardTitle>
            <CardDescription>Your profile hasn't been created yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">To fix this issue:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Make sure you've run the SQL script:{" "}
                  <code className="text-xs bg-background px-1 py-0.5 rounded">007_fix_foreign_key.sql</code>
                </li>
                <li>Log out and log back in</li>
                <li>If the issue persists, contact support</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (profile.role === "designer") {
    redirect("/dashboard/designer")
  } else if (profile.role === "brand_owner") {
    redirect("/marketplace")
  } else if (profile.role === "admin") {
    redirect("/admin")
  }

  redirect("/marketplace")
}
