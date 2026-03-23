'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Camera, Upload, Loader2, FileText, Download, Sparkles } from 'lucide-react'
import Tesseract from 'tesseract.js'

interface OCRProcessorProps {
  onTextExtracted: (text: string, imageData: string) => void
  onPDFGenerated?: (pdfUrl: string) => void
}

export function OCRProcessor({ onTextExtracted, onPDFGenerated }: OCRProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [imageData, setImageData] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const imageData = reader.result as string
      setImageData(imageData)
      await processImage(imageData)
    }
    reader.readAsDataURL(file)
  }

  const processImage = async (imageSource: string) => {
    setIsProcessing(true)
    setProgress(0)

    try {
      const result = await Tesseract.recognize(
        imageSource,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const text = result.data.text
      setExtractedText(text)
      onTextExtracted(text, imageSource)
    } catch (error) {
      console.error('OCR Error:', error)
      alert('Failed to extract text from image. Please try again.')
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (error) {
      console.error('Camera Error:', error)
      alert('Failed to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setImageData(imageData)
    stopCamera()
    processImage(imageData)
  }

  const generateEditablePDF = async () => {
    if (!extractedText) return

    setIsProcessing(true)

    try {
      // Create a more sophisticated editable PDF
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Editable Scanned Document</title>
              <style>
                body { 
                  font-family: 'Georgia', serif; 
                  line-height: 1.8; 
                  max-width: 800px; 
                  margin: 0 auto; 
                  padding: 40px;
                  color: #333;
                  background: white;
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 30px;
                  border-bottom: 2px solid #e5e7eb; 
                  padding-bottom: 20px;
                }
                .metadata { 
                  background: #f9fafb; 
                  padding: 15px; 
                  border-radius: 8px; 
                  margin-bottom: 30px;
                  font-size: 14px;
                  color: #6b7280;
                }
                .content { 
                  white-space: pre-wrap; 
                  text-align: justify;
                  font-size: 16px;
                  line-height: 1.8;
                  min-height: 400px;
                  border: 2px dashed #d1d5db;
                  padding: 20px;
                  border-radius: 8px;
                  background: #ffffff;
                }
                .content:focus {
                  outline: none;
                  border-color: #3b82f6;
                  background: #f0f9ff;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  color: #6b7280;
                  font-size: 12px;
                }
                .instructions {
                  background: #fef3c7;
                  border: 1px solid #f59e0b;
                  padding: 15px;
                  border-radius: 8px;
                  margin-bottom: 20px;
                }
                @media print {
                  body { padding: 20px; }
                  .instructions { display: none; }
                  .no-print { display: none; }
                  .content {
                    border: none;
                    background: white;
                  }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>📄 Editable Scanned Document</h1>
                <p style="color: #6b7280; font-size: 14px;">
                  Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                </p>
              </div>
              
              <div class="instructions">
                <strong>📝 Instructions:</strong> You can edit the text below directly. 
                When finished, print or save as PDF using your browser's print function (Ctrl+P or Cmd+P).
              </div>
              
              <div class="metadata">
                <strong>Document Information:</strong><br>
                • Character count: ${extractedText.length}<br>
                • Word count: ${extractedText.split(/\s+/).filter(word => word.length > 0).length}<br>
                • Estimated reading time: ${Math.ceil(extractedText.split(/\s+/).filter(word => word.length > 0).length / 200)} minutes<br>
                • Created with brAIny AI Scanner
              </div>
              
              <div 
                contenteditable="true" 
                class="content"
                id="editable-content"
                spellcheck="true"
                data-placeholder="Edit your text here..."
              >${extractedText}</div>
              
              <div class="footer no-print">
                <p style="margin-bottom: 10px;">
                  <strong>💡 Tips:</strong></p>
                <ul style="text-align: left; font-size: 12px;">
                  <li>Click anywhere in the text area to start editing</li>
                  <li>Use Ctrl+Z (Cmd+Z) to undo changes</li>
                  <li>Print to PDF when finished editing</li>
                  <li>Text automatically saves in this session</li>
                </ul>
              </div>
              
              <script>
                // Auto-save functionality
                let saveTimeout;
                const content = document.getElementById('editable-content');
                const originalText = content.innerText;
                
                content.addEventListener('input', function() {
                  clearTimeout(saveTimeout);
                  saveTimeout = setTimeout(() => {
                    localStorage.setItem('scanned-document-draft', content.innerText);
                    console.log('Draft saved automatically');
                  }, 1000);
                });
                
                // Load draft if exists
                const savedDraft = localStorage.getItem('scanned-document-draft');
                if (savedDraft && savedDraft !== originalText) {
                  if (confirm('A previously saved draft was found. Would you like to restore it?')) {
                    content.innerText = savedDraft;
                  }
                }
                
                // Clear draft on page unload
                window.addEventListener('beforeunload', function() {
                  setTimeout(() => {
                    localStorage.removeItem('scanned-document-draft');
                  }, 1000);
                });
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
        
        // Focus on the editable content
        setTimeout(() => {
          const editableContent = printWindow.document.getElementById('editable-content')
          if (editableContent) {
            editableContent.focus()
          }
        }, 500)
      }
    } catch (error) {
      console.error('PDF Generation Error:', error)
      alert('Failed to generate editable PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadAsText = () => {
    if (!extractedText) return

    const blob = new Blob([extractedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scanned-document-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      {!imageData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Scan Document
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex flex-col items-center gap-2 py-4"
            >
              <Upload className="w-6 h-6" />
              <span>Upload Image</span>
            </Button>
            
            <Button
              onClick={isCameraActive ? stopCamera : startCamera}
              variant="outline"
              className="flex flex-col items-center gap-2 py-4"
            >
              <Camera className="w-6 h-6" />
              <span>{isCameraActive ? 'Stop Camera' : 'Use Camera'}</span>
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </Card>
      )}

      {/* Camera View */}
      {isCameraActive && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Camera View
          </h3>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            <Button
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
              glow
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
          </div>
        </Card>
      )}

      {/* Processing */}
      {isProcessing && (
        <Card className="p-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Extracting Text...
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{progress}% complete</p>
          </div>
        </Card>
      )}

      {/* Image Preview */}
      {imageData && !isProcessing && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Scanned Image
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setImageData('')
                setExtractedText('')
              }}
            >
              Clear
            </Button>
          </div>
          <img
            src={imageData}
            alt="Scanned document"
            className="w-full rounded-lg border-2 border-gray-200"
          />
        </Card>
      )}

      {/* Extracted Text */}
      {extractedText && !isProcessing && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Extracted Text
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAsText}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateEditablePDF}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </div>
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            className="w-full h-48 p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
            placeholder="Extracted text will appear here..."
          />
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">AI Actions</h4>
            </div>
            <p className="text-sm text-blue-800 mb-3">
              What would you like to do with this text?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to explain mode with the text
                  window.location.href = `/modes/explain?text=${encodeURIComponent(extractedText.substring(0, 500))}`
                }}
              >
                Explain
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to quiz mode
                  window.location.href = `/modes/quiz?text=${encodeURIComponent(extractedText.substring(0, 500))}`
                }}
              >
                Create Quiz
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to flashcards mode
                  window.location.href = `/modes/flashcards?text=${encodeURIComponent(extractedText.substring(0, 500))}`
                }}
              >
                Make Flashcards
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to summarize mode
                  window.location.href = `/modes/review?text=${encodeURIComponent(extractedText.substring(0, 500))}`
                }}
              >
                Summarize
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
