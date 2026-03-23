import Tesseract from 'tesseract.js'

export interface ScanResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
}

export class DocumentScanner {
  private static instance: DocumentScanner
  
  static getInstance(): DocumentScanner {
    if (!DocumentScanner.instance) {
      DocumentScanner.instance = new DocumentScanner()
    }
    return DocumentScanner.instance
  }

  async scanDocument(file: File): Promise<ScanResult> {
    try {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file for scanning')
      }

      // Create image element for processing
      const imageUrl = URL.createObjectURL(file)
      
      try {
        // Use Tesseract.js for OCR
        const result = await Tesseract.recognize(
          imageUrl,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                console.log(`Scanning progress: ${Math.round(m.progress * 100)}%`)
              }
            }
          }
        )

        const scanResult: ScanResult = {
          text: result.data.text,
          confidence: result.data.confidence,
          words: result.data.words.map(word => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          }))
        }

        URL.revokeObjectURL(imageUrl)
        return scanResult

      } catch (ocrError) {
        URL.revokeObjectURL(imageUrl)
        throw new Error(`OCR failed: ${ocrError}`)
      }

    } catch (error) {
      console.error('Document scanning error:', error)
      throw new Error(`Failed to scan document: ${error}`)
    }
  }

  async extractMathProblems(text: string): Promise<string[]> {
    // Extract math problems from scanned text
    const mathPatterns = [
      /(?:solve|find|calculate|determine).*?[=+\-×÷].*?(?:\n|$)/gi,
      /\d+[=+\-×÷].*?(?:\n|$)/g,
      /(?:x|y|z).*?[=+\-×÷].*?(?:\n|$)/gi,
      /equation.*?(?:\n|$)/gi
    ]

    const problems: string[] = []
    
    for (const pattern of mathPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        problems.push(...matches.filter(m => m.trim().length > 5))
      }
    }

    return Array.from(new Set(problems)) // Remove duplicates
  }

  async extractQuestions(text: string): Promise<string[]> {
    // Extract questions from scanned text
    const questionPatterns = [
      /(?:what|how|why|when|where|who|which|explain|describe).*?[?\.]/gi,
      /\d+\..*?[?\.]/g,
      /[a-zA-Z]\).*?[?\.]/g
    ]

    const questions: string[] = []
    
    for (const pattern of questionPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        questions.push(...matches.filter(m => m.trim().length > 10))
      }
    }

    return Array.from(new Set(questions)) // Remove duplicates
  }

  async formatScanResult(result: ScanResult): Promise<string> {
    const { text } = result
    
    // Polish the extracted text: clean up noise and normalize whitespace
    let polishedText = text.trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      // Filter out common OCR noise (lonely symbols)
      .filter(line => line.length > 1 || /[a-zA-Z0-9$€£%!?]/.test(line))
      .join('\n')

    let formatted = polishedText + '\n\n'

    // Try to extract math problems for separate highlighting
    const problems = await this.extractMathProblems(text)
    if (problems.length > 0) {
      formatted += `---
🔢 **Math Problems Identified:**
${problems.map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}
`
    }

    // Try to extract questions
    const questions = await this.extractQuestions(text)
    if (questions.length > 0) {
      formatted += `---
❓ **Questions Identified:**
${questions.map((q, i) => `${i + 1}. ${q.trim()}`).join('\n')}
`
    }

    return formatted.trim()
  }
}

export const documentScanner = DocumentScanner.getInstance()
