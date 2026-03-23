export class SpeechTutor {
  private synth: SpeechSynthesis
  private voices: SpeechSynthesisVoice[]
  private settings: SpeechSettings
  private isSpeaking: boolean = false
  private dailyUsageMinutes: number = 0
  private lastUsageDate: string = ''

  constructor(settings: SpeechSettings) {
    this.synth = window.speechSynthesis
    this.voices = this.synth.getVoices()
    this.settings = settings
    
    // Load voices when they're ready
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices()
      }
    }

    // Load daily usage from localStorage
    this.loadDailyUsage()
  }

  private loadDailyUsage() {
    const today = new Date().toDateString()
    const stored = localStorage.getItem('speech_daily_usage')
    
    if (stored) {
      const usage = JSON.parse(stored)
      if (usage.date === today) {
        this.dailyUsageMinutes = usage.minutes
        this.lastUsageDate = usage.date
      } else {
        // Reset for new day
        this.dailyUsageMinutes = 0
        this.lastUsageDate = today
        this.saveDailyUsage()
      }
    }
  }

  private saveDailyUsage() {
    localStorage.setItem('speech_daily_usage', JSON.stringify({
      date: this.lastUsageDate,
      minutes: this.dailyUsageMinutes
    }))
  }

  private updateUsage(seconds: number) {
    const minutes = Math.ceil(seconds / 60)
    this.dailyUsageMinutes += minutes
    this.saveDailyUsage()
  }

  private getVoiceForType(): SpeechSynthesisVoice | null {
    const preferredVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en') && voice.localService
    )

    if (preferredVoices.length === 0) {
      return this.voices[0] || null
    }

    // Try to find voice matching the preferred type
    switch (this.settings.voice_type) {
      case 'female':
        return preferredVoices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman')
        ) || preferredVoices[0]
      
      case 'male':
        return preferredVoices.find(voice => 
          voice.name.toLowerCase().includes('male') || 
          voice.name.toLowerCase().includes('man')
        ) || preferredVoices[0]
      
      default:
        return preferredVoices[0]
    }
  }

  private estimateSpeakingTime(text: string): number {
    // Average speaking rate is ~150 words per minute
    const wordsPerMinute = 150 * this.settings.speech_rate
    const words = text.split(/\s+/).length
    return (words / wordsPerMinute) * 60 // Return in seconds
  }

  public canSpeak(): boolean {
    if (!this.settings.enabled) return false
    if (this.dailyUsageMinutes >= this.settings.daily_limit_minutes) return false
    if (!('speechSynthesis' in window)) return false
    return true
  }

  /** Prepare text for natural listening: strip markdown, action blocks, extra newlines */
  private prepareForNaturalSpeech(text: string): string {
    return text
      .replace(/\[ActionButtons\][\s\S]*/i, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .trim()
  }

  /** Natural, conversational TTS: sentence-by-sentence with pauses and slightly slower rate */
  public async speakNatural(text: string, options: {
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: any) => void
  } = {}): Promise<void> {
    if (!this.canSpeak()) {
      options.onError?.(new Error('Speech not available or limit reached'))
      return
    }
    this.stop()
    const cleanText = this.prepareForNaturalSpeech(text)
    if (!cleanText) {
      options.onEnd?.()
      return
    }
    const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
    if (sentences.length === 0) {
      options.onEnd?.()
      return
    }
    const naturalRate = Math.min(1, (this.settings.speech_rate || 1) * 0.92)
    const voice = this.getVoiceForType()
    let totalEstimated = 0
    this.isSpeaking = true
    options.onStart?.()
    try {
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim()
        if (!sentence) continue
        await new Promise<void>((resolve, reject) => {
          const u = new SpeechSynthesisUtterance(sentence)
          if (voice) u.voice = voice
          u.rate = naturalRate
          u.volume = this.settings.volume
          u.pitch = 1.0
          const sec = this.estimateSpeakingTime(sentence)
          totalEstimated += sec
          u.onend = () => resolve()
          u.onerror = (e) => reject(e)
          this.synth.speak(u)
        })
        if (i < sentences.length - 1) {
          await new Promise(r => setTimeout(r, 280))
        }
      }
      this.updateUsage(totalEstimated)
    } catch (e) {
      options.onError?.(e as Error)
    } finally {
      this.isSpeaking = false
      options.onEnd?.()
    }
  }

  public speak(text: string, options: {
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: any) => void
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.canSpeak()) {
        reject(new Error('Speech not available or limit reached'))
        return
      }

      // Cancel any ongoing speech
      this.stop()

      const utterance = new SpeechSynthesisUtterance(text)
      const voice = this.getVoiceForType()
      
      if (voice) {
        utterance.voice = voice
      }

      utterance.rate = this.settings.speech_rate
      utterance.volume = this.settings.volume
      utterance.pitch = 1.0

      const estimatedTime = this.estimateSpeakingTime(text)

      utterance.onstart = () => {
        this.isSpeaking = true
        options.onStart?.()
      }

      utterance.onend = () => {
        this.isSpeaking = false
        this.updateUsage(estimatedTime)
        options.onEnd?.()
        resolve()
      }

      utterance.onerror = (error) => {
        this.isSpeaking = false
        options.onError?.(error)
        reject(error)
      }

      this.synth.speak(utterance)
    })
  }

  public stop() {
    if (this.synth.speaking) {
      this.synth.cancel()
      this.isSpeaking = false
    }
  }

  public pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause()
    }
  }

  public resume() {
    if (this.synth.paused) {
      this.synth.resume()
    }
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking
  }

  public getRemainingMinutes(): number {
    return Math.max(0, this.settings.daily_limit_minutes - this.dailyUsageMinutes)
  }

  public getUsagePercentage(): number {
    return Math.min(100, (this.dailyUsageMinutes / this.settings.daily_limit_minutes) * 100)
  }

  public updateSettings(newSettings: Partial<SpeechSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    
    // Stop current speech if disabled
    if (!this.settings.enabled) {
      this.stop()
    }
  }

  public getSettings(): SpeechSettings {
    return { ...this.settings }
  }

  // Chunk long text to avoid browser limits
  public async speakLongText(text: string, options: {
    onChunkStart?: (chunk: string, index: number) => void,
    onChunkEnd?: (chunk: string, index: number) => void,
    onProgress?: (progress: number) => void
  } = {}): Promise<void> {
    const maxChunkLength = 200 // Characters per chunk
    const chunks = this.splitTextIntoChunks(text, maxChunkLength)
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      options.onChunkStart?.(chunk, i)
      
      await this.speak(chunk, {
        onEnd: () => {
          options.onChunkEnd?.(chunk, i)
          options.onProgress?.(((i + 1) / chunks.length) * 100)
        }
      })
      
      // Small pause between chunks
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = []
    const sentences = text.split(/[.!?]+/)
    let currentChunk = ''

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      if (currentChunk.length + trimmedSentence.length <= maxLength) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence
      } else {
        if (currentChunk) {
          chunks.push(currentChunk)
        }
        currentChunk = trimmedSentence
        
        // If single sentence is too long, split it
        if (trimmedSentence.length > maxLength) {
          const words = trimmedSentence.split(' ')
          let tempChunk = ''
          
          for (const word of words) {
            if (tempChunk.length + word.length <= maxLength) {
              tempChunk += (tempChunk ? ' ' : '') + word
            } else {
              if (tempChunk) {
                chunks.push(tempChunk)
              }
              tempChunk = word
            }
          }
          
          if (tempChunk) {
            currentChunk = tempChunk
          }
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk)
    }

    return chunks.filter(chunk => chunk.trim().length > 0)
  }

  // Test speech functionality
  public async testSpeech(): Promise<boolean> {
    try {
      await this.speak('Speech test successful', {
        onEnd: () => {
          console.log('Speech test completed')
        }
      })
      return true
    } catch (error) {
      console.error('Speech test failed:', error)
      return false
    }
  }
}

