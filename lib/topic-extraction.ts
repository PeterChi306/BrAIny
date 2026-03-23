// Topic extraction and session naming functionality

export interface TopicExtractionResult {
  topic: string
  confidence: number
  category: string
  suggestedTitle: string
}

class TopicExtractor {
  private readonly topicPatterns = {
    // Academic subjects
    math: /\b(math|mathematics|algebra|geometry|calculus|statistics|probability|equation|formula|calculation|number|fraction|decimal|percentage|graph|chart)\b/gi,
    science: /\b(science|physics|chemistry|biology|astronomy|geology|experiment|hypothesis|theory|molecule|atom|cell|organism|energy|force|motion|gravity|electricity|magnetism)\b/gi,
    history: /\b(history|historical|ancient|modern|war|battle|revolution|empire|dynasty|century|decade|timeline|civilization|culture|society|government|politics)\b/gi,
    literature: /\b(literature|book|novel|poem|poetry|story|author|writer|character|plot|theme|symbol|metaphor|genre|fiction|non-fiction|essay|article)\b/gi,
    geography: /\b(geography|country|city|state|continent|ocean|river|mountain|climate|weather|map|location|capital|border|region|terrain|landscape)\b/gi,
    
    // Technology
    programming: /\b(programming|coding|code|software|app|website|development|javascript|python|java|html|css|react|function|variable|algorithm|database|api|frontend|backend)\b/gi,
    computer: /\b(computer|laptop|desktop|software|hardware|internet|network|server|cloud|data|security|virus|hack|technology|digital|online)\b/gi,
    ai: /\b(artificial intelligence|ai|machine learning|neural network|deep learning|algorithm|automation|robot|chatbot|nlp|computer vision)\b/gi,
    
    // Languages
    language: /\b(language|english|spanish|french|german|chinese|japanese|grammar|vocabulary|translation|speak|write|read|listen|pronunciation)\b/gi,
    
    // Arts
    art: /\b(art|painting|drawing|sculpture|design|creative|artist|canvas|brush|color|shade|technique|style|museum|gallery)\b/gi,
    music: /\b(music|song|melody|rhythm|beat|instrument|guitar|piano drums|singing|composer|genre|classical|jazz|rock|pop)\b/gi,
    
    // General learning
    study: /\b(study|learn|practice|review|homework|assignment|exam|test|quiz|lesson|chapter|concept|theory|principle|definition)\b/gi,
    help: /\b(help|explain|understand|clarify|teach|show me|how to|what is|why|when|where|can you)\b/gi
  }

  private readonly categoryNames = {
    math: 'Mathematics',
    science: 'Science',
    history: 'History',
    literature: 'Literature',
    geography: 'Geography',
    programming: 'Programming',
    computer: 'Computer Science',
    ai: 'Artificial Intelligence',
    language: 'Language Learning',
    art: 'Art & Design',
    music: 'Music',
    study: 'General Study',
    help: 'Help & Explanation'
  }

  extractTopic(message: string): TopicExtractionResult {
    const lowerMessage = message.toLowerCase()
    let bestMatch: TopicExtractionResult = {
      topic: 'General Discussion',
      confidence: 0,
      category: 'General',
      suggestedTitle: 'Chat Session'
    }

    // Check each category for matches
    for (const [category, pattern] of Object.entries(this.topicPatterns)) {
      const matches = lowerMessage.match(pattern)
      if (matches && matches.length > 0) {
        const confidence = matches.length / Math.max(lowerMessage.split(' ').length, 1)
        
        if (confidence > bestMatch.confidence) {
          const topic = this.extractMainTopic(lowerMessage, matches)
          bestMatch = {
            topic: topic,
            confidence: confidence,
            category: this.categoryNames[category as keyof typeof this.categoryNames] || category,
            suggestedTitle: this.generateTitle(topic, this.categoryNames[category as keyof typeof this.categoryNames] || category)
          }
        }
      }
    }

    // If no strong matches, try to extract from question patterns
    if (bestMatch.confidence < 0.1) {
      const questionTopic = this.extractFromQuestion(message)
      if (questionTopic) {
        bestMatch = {
          topic: questionTopic,
          confidence: 0.2,
          category: 'Question',
          suggestedTitle: this.generateTitle(questionTopic, 'Question')
        }
      }
    }

    return bestMatch
  }

