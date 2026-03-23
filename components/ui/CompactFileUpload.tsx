'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Upload, X, FileText, Image, File, Paperclip } from 'lucide-react'
import type { UploadedFile } from '@/types/modes'

interface CompactFileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSize?: number
  className?: string
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function CompactFileUpload({ 
  onFilesChange, 
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFiles = 5,
  maxSize = MAX_FILE_SIZE,
  className = ""
}: CompactFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [showExpanded, setShowExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File): Promise<UploadedFile | null> => {
    // Check file size
    if (file.size > maxSize) {
      alert(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`)
      return null
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      alert(`File type ${file.type} is not supported`)
      return null
    }

    // For text files and images, read content
    let content: string | undefined
    if (file.type.startsWith('text/') || file.type.startsWith('image/')) {
      try {
        content = await readFileContent(file)
      } catch (error) {
        console.error('Error reading file:', error)
      }
    }

    // Create file URL for preview
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
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (type.startsWith('image/')) return <Image className="w-3 h-3" />
    if (type === 'application/pdf') return <FileText className="w-3 h-3" />
    return <File className="w-3 h-3" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className={`relative ${className}`}>
      {/* Compact Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
        title="Attach files"
      >
        <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File Counter Badge */}
      {files.length > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
          {files.length}
        </div>
      )}

      {/* Expanded File List - Popup */}
      {showExpanded && files.length > 0 && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowExpanded(false)}
          />
          
          {/* File Popup */}
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Attached Files ({files.length})
              </h4>
              <button
                onClick={() => setShowExpanded(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-400">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add More Files Button */}
            <button
              onClick={() => {
                fileInputRef.current?.click()
              }}
              className="w-full mt-3 p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Upload className="w-4 h-4" />
                <span>Add more files</span>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Toggle button when files exist */}
      {files.length > 0 && !showExpanded && (
        <button
          onClick={() => setShowExpanded(true)}
          className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium hover:bg-blue-700 transition-colors"
          title="View attached files"
        >
          {files.length}
        </button>
      )}
    </div>
  )
}
