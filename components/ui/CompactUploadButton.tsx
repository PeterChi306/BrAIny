'use client'

import { useState, useRef } from 'react'
import { Paperclip, X, FileText, Image, File, Upload, Plus } from 'lucide-react'
import type { UploadedFile } from '@/types/modes'
import { cn } from '@/lib/utils'

interface CompactUploadButtonProps {
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  className?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg'
]

export function CompactUploadButton({ 
  onFilesChange, 
  maxFiles = 5,
  className = ""
}: CompactUploadButtonProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File): Promise<UploadedFile | null> => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`File ${file.name} is too large. Maximum size is 10MB`)
      return null
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert(`File type ${file.type} is not supported`)
      return null
    }

    let content: string | undefined
    if (file.type.startsWith('text/') || file.type.startsWith('image/')) {
      try {
        content = await readFileContent(file)
      } catch (error) {
        console.error('Error reading file:', error)
      }
    }

    const url = URL.createObjectURL(file)

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      url,
      content
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      if (file.type.startsWith('image/')) {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      } else {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(file)
      }
    })
  }

  const handleFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = []
    
    for (let i = 0; i < fileList.length && files.length + newFiles.length < maxFiles; i++) {
      const processedFile = await processFile(fileList[i])
      if (processedFile) {
        newFiles.push(processedFile)
      }
    }

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
    setShowPopup(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (type === 'application/pdf') return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className={cn("relative", className)}>
      {/* Premium Compact Upload Button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          fileInputRef.current?.click()
        }}
        className="p-3 rounded-xl bg-surface border border-border hover:bg-surface/80 hover:border-blue-500/50 hover:glow-hover transition-all duration-300 group relative flex items-center justify-center"
        title="Attach files"
      >
        <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
        
        {/* File Count Badge */}
        {files.length > 0 && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-sm glow-primary">
            {files.length}
          </div>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Popup Modal */}
      {showPopup && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50" 
            onClick={() => setShowPopup(false)}
          />
          
          {/* Popup Content */}
          <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:bottom-32 z-50">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl p-5 w-80 max-h-96 backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-500" />
                  Files ({files.length})
                </h3>
                <button
                  onClick={() => setShowPopup(false)}
                  className="p-1.5 rounded-lg hover:bg-surface hover:glow-hover transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* File List */}
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {files.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-3 glow-subtle">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">No files attached</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Click below to add files</p>
                  </div>
                ) : (
                  files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-surface/50 rounded-xl border border-border hover:bg-surface/80 transition-all duration-200 group">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-blue-600 transition-colors">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add More Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  fileInputRef.current?.click()
                  setShowPopup(false)
                }}
                className="w-full p-3 border-2 border-dashed border-border/50 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 hover:glow-hover transition-all duration-300 group"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground group-hover:text-blue-500 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add More Files</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* View Files Button */}
      {files.length > 0 && !showPopup && (
        <button
          onClick={() => setShowPopup(true)}
          className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium hover:bg-blue-700 transition-colors"
          title="View attached files"
        >
          {files.length}
        </button>
      )}
    </div>
  )
}
