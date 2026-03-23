/**
 * Utility functions to parse structured action buttons from AI responses
 */

export interface ActionButton {
  id: string
  label: string
  action: 'practice' | 'quiz' | 'flashcards' | 'explain_simple' | 'real_world_example'
  data?: any
}

/**
 * Parse action buttons from AI response text
 * Looks for [ActionButtons] section at the end of the response
 */
export const parseActionButtons = (responseText: string): {
  text: string
  buttons: ActionButton[]
} => {
  const actionButtonRegex = /\[ActionButtons\]\s*\n((?:-\s*.+\n?)+)/i
  const match = responseText.match(actionButtonRegex)
  
  if (!match) {
    return { text: responseText, buttons: [] }
  }

  // Extract the text without the action buttons section
  const text = responseText.replace(actionButtonRegex, '').trim()
  
  // Parse the button labels
  const buttonLabels = match[1]
    .split('\n')
    .map(line => line.trim().replace(/^-\s*/, ''))
    .filter(label => label.length > 0)

  // Map labels to actions
  const buttons: ActionButton[] = buttonLabels.map((label, index) => {
    const normalizedLabel = label.toLowerCase().trim()
    
    if (normalizedLabel.includes('practice')) {
      return { id: `btn_${index}`, label, action: 'practice' }
    } else if (normalizedLabel.includes('quiz')) {
      return { id: `btn_${index}`, label, action: 'quiz' }
    } else if (normalizedLabel.includes('flashcard')) {
      return { id: `btn_${index}`, label, action: 'flashcards' }
    } else if (normalizedLabel.includes('explain') || normalizedLabel.includes('simpler')) {
      return { id: `btn_${index}`, label, action: 'explain_simple' }
    } else if (normalizedLabel.includes('real-world') || normalizedLabel.includes('example')) {
      return { id: `btn_${index}`, label, action: 'real_world_example' }
    } else {
      // Default to practice for unrecognized labels
      return { id: `btn_${index}`, label, action: 'practice' }
    }
  })

  return { text, buttons }
}

