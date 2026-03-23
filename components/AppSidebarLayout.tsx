'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Camera, CalendarDays, TrendingUp, User, Settings, LogOut, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSupabaseClient } from '@/lib/supabase/client'

export function AppSidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseClient()

  // App routes that should have the sidebar
  const isAppRoute = pathname?.startsWith('/home') || 
                     pathname?.startsWith('/scan') || 
                     pathname?.startsWith('/planner') || 
                     pathname?.startsWith('/progress') || 
                     pathname?.startsWith('/you') ||
                     pathname?.startsWith('/tutor') ||
                     pathname?.startsWith('/settings') ||
                     pathname?.startsWith('/concepts') ||
                     pathname?.startsWith('/flashcards') ||
                     pathname?.startsWith('/smart-plans') ||
                     pathname?.startsWith('/streak') ||
                     pathname?.startsWith('/gamification')

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Brain, label: 'Tutor', path: '/tutor?new=true' },
    { icon: Camera, label: 'Scan', path: '/scan' },
    { icon: CalendarDays, label: 'Planner', path: '/planner' },
    { icon: TrendingUp, label: 'Progress', path: '/progress' },
    { icon: User, label: 'Profile', path: '/you' },
  ]

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!isAppRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#0f0f0f]">
      {/* Desktop Sidebar Rail */}
      <aside className="hidden lg:flex z-50 w-20 bg-[#f9f9f9] dark:bg-[#171717] border-r border-gray-200/60 dark:border-white/5 flex-col flex-shrink-0 h-full items-center py-4">
        <div className="mb-6 cursor-pointer" onClick={() => router.push('/home')}>
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-sm hover:scale-105 transition-transform bg-white dark:bg-black p-0.5">
             <img src="/brAIny%20icon.png" alt="brAIny Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full px-3 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  'flex items-center justify-center w-full aspect-square rounded-2xl transition-all group relative',
                  active 
                    ? 'bg-black/5 dark:bg-white/10 shadow-sm' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                )}
                title={item.label}
              >
                <Icon className={cn('w-6 h-6', active ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 group-hover:dark:text-white')} strokeWidth={active ? 2.5 : 2} />
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 w-full px-3 pt-4 border-t border-gray-200/60 dark:border-white/5">
           <button onClick={() => router.push('/settings')} className="flex items-center justify-center w-full aspect-square rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group" title="Settings">
             <Settings className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 group-hover:dark:text-white" />
           </button>
           <button onClick={handleLogout} className="flex items-center justify-center w-full aspect-square rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group" title="Logout">
             <LogOut className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-red-500" />
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative h-full overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Navigation (Hidden on LG) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-3 pb-4 pt-2 bg-white/90 dark:bg-[#171717]/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-white/10 safe-area-inset-bottom">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all',
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <Icon className={cn('w-6 h-6 transition-transform', active && 'scale-110')} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
