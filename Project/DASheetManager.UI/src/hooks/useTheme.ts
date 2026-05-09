import { useEffect, useState, useCallback } from 'react'

type ThemeChoice = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'da-theme'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(choice: ThemeChoice) {
  const resolved = choice === 'system' ? getSystemTheme() : choice
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null
    return stored ?? 'system'
  })

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? getSystemTheme() : theme

  const setTheme = useCallback((next: ThemeChoice) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
    applyTheme(next)
  }, [])

  // Apply on mount and listen for OS-level changes when on 'system'
  useEffect(() => {
    applyTheme(theme)

    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return { theme, resolvedTheme, setTheme }
}

// Call once at the root before first render to prevent FOUC
export function bootstrapTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null
  applyTheme(stored ?? 'system')
}
