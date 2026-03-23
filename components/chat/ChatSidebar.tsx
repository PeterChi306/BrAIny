'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Trash2, 
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at?: string
  last_message_at?: string
  message_count: number
  last_message: string
}

interface ChatSidebarProps {
  sessions: ChatSession[]
  isOpen: boolean
  onClose: () => void
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  currentSessionId?: string
}

export function ChatSidebar({
  sessions,
  isOpen,
  onClose,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  currentSessionId
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Filter sessions based on search
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (deleteConfirmId === sessionId) {
      // Confirm deletion
      try {
        const response = await fetch(`/api/chat-sessions?sessionId=${sessionId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          onDeleteSession(sessionId)
          setDeleteConfirmId(null)
        }
      } catch (error) {
        console.error('Error deleting session:', error)
      }
    } else {
      // Show confirmation
      setDeleteConfirmId(sessionId)
      setTimeout(() => setDeleteConfirmId(null), 3000) // Auto-hide after 3 seconds
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 bg-background border-r border-border/50 z-40 transform transition-transform duration-300 ease-in-out",
        "flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:z-0 lg:pt-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-foreground">Chat History</h2>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onNewChat}
                className="h-8 px-3 hidden lg:flex"
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewChat}
                className="h-8 w-8 p-0 lg:hidden"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 lg:hidden"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNewChat}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative p-3 rounded-xl cursor-pointer transition-all duration-200",
                  "hover:bg-surface hover:shadow-sm",
                  currentSessionId === session.id 
                    ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800" 
                    : "bg-background border border-transparent"
                )}
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate mb-1">
                      {session.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {session.last_message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(session.last_message_at || session.updated_at || session.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {session.message_count}
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSession(session.id)
                    }}
                    className={cn(
                      "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                      "hover:bg-red-100 dark:hover:bg-red-900/20",
                      deleteConfirmId === session.id && "opacity-100"
                    )}
                  >
                    <Trash2 className={cn(
                      "w-3 h-3",
                      deleteConfirmId === session.id 
                        ? "text-red-500" 
                        : "text-muted-foreground hover:text-red-500"
                    )} />
                  </Button>
                </div>

                {/* Delete confirmation */}
                {deleteConfirmId === session.id && (
                  <div className="absolute inset-0 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center border border-red-200 dark:border-red-800">
                    <div className="text-center">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                        Delete this chat?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(null)
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSession(session.id)
                          }}
                          className="h-6 px-2 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={onNewChat}
            className="w-full justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>
      </div>
    </>
  )
}
