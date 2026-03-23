'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  HelpCircle, 
  User, 
  Monitor, 
  Check, 
  Droplets, 
  Save, 
  CreditCard, 
  XCircle, 
  Calendar, 
  Zap, 
  LogOut, 
  Settings, 
  Crown, 
  Sparkles, 
  Palette, 
  Volume2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  LifeBuoy,
  LogOut as LogOutIcon,
  Trash2,
  Lock,
  MessageSquare,
  Loader2
} from 'lucide-react'
import { Subscription, SubscriptionTier } from '@/types/database'
import { getSubscriptionLimits } from '@/lib/subscription'
import { NotificationSettings } from '@/components/NotificationSettings'
import { NotificationTest } from '@/components/NotificationTest'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'
import { PremiumBackground, PrestigeBorder, GlowingName, TierBadge } from '@/components/ui/PremiumUI'
import { cn } from '@/lib/utils'
import { useUserTier } from '@/contexts/UserTierContext'
import { UpgradeModal } from '@/components/ui/UpgradeModal'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { userTier } = useUserTier()
  const [saving, setSaving] = useState(false)
  const [editingDisplayName, setEditingDisplayName] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Get user profile
  const { displayName: profileDisplayName, refreshProfile } = useUserProfile()
  const [displayName, setDisplayName] = useState(profileDisplayName || 'Student')
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to delete account')

      // Deletion was successful, API route signs them out
      router.push('/auth/login')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please try again or contact support.')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login')
          return
        }
        setDisplayName(profileDisplayName || 'Student')
      } catch (error) {
        console.error('Settings load error:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router, supabase, profileDisplayName])

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: newDisplayName.trim() })
          .eq('id', user.id)

        if (error) throw error
        refreshProfile()
        setDisplayName(newDisplayName.trim())
        setEditingDisplayName(false)
      }
    } catch (error) {
      console.error('Error updating display name:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <PremiumBackground className="pb-32">
      {/* Header Overlay */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-[2.5rem] border border-black/5 dark:border-white/10 backdrop-blur-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Settings className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Command Center</h1>
          <p className="text-slate-500 dark:text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Customize your brAIny universe</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-8">
        
        {/* 1. IDENTITY & SUBSCRIPTION HUB */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <User className="w-4 h-4 text-blue-400" />
            <h2 className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em]">Identity & Access</h2>
          </div>
          
          <PrestigeBorder className="overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-[2rem]">
            <div className="p-8 space-y-8">
              {/* Profile Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-xl">
                    {displayName[0]?.toUpperCase()}
                  </div>
                  <div>
                    {editingDisplayName ? (
                      <div className="flex items-center gap-2">
                        <input 
                          value={newDisplayName}
                          onChange={e => setNewDisplayName(e.target.value)}
                          className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && handleUpdateDisplayName()}
                        />
                        <button onClick={handleUpdateDisplayName} className="p-1 text-green-500 dark:text-green-400" disabled={saving}><Check className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingDisplayName(true); setNewDisplayName(displayName); }}>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{displayName}</h3>
                        <Palette className="w-3 h-3 text-slate-400 dark:text-white/20 group-hover:text-blue-500 transition-colors" />
                      </div>
                    )}
                    <p className="text-xs text-slate-500 dark:text-white/40 font-medium tracking-wide">Syncing across devices</p>
                  </div>
                </div>
                <TierBadge size="sm" />
              </div>

              <div className="h-[1px] w-full bg-black/5 dark:bg-white/5" />

              {/* Manage Subscription Box */}
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-white/5 dark:to-white/[0.02] border border-black/5 dark:border-white/10 rounded-2xl p-5 group hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Subscription</p>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 mt-1 uppercase font-bold tracking-widest">{userTier} Plan</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    Manage
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                   <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2 border border-black/5 dark:border-white/5">
                      <p className="text-[8px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest">Active</p>
                   </div>
                   <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2 border border-black/5 dark:border-white/5">
                      <p className="text-[8px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest mb-1">Billing</p>
                      <p className="text-[10px] text-slate-700 dark:text-white/60 font-black uppercase tracking-widest">Monthly</p>
                   </div>
                </div>
              </div>
            </div>
          </PrestigeBorder>
        </section>

        {/* 2. EXPERIENCE SETTINGS */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Monitor className="w-4 h-4 text-purple-400" />
            <h2 className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em]">Visual & Sensory</h2>
          </div>
          
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-[2rem] overflow-hidden">
            {/* Theme Toggle */}
            <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                   {resolvedTheme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                   <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Theme Mode</p>
                   <p className="text-[10px] text-slate-500 dark:text-white/40 mt-1 uppercase font-bold tracking-widest">{resolvedTheme} engine</p>
                </div>
              </div>
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 border border-black/10 dark:border-white/10",
                  resolvedTheme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300",
                  resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                )} />
              </button>
            </div>

            {/* Notifications */}
            <div className="p-6">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-green-500 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Neural Alerts</p>
                    <p className="text-[10px] text-slate-500 dark:text-white/40 mt-1 uppercase font-bold tracking-widest">Push & Email</p>
                  </div>
               </div>
               <div className="bg-black/5 dark:bg-black/20 rounded-2xl p-4 border border-black/5 dark:border-white/5">
                 <NotificationSettings />
               </div>
            </div>
          </div>
        </section>

        {/* 3. LEGAL & SYSTEM */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <h2 className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em]">Safety & Connection</h2>
          </div>
          
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-[2rem] overflow-hidden divide-y divide-black/5 dark:divide-white/5">
            {[
              { label: 'Privacy Protocol', path: '/legal/privacy' },
              { label: 'Neural Terms', path: '/legal/terms' },
              { label: 'Intellectual Support', path: '/support' },
            ].map((item) => (
              <Link key={item.path} href={item.path} className="p-6 flex items-center justify-between group hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
            
            <button 
              onClick={handleLogout}
              className="p-6 w-full flex items-center justify-between group hover:bg-red-500/10 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                   <LogOutIcon className="w-5 h-5 text-red-500" />
                 </div>
                 <div>
                   <p className="text-sm font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Sever Connection</p>
                   <p className="text-[10px] text-red-500/50 dark:text-red-500/40 mt-1 uppercase font-bold tracking-widest">Sign out of session</p>
                 </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-500/30 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-4 text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.4em] hover:text-red-500 transition-all text-center"
          >
            Permanently Terminate Account Data
          </button>
        </section>

      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Premium Subscription Management"
        requiredTier={userTier === 'starter' ? 'scholar' : 'master'}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Terminate Account"
        size="md"
      >
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <Trash2 className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Are you sure?</h3>
          <p className="text-sm text-slate-500 dark:text-white/40 mb-8 font-medium">This will permanently erase your learning trajectory, scans, and chat history. You cannot undo this.</p>

          <div className="space-y-3">
             <Button 
               onClick={handleDeleteAccount}
               className="w-full py-7 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs"
               disabled={deleting}
             >
               {deleting ? 'Terminating...' : 'Yes, Delete Everything'}
             </Button>
             <button 
               onClick={() => setShowDeleteModal(false)}
               className="w-full py-4 text-slate-500 dark:text-white/60 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 dark:hover:text-white transition-all"
             >
               Cancel
             </button>
          </div>
        </div>
      </Modal>

      <BottomNavigation />
    </PremiumBackground>
  )
}
