'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  Camera, 
  Upload, 
  Download, 
  RotateCw, 
  Crop, 
  Sun, 
  Palette,
  FileText,
  Loader2,
  Check,
  X,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TierBadge, PrestigeBorder } from '@/components/ui/PremiumUI'

interface ScanResult {
  originalImage: string
  enhancedImage: string
  extractedText: string
  isEditable: boolean
}

interface DocumentScannerProps {
  onScanComplete: (result: ScanResult) => void
  className?: string
}

export function DocumentScanner({ onScanComplete, className }: DocumentScannerProps) {
  const [image, setImage] = useState<string | null>(null)
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [isEnhanced, setIsEnhanced] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return cleanupCamera
  }, [cleanupCamera])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setEnhancedImage(null)
        setExtractedText('')
        setIsEnhanced(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      setIsCapturing(true)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Camera error:', error)
      alert('Camera couldn’t open. Please allow camera access in your browser settings, or upload a photo instead.')
      setIsCapturing(false)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setImage(imageData)
        setEnhancedImage(null)
        setExtractedText('')
        setIsEnhanced(false)
        setIsCapturing(false)
        cleanupCamera()
      }
    }
  }

  const cancelCamera = () => {
    setIsCapturing(false)
    cleanupCamera()
  }

  const enhanceDocument = useCallback(async () => {
    if (!image) return

    setIsProcessing(true)
    
    try {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          canvas.width = img.width
          canvas.height = img.height
          
          // Apply document enhancement
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
          ctx.drawImage(img, 0, 0)
          
          // Apply document scanning effects
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          // Enhance for document scanning
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
            
            // Increase contrast for document
            const enhanced = gray > 128 ? 255 : Math.max(0, gray - 30)
            
            data[i] = enhanced     // Red
            data[i + 1] = enhanced // Green
            data[i + 2] = enhanced // Blue
          }
          
          ctx.putImageData(imageData, 0, 0)
          setEnhancedImage(canvas.toDataURL('image/jpeg', 0.9))
          setIsEnhanced(true)
        }
      }
      img.src = image
    } catch (error) {
      console.error('Enhancement error:', error)
      alert('Failed to enhance image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [image, brightness, contrast])

  const extractText = useCallback(async () => {
    const imageToProcess = enhancedImage || image
    if (!imageToProcess) return

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageToProcess }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to extract text')
      }

      const { text } = await response.json()
      setExtractedText(text)
    } catch (error: any) {
      console.error('Text extraction error:', error)
      alert('We couldn’t read the text from this image. Try a clearer photo, better lighting, or upload a different image.')
    } finally {
      setIsProcessing(false)
    }
  }, [image, enhancedImage])

  const downloadPDF = useCallback(async () => {
    const imageToUse = enhancedImage || image
    const textToUse = extractedText
    
    if (!imageToUse) return

    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF()
      
      // Add image to PDF
      const img = new Image()
      img.onload = () => {
        const imgWidth = 180
        const imgHeight = (img.height / img.width) * imgWidth
        
        pdf.addImage(img, 'JPEG', 15, 15, imgWidth, imgHeight)
        
        // Add text if available
        if (textToUse) {
          const textY = imgHeight + 30
          const splitText = pdf.splitTextToSize(textToUse, 180)
          pdf.text(splitText, 15, textY)
        }
        
        pdf.save(`scan-${Date.now()}.pdf`)
      }
      img.src = imageToUse
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }, [image, enhancedImage, extractedText])

  const downloadEditableText = () => {
    if (!extractedText) return
    
    const blob = new Blob([extractedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scan-text-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const completeScan = () => {
    if (!image) return
    
    const result: ScanResult = {
      originalImage: image,
      enhancedImage: enhancedImage || image,
      extractedText,
      isEditable: !!extractedText
    }
    
    onScanComplete(result)
  }

  const reset = () => {
    setImage(null)
    setEnhancedImage(null)
    setExtractedText('')
    setIsEnhanced(false)
    setBrightness(100)
    setContrast(100)
  }

  if (isCapturing) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Scan Document</h3>
            <p className="text-gray-600">Position your document in the frame and capture</p>
          </div>
          
          <div className="relative mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Document guide overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={captureImage}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
            <Button
              onClick={cancelCamera}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload/Capture Section */}
      {!image && (
        <PrestigeBorder className="p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Camera className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Scan Document</h3>
              <p className="text-gray-600">Capture or upload a document to extract text</p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Camera className="w-4 h-4 mr-2" />
                Use Camera
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </PrestigeBorder>
      )}

      {/* Image Processing Section */}
      {image && (
        <PrestigeBorder className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Document Processing</h3>
              <Button onClick={reset} variant="outline" size="sm" className="border-red-200 hover:border-red-300 hover:bg-red-50">
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Image Display */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Original</h4>
                <img
                  src={image}
                  alt="Original document"
                  className="w-full rounded-lg border"
                />
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {isEnhanced ? 'Enhanced' : 'Enhanced (Preview)'}
                </h4>
                <img
                  src={enhancedImage || image}
                  alt="Enhanced document"
                  className="w-full rounded-lg border"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`
                  }}
                />
              </div>
            </div>

            {/* Enhancement Controls */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Sun className="w-4 h-4 inline mr-1" />
                  Brightness: {brightness}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Contrast: {contrast}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={enhanceDocument}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Enhance
              </Button>
              
              <Button
                onClick={extractText}
                disabled={isProcessing || !enhancedImage}
                variant="outline"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Extract Text
              </Button>
              
              <Button
                onClick={downloadPDF}
                disabled={!enhancedImage}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              
              <Button
                onClick={downloadEditableText}
                disabled={!extractedText}
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Text
              </Button>
            </div>

            {/* Extracted Text Preview */}
            {extractedText && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Extracted Text Preview:</h4>
                <div className="p-4 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-700">{extractedText}</p>
                </div>
              </div>
            )}

            {/* Complete Button */}
            {enhancedImage && extractedText && (
              <Button
                onClick={completeScan}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Check className="w-4 h-4 mr-2" />
                Complete Scan
              </Button>
            )}
          </div>
        </PrestigeBorder>
      )}
    </div>
  )
}
