'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  Download, 
  Printer, 
  Share2, 
  Check,
  X,
  FileText,
  BookOpen
} from 'lucide-react'

interface StudyGuideDisplayProps {
  content: string
  onClose: () => void
  title?: string
}

export function StudyGuideDisplay({ content, onClose, title = "Study Guide" }: StudyGuideDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Create blob from content
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.replace(/\s+/g, '_')}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download study guide')
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    try {
      // Create print window
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        // Convert markdown to basic HTML for printing
        const htmlContent = content
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^\- (.*$)/gim, '<li>$1</li>')
          .replace(/^\*\* (.*$)/gim, '<li>$1</li>')
          .replace(/^- (.*$)/gim, '<li>$1</li>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>')
        
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
                h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
                h2 { color: #1e40af; margin-top: 30px; }
                h3 { color: #3730a3; margin-top: 20px; }
                li { margin: 5px 0; }
                ul { margin: 10px 0; }
                @media print { body { margin: 10px; } }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              <p>${htmlContent}</p>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error('Print failed:', error)
      alert('Failed to print study guide')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: content,
          url: window.location.href
        })
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(content)
        alert('Study guide copied to clipboard!')
      }
    } catch (error) {
      console.error('Share failed:', error)
      alert('Failed to share study guide')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive study guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span>Ready to study</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
              
              <Button
                onClick={handlePrint}
                disabled={isPrinting}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                {isPrinting ? 'Printing...' : 'Print'}
              </Button>
              
              <Button
                onClick={handleShare}
                disabled={isSharing}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {isSharing ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
