"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { LayoutDashboard, Upload, ShoppingBag, LogOut, Shield } from "lucide-react"

interface DashboardNavProps {
  role: "designer" | "brand_owner" | "admin"
  displayName: string
}

export function DashboardNav({ role, displayName }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems =
    role === "designer"
      ? [
          { href: "/dashboard/designer", label: "Dashboard", icon: LayoutDashboard },
          { href: "/dashboard/designer/upload", label: "Upload Design", icon: Upload },
          { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
        ]
      : role === "admin"
        ? [
            { href: "/admin", label: "Moderation", icon: Shield },
            { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
          ]
        : [
            { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
            { href: "/dashboard/purchases", label: "My Purchases", icon: LayoutDashboard },
          ]

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-mono text-sm font-bold text-primary-foreground">AD</span>
            </div>
            <span className="hidden text-lg font-semibold tracking-tight sm:block">Anonymous Designs</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent/10 text-foreground"
                      : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden text-sm sm:block">
            <span className="text-muted-foreground">Signed in as </span>
            <span className="font-medium">{displayName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
