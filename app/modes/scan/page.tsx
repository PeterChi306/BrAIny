'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { OCRProcessor } from '@/components/ui/OCRProcessor'
import { ArrowLeft, Sparkles, FileText, Brain, BookOpen, HelpCircle, Download, Save, History, Plus, MessageCircle } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Scan } from '@/types/database'

export default function ScanModePage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [extractedText, setExtractedText] = useState('')
  const [imageData, setImageData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [scans, setScans] = useState<Scan[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentScanId, setCurrentScanId] = useState<string | null>(null)
  const [aiActions, setAiActions] = useState<string[]>([])

  // Load user's scan history
  useEffect(() => {
    loadScanHistory()
  }, [])

  const loadScanHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: scans } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (scans) {
      setScans(scans)
    }
  }

  const saveScanSession = async () => {
    if (!extractedText) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Generate a title from the first few words of extracted text
    const title = extractedText.split(' ').slice(0, 5).join(' ') + (extractedText.split(' ').length > 5 ? '...' : '')

    const { data: scan } = await supabase
      .from('scans')
      .upsert({
        user_id: user.id,
        title: title,
        image_url: imageData,
        extracted_text: extractedText,
        subject: null,
        ai_actions: aiActions,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (scan) {
      setCurrentScanId(scan.id)
      await loadScanHistory()
    }
  }

  const loadScanSession = async (scanId: string) => {
    const { data: scan } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single()

    if (scan) {
      setExtractedText(scan.extracted_text || '')
      setImageData(scan.image_url || '')
      setCurrentScanId(scan.id)
      setAiActions(scan.ai_actions || [])
    }
  }

  const handleTextExtracted = (text: string, imageSource: string) => {
    setExtractedText(text)
    setImageData(imageSource)
  }

  const handleAIAction = async (action: string) => {
    if (!extractedText) return

    // Track the AI action
    const newAiActions = [...aiActions, action]
    setAiActions(newAiActions)

    // Auto-save the scan session
    if (!currentScanId) {
      await saveScanSession()
    } else {
      // Update existing scan with new action
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('scans')
          .update({
            ai_actions: newAiActions,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentScanId)
      }
    }

    const encodedText = encodeURIComponent(extractedText.substring(0, 500))
    switch (action) {
      case 'explain':
        router.push(`/modes/explain?text=${encodedText}`)
        break
      case 'quiz':
        router.push(`/modes/quiz?text=${encodedText}`)
        break
      case 'flashcards':
        router.push(`/modes/flashcards?text=${encodedText}`)
        break
      case 'review':
        router.push(`/modes/review?text=${encodedText}`)
        break
    }
  }

  const sendToChat = () => {
    if (!extractedText) return

    // Store scan data in sessionStorage for tutor page to pick up
    const scanData = {
      extracted_text: extractedText,
      image_url: imageData,
      title: extractedText.split(' ').slice(0, 5).join(' ') + (extractedText.split(' ').length > 5 ? '...' : ''),
      created_at: new Date().toISOString()
    }

    sessionStorage.setItem('scanResult', JSON.stringify(scanData))
    router.push('/tutor')
  }

  const downloadAsPDF = () => {
    if (!extractedText) return

    // Create a professional editable PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Professional Scanned Document</title>
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
              h1 { 
                color: #2563eb; 
                border-bottom: 2px solid #e5e7eb; 
                padding-bottom: 10px;
                margin-bottom: 30px;
                text-align: center;
              }
              .metadata { 
                background: #f9fafb; 
                padding: 20px; 
                border-radius: 8px; 
                margin-bottom: 30px;
                font-size: 14px;
                color: #6b7280;
                border-left: 4px solid #2563eb;
              }
              .content { 
                white-space: pre-wrap; 
                text-align: justify;
                font-size: 16px;
                line-height: 1.8;
                min-height: 400px;
                border: 2px dashed #d1d5db;
                padding: 30px;
                border-radius: 8px;
                background: #ffffff;
                transition: all 0.3s ease;
              }
              .content:focus {
                outline: none;
                border-color: #2563eb;
                background: #f0f9ff;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
              }
              .toolbar {
                background: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
              }
              .toolbar button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                background: #2563eb;
                color: white;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
              }
              .toolbar button:hover {
                background: #1d4ed8;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
              }
              @media print {
                body { padding: 20px; }
                .toolbar { display: none; }
                .content {
                  border: none;
                  background: white;
                  box-shadow: none;
                }
              }
            </style>
          </head>
          <body>
            <h1>📄 Professional Scanned Document</h1>
            
            <div class="metadata">
              <strong>Document Details:</strong><br>
              • Scanned on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
              • Character count: ${extractedText.length}<br>
              • Word count: ${extractedText.split(/\s+/).filter(word => word.length > 0).length}<br>
              • Estimated reading time: ${Math.ceil(extractedText.split(/\s+/).filter(word => word.length > 0).length / 200)} minutes<br>
              • Document ID: DOC-${Date.now()}<br>
              • Created with brAIny AI Scanner
            </div>
            
            <div class="toolbar">
              <button onclick="document.execCommand('bold')">Bold</button>
              <button onclick="document.execCommand('italic')">Italic</button>
              <button onclick="document.execCommand('underline')">Underline</button>
              <button onclick="document.execCommand('justifyLeft')">Align Left</button>
              <button onclick="document.execCommand('justifyCenter')">Center</button>
              <button onclick="document.execCommand('justifyRight')">Align Right</button>
              <button onclick="document.execCommand('undo')">Undo</button>
              <button onclick="document.execCommand('redo')">Redo</button>
            </div>
            
            <div 
              contenteditable="true" 
              class="content"
              id="editable-content"
              spellcheck="true"
              data-placeholder="Click here to edit your document..."
            >${extractedText}</div>
            
            <div class="footer">
              <p><strong>brAIny AI Scanner</strong> - Professional Document Processing</p>
              <p>This document was automatically generated from scanned content using advanced OCR technology.</p>
            </div>
            
            <script>
              // Enhanced editing features
              const content = document.getElementById('editable-content');
              const originalText = content.innerText;
              
              // Auto-save functionality
              let saveTimeout;
              content.addEventListener('input', function() {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                  localStorage.setItem('brAIny-document-' + Date.now(), content.innerText);
                  console.log('Document auto-saved');
                }, 2000);
              });
              
              // Word count
              function updateWordCount() {
                const words = content.innerText.split(/\\s+/).filter(word => word.length > 0).length;
                // Update word count display if needed
              }
              
              content.addEventListener('input', updateWordCount);
              
              // Keyboard shortcuts
              content.addEventListener('keydown', function(e) {
                if (e.ctrlKey || e.metaKey) {
                  switch(e.key) {
                    case 's':
                      e.preventDefault();
                      localStorage.setItem('brAIny-document-manual', content.innerText);
                      alert('Document saved!');
                      break;
                    case 'p':
                      e.preventDefault();
                      window.print();
                      break;
                  }
                }
              });
              
              // Focus on content
              content.focus();
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-orange-100/20 dark:from-black dark:via-gray-950 dark:to-orange-950/20 pb-28">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-primary dark:text-inverse">Document Scanner</h1>
              <p className="text-sm text-secondary dark:text-inverse-secondary">Extract text from images and PDFs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            {extractedText && (
              <button
                onClick={saveScanSession}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Save className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scan History Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-background/50" onClick={() => setShowSidebar(false)} />
          <div className="relative w-80 bg-white dark:bg-gray-900 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scan History</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {scans.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No scan history yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Start scanning documents to see them here</p>
                </div>
              ) : (
                scans.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => {
                      loadScanSession(scan.id)
                      setShowSidebar(false)
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${currentScanId === scan.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {scan.title || 'Untitled Scan'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(scan.updated_at).toLocaleDateString()}
                        </div>
                        {scan.ai_actions && scan.ai_actions.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {scan.ai_actions.map((action, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded"
                              >
                                {action}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setExtractedText('')
                  setImageData('')
                  setCurrentScanId(null)
                  setAiActions([])
                  setShowSidebar(false)
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Scan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* OCR Processor */}
          <OCRProcessor
            onTextExtracted={handleTextExtracted}
          />

          {/* Results Section */}
          {extractedText && (
            <div className="space-y-6">
              {/* Header Card */}
              <Card className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0" glow>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Extraction Complete!</h2>
                      <p className="text-blue-100">Your text has been successfully extracted</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAsPDF}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </Card>

              {/* Text Preview Card */}
              <Card className="p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Extracted Text</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {extractedText.length} characters • {extractedText.split(/\s+/).filter(word => word.length > 0).length} words
                    </p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 max-h-64 overflow-y-auto border-2 border-gray-200 dark:border-gray-700">
                  <pre className="text-sm text-black whitespace-pre-wrap font-mono leading-relaxed">
                    {extractedText.substring(0, 500)}
                    {extractedText.length > 500 && '...'}
                  </pre>
                </div>
              </Card>

              {/* AI Actions Card */}
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100">What would you like to do?</h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Choose an AI action to enhance your learning</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleAIAction('explain')}
                    className="flex items-center justify-start gap-4 p-4 h-24 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-blue-600">Get Explanation</div>
                      <div className="text-sm text-blue-500">Understand difficult concepts</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleAIAction('quiz')}
                    className="flex items-center justify-start gap-4 p-4 h-24 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-blue-600">Create Quiz</div>
                      <div className="text-sm text-blue-500">Test your knowledge</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleAIAction('flashcards')}
                    className="flex items-center justify-start gap-4 p-4 h-24 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-blue-600">Create Flashcards</div>
                      <div className="text-sm text-blue-500">Study with flashcards</div>
                    </div>
                  </Button>

                  <Button
                    onClick={sendToChat}
                    className="flex items-center justify-start gap-4 p-4 h-24 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-blue-600">Send to Chat</div>
                      <div className="text-sm text-blue-500">Discuss with AI tutor</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleAIAction('review')}
                    className="flex items-center justify-start gap-4 p-4 h-24 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-blue-600">Summarize</div>
                      <div className="text-sm text-blue-500">Get key points</div>
                    </div>
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Features */}
          {!extractedText && (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Advanced Scanning Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📷</div>
                  <div>
                    <h4 className="font-semibold text-blue-900">High-Quality OCR</h4>
                    <p className="text-sm text-blue-700">
                      Advanced text recognition from images and documents
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🤖</div>
                  <div>
                    <h4 className="font-semibold text-blue-900">AI-Powered Processing</h4>
                    <p className="text-sm text-blue-700">
                      Smart text extraction and formatting
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📄</div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Editable PDF Export</h4>
                    <p className="text-sm text-blue-700">
                      Convert scans to editable documents
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔗</div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Seamless Integration</h4>
                    <p className="text-sm text-blue-700">
                      Direct integration with study modes
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