export interface SpeechSettings {
  enabled: boolean
  voice_type: 'male' | 'female' | 'neutral'
  speech_rate: number
  volume: number
  auto_speak_explanations: boolean
  auto_speak_feedback: boolean
  pause_during_input: boolean
  daily_limit_minutes: number
  used_minutes_today: number
}

// React hook for speech functionality
export function useSpeechTutor(initialSettings: SpeechSettings) {
  const [tutor, setTutor] = useState<SpeechTutor | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      const speechTutor = new SpeechTutor(initialSettings)
      setTutor(speechTutor)
    } else {
      setIsSupported(false)
    }
    setIsLoading(false)

    return () => {
      tutor?.stop()
    }
  }, [])

  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    tutor?.updateSettings(newSettings)
  }, [tutor])

  const speak = useCallback(async (text: string, options?: any) => {
    return tutor?.speak(text, options)
  }, [tutor])

  const stop = useCallback(() => {
    tutor?.stop()
  }, [tutor])

  return {
    tutor,
    isSupported,
    isLoading,
    updateSettings,
    speak,
    stop,
    canSpeak: tutor?.canSpeak() || false,
    getRemainingMinutes: () => tutor?.getRemainingMinutes() || 0,
    getUsagePercentage: () => tutor?.getUsagePercentage() || 0,
    isCurrentlySpeaking: () => tutor?.isCurrentlySpeaking() || false
  }
}

import { useState, useCallback, useEffect } from 'react'
