'use client'

import { useCallback, useEffect, useState } from 'react'

export type Theme = 'revista' | 'pixel16'

const STORAGE_KEY = 'rtt_theme'
const DEFAULT: Theme = 'revista'

function getStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'pixel16' ? 'pixel16' : DEFAULT
  } catch {
    return DEFAULT
  }
}

function applyTheme(theme: Theme) {
  if (theme === 'pixel16') {
    document.documentElement.dataset.theme = 'pixel16'
  } else {
    delete document.documentElement.dataset.theme
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT)

  useEffect(() => {
    const stored = getStored()
    setThemeState(stored)
    // already applied by anti-flash script, but sync state
    applyTheme(stored)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'revista' ? 'pixel16' : 'revista')
  }, [theme, setTheme])

  return { theme, setTheme, toggle }
}
