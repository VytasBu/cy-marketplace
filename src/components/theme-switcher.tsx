"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-xs">
        <Sun className="size-3.5" />
      </Button>
    )
  }

  const currentIndex = themes.findIndex((t) => t.value === theme)
  const next = themes[(currentIndex + 1) % themes.length]
  const CurrentIcon =
    themes.find((t) => t.value === theme)?.icon ?? Sun

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={() => setTheme(next.value)}
      aria-label={`Switch to ${next.label} theme`}
      title={`Current: ${theme} — click for ${next.label}`}
    >
      <CurrentIcon className="size-3.5" />
    </Button>
  )
}
