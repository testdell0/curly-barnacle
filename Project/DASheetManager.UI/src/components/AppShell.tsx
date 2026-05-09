import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LayoutTemplate,
  FileSpreadsheet,
  BookOpenCheck,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Moon,
  Sun,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/sheets', label: 'DA Sheets', icon: <FileSpreadsheet className="w-4 h-4" /> },
  { to: '/templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" />, adminOnly: true },
  { to: '/users', label: 'Manage Users', icon: <Users className="w-4 h-4" />, adminOnly: true },
]

export function AppShell() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAdmin = user?.role === 'Admin'
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)
  const isDark = resolvedTheme === 'dark'

  function handleLogout() {
    logout.mutate()
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200 flex-shrink-0',
          sidebarOpen ? 'w-56' : 'w-14',
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <BookOpenCheck className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              DA Sheet Manager
            </span>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                )
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-2">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-4 flex-shrink-0">
          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-medium text-xs">
                {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <span className="hidden sm:block font-medium">{user?.fullName}</span>
              {user?.role === 'Admin' && (
                <span className="hidden sm:block text-xs text-purple-600 dark:text-purple-400 font-medium">Admin</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-20 py-1 overflow-hidden">
                  {/* User info */}
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.fullName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
                  </div>

                  {/* My Profile */}
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/profile') }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    My Profile
                  </button>

                  {/* Theme toggle */}
                  <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    {isDark
                      ? <Sun className="w-4 h-4 text-amber-500" />
                      : <Moon className="w-4 h-4 text-gray-400" />}
                    {isDark ? 'Light mode' : 'Dark mode'}
                  </button>

                  {/* Change Password */}
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/change-password') }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Change Password
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 mt-1" />

                  {/* Sign Out */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
