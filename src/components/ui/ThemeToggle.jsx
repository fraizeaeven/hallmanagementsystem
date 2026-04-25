import { useTheme } from '@/contexts/ThemeContext'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      aria-label="Toggle theme"
      title="Toggle Dark/Light Mode"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
