import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(
    localStorage.getItem('theme') === 'dark'
  )

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return { isDark, toggleTheme: () => setIsDark(!isDark) }
}