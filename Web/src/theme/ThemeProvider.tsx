import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ThemeContext,
  type Theme,
  type ThemeContextValue,
} from './theme-context'

const THEME_STORAGE_KEY = 'odo.theme'

function getInitialTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }, [theme])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.key === THEME_STORAGE_KEY &&
        (event.newValue === 'light' || event.newValue === 'dark')
      ) {
        setTheme(event.newValue)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) =>
      currentTheme === 'light' ? 'dark' : 'light',
    )
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
