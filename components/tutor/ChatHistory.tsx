'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { MessageSquare, Edit2, Trash2, X, Check, Clock } from 'lucide-react'

interface Chat {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count?: number
}

interface ChatHistoryProps {
  currentChatId: string | null
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  isOpen: boolean
  onClose: () => void
  refreshTrigger?: number // New prop to force refresh
}

export function ChatHistory({ 
  currentChatId, 
  onChatSelect, 
  onNewChat,
  isOpen,
  onClose,
  refreshTrigger = 0
}: ChatHistoryProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    loadChats()
  }, [refreshTrigger]) // Reload when trigger changes

  const loadChats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: chatsData } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(30) // Increased limit for better breadth

      if (chatsData) {
        // Get message count for each chat
        const chatsWithCounts = await Promise.all(
          chatsData.map(async (chat) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
            
            return {
              ...chat,
              message_count: count || 0
            }
          })
        )
        
        setChats(chatsWithCounts)
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (chat: Chat) => {
    setEditingId(chat.id)
    setEditingTitle(chat.title)
  }

  const handleSaveEdit = async () => {
    if (!editingTitle.trim() || !editingId) return

    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: editingTitle.trim() })
        .eq('id', editingId)

      if (error) throw error

      setChats(prev => 
        prev.map(chat => 
          chat.id === editingId 
            ? { ...chat, title: editingTitle.trim() }
            : chat
        )
      )
      setEditingId(null)
      setEditingTitle('')
    } catch (error) {
      console.error('Error updating chat title:', error)
    }
  }

  const handleDelete = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return

    try {
      // Delete messages first
      await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId)

      // Delete chat
      await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)

      setChats(prev => prev.filter(chat => chat.id !== chatId))
      
      // If deleted current chat, start new chat
      if (chatId === currentChatId) {
        onNewChat()
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#f9f9f9] dark:bg-[#171717] border-r border-gray-200/60 dark:border-white/5 z-[60] transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-20 lg:h-screen flex flex-col font-sans">
        {/* Header */}
        <div className="flex-shrink-0 p-3 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 px-2 lg:hidden">Menu</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <button
            onClick={onNewChat}
            className="w-full bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-200 py-2.5 px-4 rounded-xl border border-gray-200/60 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] shadow-sm hover:shadow transition-all flex items-center justify-between group"
          >
            <span className="font-medium text-sm">New Chat</span>
            <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          <div className="px-2 py-2">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Recent</h3>
          </div>
          
          {loading ? (
            <div className="px-2 py-4 text-sm text-gray-400">Loading...</div>
          ) : chats.length === 0 ? (
            <div className="px-2 py-4 text-sm text-gray-400">No chats yet.</div>
          ) : (
            <div className="space-y-0.5">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    currentChatId === chat.id
                      ? 'bg-black/5 dark:bg-white/10'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  onClick={() => {
                    onChatSelect(chat.id)
                    onClose()
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingId === chat.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') {
                                setEditingId(null)
                                setEditingTitle('')
                              }
                            }}
                            className="flex-1 px-1.5 py-0.5 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded outline-none w-full"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button onClick={(e) => { e.stopPropagation(); handleSaveEdit() }} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(null); setEditingTitle('') }} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13px] font-medium text-gray-700 dark:text-gray-300 truncate tracking-tight">
                            {chat.title}
                          </h3>
                        </div>
                      )}
                    </div>
                    
                    {editingId !== chat.id && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(chat) }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(chat.id) }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