  private extractMainTopic(message: string, matches: string[]): string {
    // Extract the most relevant topic from matches
    const topicWords = matches.map(match => match.toLowerCase())
    
    // Find the most specific/longest match
    const sortedTopics = topicWords.sort((a, b) => b.length - a.length)
    
    // Return the longest match, cleaned up
    return sortedTopics[0]?.replace(/[^\w\s]/g, '').trim() || 'General Topic'
  }

  private extractFromQuestion(message: string): string | null {
    // Look for question patterns and extract the subject
    const questionPatterns = [
      /what\s+is\s+(\w+)/i,
      /how\s+does\s+(\w+)/i,
      /explain\s+(\w+)/i,
      /tell\s+me\s+about\s+(\w+)/i,
      /can\s+you\s+help\s+me\s+with\s+(\w+)/i,
      /i\s+need\s+help\s+with\s+(\w+)/i
    ]

    for (const pattern of questionPatterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    // Look for capitalized words that might be topics
    const capitalizedWords = message.match(/\b[A-Z][a-z]+\b/g)
    if (capitalizedWords && capitalizedWords.length > 0) {
      return capitalizedWords[0]
    }

    return null
  }

  private generateTitle(topic: string, category: string): string {
    // Clean up the topic
    const cleanTopic = topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase()
    
    // Generate different title formats based on category
    const titleFormats = {
      'Mathematics': `${cleanTopic} - Math Help`,
      'Science': `${cleanTopic} - Science Study`,
      'History': `${cleanTopic} - History Lesson`,
      'Literature': `${cleanTopic} - Literature Analysis`,
      'Geography': `${cleanTopic} - Geography Study`,
      'Programming': `${cleanTopic} - Coding Help`,
      'Computer Science': `${cleanTopic} - CS Study`,
      'Artificial Intelligence': `${cleanTopic} - AI Discussion`,
      'Language Learning': `${cleanTopic} - Language Practice`,
      'Art & Design': `${cleanTopic} - Art Discussion`,
      'Music': `${cleanTopic} - Music Theory`,
      'General Study': `${cleanTopic} - Study Session`,
      'Help & Explanation': `${cleanTopic} - Explanation`,
      'Question': `Question about ${cleanTopic}`,
      'General': `${cleanTopic} Discussion`
    }

    return titleFormats[category as keyof typeof titleFormats] || `${cleanTopic} Discussion`
  }

  async generateSessionTitle(message: string, conversationHistory: any[] = []): Promise<string | null> {
    // If this is the first message, extract topic from it
    if (conversationHistory.length === 0) {
      const extraction = this.extractTopic(message)
      return extraction.suggestedTitle
    }

    // For ongoing conversations, analyze the current message in context
    const currentExtraction = this.extractTopic(message)
    
    // If high confidence topic, use it to potentially update the title
    if (currentExtraction.confidence > 0.3) {
      return currentExtraction.suggestedTitle
    }

    // Otherwise, keep the existing title (this would be handled by the caller)
    return null
  }
}

// Singleton instance
export const topicExtractor = new TopicExtractor()

// React hook for using topic extraction
export const useTopicExtraction = () => {
  const extractTopic = (message: string): TopicExtractionResult => {
    return topicExtractor.extractTopic(message)
  }

  const generateSessionTitle = async (message: string, conversationHistory: any[] = []): Promise<string | null> => {
    return await topicExtractor.generateSessionTitle(message, conversationHistory)
  }

  return {
    extractTopic,
    generateSessionTitle
  }
}
