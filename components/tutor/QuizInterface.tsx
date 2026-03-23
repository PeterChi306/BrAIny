'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react'

interface QuizInterfaceProps {
  content: string
  onComplete?: () => void
}

export function QuizInterface({ content, onComplete }: QuizInterfaceProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Parse the quiz content to extract question and options
  const parseQuizContent = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    
    // Try to find a question line (more flexible patterns)
    let questionLine = lines.find(line => 
      line.includes('?') || 
      line.toLowerCase().includes('question') ||
      line.toLowerCase().includes('what') ||
      line.toLowerCase().includes('which') ||
      line.toLowerCase().includes('how') ||
      line.toLowerCase().includes('why') ||
      line.toLowerCase().includes('choose') ||
      line.toLowerCase().includes('select')
    )
    
    // Look for "Question:" prefix specifically
    const questionWithPrefix = lines.find(line => 
      line.toLowerCase().startsWith('question:')
    )
    if (questionWithPrefix) {
      questionLine = questionWithPrefix.replace(/^question:\s*/i, '').trim()
    }
    
    // Try to extract options with multiple patterns
    let options: string[] = []
    
    // Pattern 1: Lettered options (a), b), c), d) - preferred format
    const letteredOptions = lines.filter(line => 
      line.match(/^[a-d]\)/i) || 
      line.match(/^[a-d]\./i)
    )
    if (letteredOptions.length >= 2) {
      options = letteredOptions
    } else {
      // Pattern 2: Numbered options
      const numberedOptions = lines.filter(line => 
        line.match(/^[0-9]+\)/) ||
        line.match(/^[0-9]+\./)
      )
      if (numberedOptions.length >= 2) {
        options = numberedOptions
      } else {
        // Pattern 3: Bullet points
        const bulletOptions = lines.filter(line => 
          line.match(/^•/) ||
          line.match(/^-/) ||
          line.match(/^\*/)
        )
        if (bulletOptions.length >= 2) {
          options = bulletOptions
        } else {
          // Pattern 4: Look for complete sentences that could be options
          const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10)
          const questionSentences = sentences.filter(s => 
            !s.includes('?') && 
            s.trim().length > 15 && 
            s.trim().length < 100
          )
          
          // Extract up to 4 sentences that look like options
          if (questionSentences.length >= 2) {
            options = questionSentences.slice(0, 4).map((s, i) => {
              const cleanText = s.trim()
              // Check if it already starts with a letter/number format
              if (cleanText.match(/^[a-d]\)/i) || cleanText.match(/^[0-9]+\)/)) {
                return cleanText
              }
              return `${String.fromCharCode(65 + i)}) ${cleanText}`
            })
          }
        }
      }
    }
    
    // If still no options found, create default ones based on the context
    if (options.length === 0) {
      options = [
        'a) True',
        'b) False', 
        'c) Maybe',
        'd) Not enough information'
      ]
    }
    
    // Clean up the question - remove any option text that might be included
    if (questionLine) {
      // Remove any option patterns from the question
      questionLine = questionLine.replace(/^[a-d]\)\s.*$/gm, '').trim()
      questionLine = questionLine.replace(/^[0-9]+\)\s.*$/gm, '').trim()
    }
    
    return {
      question: questionLine || lines.find(line => line.trim()) || 'Quiz Question',
      options: options.slice(0, 4) // Limit to 4 options
    }
  }

  const { question, options } = parseQuizContent(content)

  // Debug logging
  useEffect(() => {
    console.log('Quiz content parsed:', { question, options, rawContent: content })
  }, [content, question, options])

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
    setShowResult(true)
    
    // More intelligent answer determination using the "Correct answer:" format
    let correctAnswer = options[0] // default to first option
    
    // Look for "Correct answer:" or similar patterns in the original content
    const contentLower = content.toLowerCase()
    const correctPatterns = [
      'correct answer:',
      'answer:',
      'right answer:',
      'the answer is',
      'correct:'
    ]
    
    for (const pattern of correctPatterns) {
      const patternIndex = contentLower.indexOf(pattern)
      if (patternIndex !== -1) {
        const afterPattern = content.substring(patternIndex + pattern.length)
        
        // Look for a letter (a, b, c, d) after the pattern
        const letterMatch = afterPattern.match(/[a-d]/i)
        if (letterMatch) {
          const correctLetter = letterMatch[0].toLowerCase()
          const correctIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0)
          
          if (correctIndex >= 0 && correctIndex < options.length) {
            correctAnswer = options[correctIndex]
            break
          }
        }
        
        // Also check if any option text appears after the pattern
        for (const option of options) {
          const optionText = option.replace(/^[a-d]\)\s*/i, '').trim()
          if (afterPattern.toLowerCase().includes(optionText.toLowerCase())) {
            correctAnswer = option
            break
          }
        }
      }
    }
    
    setIsCorrect(answer === correctAnswer)
    
    // Debug logging
    console.log('Quiz answer check:', {
      selectedAnswer: answer,
      correctAnswer,
      isCorrect: answer === correctAnswer,
      content
    })
  }

  const handleReset = () => {
    setSelectedAnswer(null)
    setShowResult(false)
    setIsCorrect(false)
  }

  const handleNext = () => {
    onComplete?.()
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
          <span className="text-white text-lg font-bold">Q</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Quiz Time!</h3>
          <p className="text-gray-600 text-sm">Test your knowledge</p>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <p className="text-gray-900 font-medium leading-relaxed">{question}</p>
        </div>
      </div>
      
      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const showCorrect = showResult && option === options[0]
          const showIncorrect = showResult && isSelected && option !== options[0]
          const optionLetter = String.fromCharCode(65 + index) // A, B, C, D
          const optionText = option.replace(/^[a-d0-9•-]\)\s*/, '').trim()
          
          return (
            <button
              key={index}
              onClick={() => !showResult && handleAnswerSelect(option)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                showCorrect 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-lg shadow-emerald-500/25'
                  : showIncorrect
                  ? 'border-red-500 bg-red-50 text-red-900 shadow-lg shadow-red-500/25'
                  : isSelected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-lg shadow-emerald-500/25'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
              } ${!showResult && 'cursor-pointer hover:shadow-lg'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  showCorrect 
                    ? 'bg-emerald-500 text-white'
                    : showIncorrect
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {optionLetter}
                </div>
                <span className="flex-1 font-medium">{optionText}</span>
                {showCorrect && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Results */}
      {showResult && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className={`flex items-center gap-3 ${isCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isCorrect ? (
              <>
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold">Correct! Well done ◆</span>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6" />
                <span className="font-semibold">Try again ▶</span>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {isCorrect && (
              <button
                onClick={handleNext}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
