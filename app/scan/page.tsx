'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNavigation } from '@/components/BottomNavigation'
import { PremiumBackground, TierBadge } from '@/components/ui/PremiumUI'
import { Modal } from '@/components/ui/Modal'
import { documentScanner } from '@/lib/documentScanner'
import { jsPDF } from 'jspdf'
import { useUserTier } from '@/contexts/UserTierContext'
import { canUseFeature } from '@/lib/subscription'
import { LoadingScreen } from '@/components/LoadingScreen'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import {
  Camera,
  Upload,
  Send,
  Image as ImageIcon,
  FileText,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Search,
  BookOpen,
  Brain,
  Loader2,
  Download,
  Wand2,
  X,
  Circle,
  MessageCircle,
  RefreshCw,
  Copy,
  Check,
  Lock
} from 'lucide-react'

export default function ScanPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [customTutorQuestion, setCustomTutorQuestion] = useState('')
  const [isSendingToTutor, setIsSendingToTutor] = useState(false)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [isShowingTextModal, setIsShowingTextModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const { userTier } = useUserTier() as { userTier: any }
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeTarget, setUpgradeTarget] = useState<'scholar' | 'master' | 'legend'>('scholar')
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('')

  const openUpgradeFor = (feature: string, tier: 'scholar' | 'master' | 'legend') => {
    setUpgradeFeatureName(feature)
    setUpgradeTarget(tier)
    setShowUpgradeModal(true)
  }

  const startCamera = async () => {
    try {
      setIsCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Camera access denied:", err)
      setIsCameraActive(false)
      alert("Could not access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setUploadedImage(dataUrl)
        stopCamera()
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        setProcessedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClearDigitalScan = async () => {
    if (!uploadedImage) return
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create a canvas to process the image
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height

        // Apply black and white filter with enhanced contrast
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)'
        ctx.drawImage(img, 0, 0)

        // Convert to data URL for display and download
        const enhancedImage = canvas.toDataURL('image/png')
        setProcessedImage(enhancedImage)
      }
      img.src = uploadedImage

    } catch (error) {
      console.error('Enhancement failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const sendToTutorWithQuestion = (question: string) => {
    if (!uploadedImage || !question.trim() || isSendingToTutor) return

    setIsSendingToTutor(true)
    try {
      // Store scanned image + question for Tutor via localStorage (avoids queuedFiles quota issues)
      if (typeof window !== 'undefined') {
        const imageData = processedImage || uploadedImage
        window.localStorage.setItem('scannedImage', imageData)
        window.localStorage.setItem('scanQuestion', question.trim())
      }

      const tutorUrl = `/tutor?new=true`
      router.push(tutorUrl)
    } catch (error) {
      console.error('Error sending to tutor:', error)
      alert('Failed to send document to tutor. Please try again.')
    } finally {
      setIsSendingToTutor(false)
    }
  }

  const handleSendToTutor = (questionType: string) => {
    if (!uploadedImage) return
    const presetQuestion = `I need help with this document. ${questionType}`
    sendToTutorWithQuestion(presetQuestion)
  }

  const handleDownloadEnhanced = () => {
    if (!processedImage) return

    const link = document.createElement('a')
    link.href = processedImage
    link.download = `enhanced-document-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExtractText = async () => {
    if (!uploadedImage || isProcessing) return

    setIsProcessing(true)
    try {
      // Convert dataURL back to File for scanner if needed, 
      // but scanDocument also accepts string/blob sometimes. 
      // Actually scanDocument in documentScanner.ts takes File.
      const response = await fetch(uploadedImage)
      const blob = await response.blob()
      const file = new File([blob], "scanned-image.jpg", { type: "image/jpeg" })

      const result = await documentScanner.scanDocument(file)
      const formatted = await documentScanner.formatScanResult(result)
      setExtractedText(formatted)
      setIsShowingTextModal(true)
    } catch (error) {
      console.error('OCR Extraction failed:', error)
      alert("Neural scan failed. Please ensure the image is clear.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConvertToPDF = () => {
    if (!uploadedImage) return

    try {
      const pdf = new jsPDF()
      const imgData = processedImage || uploadedImage

      // Calculate aspect ratio to fit PDF
      const img = new Image()
      img.onload = () => {
        const imgWidth = 210 // A4 width in mm
        const imgHeight = (img.height * imgWidth) / img.width

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
        pdf.save(`brainy-document-${Date.now()}.pdf`)
      }
      img.src = imgData
    } catch (error) {
      console.error('PDF conversion failed:', error)
      alert("Failed to generate PDF.")
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setProcessedImage(null)
    setIsCopied(false)
  }

  const handleCopyToClipboard = async () => {
    if (!extractedText) return
    try {
      await navigator.clipboard.writeText(extractedText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <PremiumBackground>
      <div className="relative min-h-screen pb-32">
        {/* Unified Loading Overlay */}
        {isProcessing && <LoadingScreen message="Analyzing document..." />}
        {isSendingToTutor && <LoadingScreen message="Sending to tutor..." />}

        {/* Camera Overlay */}
        {isCameraActive && (
          <div className="fixed inset-0 z-[150] bg-background flex flex-col">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="flex-1 object-cover"
            />
            <div className="absolute bottom-10 left-0 right-0 flex items-center justify-between px-10 pb-env-safe">
              <button
                onClick={stopCamera}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 bg-transparent group"
              >
                <div className="w-full h-full bg-white rounded-full group-active:scale-90 transition-transform" />
              </button>

              <div className="w-14 h-14" /> {/* Spacer */}
            </div>
            {/* Added bottom safe area padding for capture controls */}
            <div className="h-20" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-white/5 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold tracking-tight">Smart Scanner</span>
                <TierBadge size="sm" showText={false} className="h-5" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-white/40">
                AI Sight Enabled
              </span>
            </div>
            {uploadedImage && (
              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10">
          {!uploadedImage ? (
            <div className="space-y-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[2.5rem] mb-8 border border-black/5 dark:border-white/10 shadow-2xl">
                  <Camera className="w-12 h-12 text-slate-900 dark:text-white" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
                  Your AI Tutor Assistant
                </h2>
                <p className="text-lg text-slate-600 dark:text-white/40 max-w-lg mx-auto leading-relaxed">
                  Brainy is your personalized 24/7 AI tutor. Analyze documents instantly, bridge knowledge gaps, and master complex subjects with real-time neural feedback.
                </p>

                {/* Tutor Features - Clean Symbols */}
                <div className="mt-8 flex flex-wrap justify-center gap-6 sm:gap-10">
                  <div className="flex items-center gap-2 text-blue-400/80 font-bold text-sm tracking-wide">
                    <span>📚</span> Homework Help
                  </div>
                  <div className="flex items-center gap-2 text-purple-400/80 font-bold text-sm tracking-wide">
                    <span>🧠</span> Concept Mastery
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400/80 font-bold text-sm tracking-wide">
                    <span>📝</span> Practice Sets
                  </div>
                  <div className="flex items-center gap-2 text-orange-400/80 font-bold text-sm tracking-wide">
                    <span>🎯</span> Study Mapping
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                  onClick={startCamera}
                  className="group relative h-64 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-black/5 dark:border-white/10 hover:border-blue-500/30 transition-all duration-500 overflow-hidden flex flex-col items-center justify-center gap-4 text-slate-900 dark:text-white shadow-2xl"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-slate-900 dark:text-white">Scan for Help</span>
                    <span className="text-sm text-slate-500 dark:text-white/40">Get tutor assistance instantly</span>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-64 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-black/5 dark:border-white/10 hover:border-blue-500/30 transition-all duration-500 overflow-hidden flex flex-col items-center justify-center gap-4 text-slate-900 dark:text-white shadow-2xl"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/10 border border-black/10 dark:border-white/20 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-slate-600 dark:text-white" />
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-slate-900 dark:text-white">Upload Document</span>
                    <span className="text-sm text-slate-500 dark:text-white/40">Share with your AI tutor</span>
                  </div>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-4 shadow-2xl">
                <div className="relative aspect-auto max-h-[60vh] rounded-3xl overflow-hidden border border-white/10 bg-surface/40">
                  <img
                    src={processedImage || uploadedImage}
                    alt="Scanned content"
                    className="w-full h-full object-contain"
                  />
                  {processedImage && (
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={handleDownloadEnhanced}
                        className="p-3 bg-black/80 text-white rounded-xl hover:bg-black/90 transition-all flex items-center gap-2 shadow-lg"
                      >
                        <Download className="w-5 h-5" />
                        <span className="text-sm font-medium">Download</span>
                      </button>
                    </div>
                  )}
                  {processedImage && (
                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1 bg-green-500/90 text-white rounded-full text-xs font-bold">
                        ENHANCED
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  onClick={handleClearDigitalScan}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white/10 transition-all text-slate-900 dark:text-white group shadow-xl"
                >
                  <Wand2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs">Enhance</span>
                </button>

                {canUseFeature(userTier, 'text_extraction') ? (
                  <button
                    onClick={handleExtractText}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-blue-300 group shadow-xl"
                  >
                    <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-xs">Extract Text</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openUpgradeFor('Text Extraction from Images', 'scholar')}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-blue-500/5 border border-blue-500/20 border-dashed transition-all text-blue-300/50 group shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
                    <div className="relative">
                      <FileText className="w-5 h-5" />
                      <Lock className="w-3 h-3 absolute -top-1 -right-1 text-blue-400" />
                    </div>
                    <span className="font-bold text-xs">Extract Text</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-400/70">Scholar+</span>
                  </button>
                )}

                {canUseFeature(userTier, 'editable_pdf') ? (
                  <button
                    onClick={handleConvertToPDF}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-purple-300 group shadow-xl"
                  >
                    <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-xs">Save as PDF</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openUpgradeFor('Smart PDF Export', 'master')}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-purple-500/5 border border-purple-500/20 border-dashed transition-all text-purple-300/50 group shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                    <div className="relative">
                      <ImageIcon className="w-5 h-5" />
                      <Lock className="w-3 h-3 absolute -top-1 -right-1 text-purple-400" />
                    </div>
                    <span className="font-bold text-xs">Save as PDF</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-400/70">Master+</span>
                  </button>
                )}

                <button
                  onClick={handleSendToTutor.bind(null, "Explain this")}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-indigo-300 group shadow-xl"
                >
                  <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs">Teach Me</span>
                </button>
              </div>

              {/* Premium Ask Tutor Section */}
              <div className="bg-[#18181b]/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 space-y-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

                <p className="text-sm text-slate-500 dark:text-white/50 font-medium leading-relaxed px-1">
                  Or, type exactly what you want your tutor to do with this document and start a fresh conversation:
                </p>

                <div className="space-y-4">
                  <div className="relative group/input">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover/input:opacity-40 transition duration-1000"></div>
                    <input
                      type="text"
                      value={customTutorQuestion}
                      onChange={(e) => setCustomTutorQuestion(e.target.value)}
                      placeholder="Ask your tutor anything about this doc..."
                      className="relative w-full px-6 py-5 rounded-2xl bg-white dark:bg-[#09090b] border border-black/5 dark:border-white/10 text-slate-900 dark:text-white text-lg placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (customTutorQuestion.trim()) {
                        sendToTutorWithQuestion(customTutorQuestion)
                      }
                    }}
                    disabled={!customTutorQuestion.trim() || isSendingToTutor}
                    className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.5)] active:scale-[0.98]"
                  >
                    <MessageCircle className="w-6 h-6 fill-white/20" />
                    Ask Tutor
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isShowingTextModal}
        onClose={() => setIsShowingTextModal(false)}
        title="Extracted Neural Data"
        size="lg"
      >
        <div className="p-6 space-y-4">
          <div className="relative group">
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-white/5 font-mono text-sm whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-300">
              {extractedText}
            </div>
            <button
              onClick={handleCopyToClipboard}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-lg transition-all flex items-center gap-2 group/copy"
              title="Copy to clipboard"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-400 animate-in zoom-in" />
              ) : (
                <Copy className="w-4 h-4 text-white/70 group-hover/copy:text-white transition-colors" />
              )}
              <span className="text-[10px] font-bold text-white/50 group-hover/copy:text-white transition-colors">
                {isCopied ? 'COPIED' : 'COPY'}
              </span>
            </button>
          </div>
          <button
            onClick={() => {
              if (extractedText) {
                sendToTutorWithQuestion(`Please help me with this extracted text:\n\n${extractedText}`)
              }
            }}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <Brain className="w-5 h-5" />
            Discuss with Tutor
          </button>
        </div>
      </Modal>

      <BottomNavigation />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeatureName}
        requiredTier={upgradeTarget}
      />
    </PremiumBackground>
  )
}
