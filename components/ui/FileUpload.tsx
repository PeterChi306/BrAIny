'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import type { UploadedFile } from '@/types/modes'

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
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

export function FileUpload({ 
  onFilesChange, 
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFiles = 5,
  maxSize = MAX_FILE_SIZE 
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
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
    <div className="w-full">
      {/* Upload Area */}
      <Card
        className={`p-6 border-2 border-dashed transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload files to study
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">PDF</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">DOCX</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">PPTX</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">TXT</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">PNG</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">JPG</span>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
          >
            Choose Files
          </Button>
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          {files.map((file) => (
            <Card key={file.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-blue-600">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
