/**
 * Concept mastery tracking system
 * Tracks user progress on different concepts based on their learning activities
 */

import { createSupabaseClient } from '@/lib/supabase/client'

export interface ConceptMastery {
  id: string
  concept_name: string
  user_id: string
  mastery_level: number // 0-100
  practice_count: number
  correct_answers: number
  total_attempts: number
  last_practiced: string
  created_at: string
  updated_at: string
}

/**
 * Calculate mastery level based on practice performance
 */
export function calculateMasteryLevel(correct: number, total: number, practiceCount: number): number {
  if (total === 0) return 0
  
  const accuracy = correct / total
  const frequencyBonus = Math.min(practiceCount * 2, 20) // Max 20% bonus for frequency
  
  let mastery = accuracy * 80 + frequencyBonus // Base 80% from accuracy, up to 20% from frequency
  
  return Math.min(Math.round(mastery), 100)
}

/**
 * Update concept mastery after practice
 */
export async function updateConceptMastery(
  userId: string,
  conceptName: string,
  isCorrect: boolean
): Promise<ConceptMastery> {
  const supabase = createSupabaseClient()
  
  try {
    // Check if concept exists for user
    const { data: existingConcept, error: fetchError } = await supabase
      .from('concept_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('concept_name', conceptName)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existingConcept) {
      // Update existing concept
      const newTotalAttempts = existingConcept.total_attempts + 1
      const newCorrectAnswers = existingConcept.correct_answers + (isCorrect ? 1 : 0)
      const newPracticeCount = existingConcept.practice_count + 1
      const newMasteryLevel = calculateMasteryLevel(newCorrectAnswers, newTotalAttempts, newPracticeCount)

      const { data: updatedConcept, error: updateError } = await supabase
        .from('concept_mastery')
        .update({
          mastery_level: newMasteryLevel,
          practice_count: newPracticeCount,
          correct_answers: newCorrectAnswers,
          total_attempts: newTotalAttempts,
          last_practiced: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConcept.id)
        .select()
        .single()

      if (updateError) throw updateError
      return updatedConcept
    } else {
      // Create new concept entry
      const masteryLevel = calculateMasteryLevel(isCorrect ? 1 : 0, 1, 1)
      
      const { data: newConcept, error: insertError } = await supabase
        .from('concept_mastery')
        .insert({
          concept_name: conceptName,
          user_id: userId,
          mastery_level: masteryLevel,
          practice_count: 1,
          correct_answers: isCorrect ? 1 : 0,
          total_attempts: 1,
          last_practiced: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError
      return newConcept
    }
  } catch (error) {
    console.error('Error updating concept mastery:', error)
    throw error
  }
}

/**
 * Get all concept mastery for a user
 */
export async function getUserConceptMastery(userId: string): Promise<ConceptMastery[]> {
  const supabase = createSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('concept_mastery')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting concept mastery:', error)
    return []
  }
}

/**
 * Extract concepts from chat messages and update mastery
 */
export async function extractAndUpdateConceptsFromChat(
  userId: string,
  messageContent: string,
  isUserMessage: boolean
): Promise<void> {
  // Simple concept extraction - in a real app, this would be more sophisticated
  const concepts = extractConceptsFromText(messageContent)
  
  for (const concept of concepts) {
    try {
      // For user messages, we consider it as "practice" (they're demonstrating knowledge)
      // For AI messages, we just track the concept exposure
      if (isUserMessage) {
        await updateConceptMastery(userId, concept, true) // Assume correct for now
      }
    } catch (error) {
      console.error(`Error updating concept ${concept}:`, error)
    }
  }
}

/**
 * Simple concept extraction from text
 */
function extractConceptsFromText(text: string): string[] {
  // This is a simple implementation - in production, you'd use NLP or topic extraction
  const commonConcepts = [
    'math', 'algebra', 'geometry', 'calculus', 'statistics', 'probability',
    'science', 'physics', 'chemistry', 'biology', 'astronomy',
    'history', 'geography', 'literature', 'grammar', 'writing',
    'programming', 'coding', 'javascript', 'python', 'html', 'css',
    'art', 'music', 'language', 'spanish', 'french', 'german'
  ]
  
  const foundConcepts: string[] = []
  const lowerText = text.toLowerCase()
  
  for (const concept of commonConcepts) {
    if (lowerText.includes(concept)) {
      foundConcepts.push(concept)
    }
  }
  
  // Also extract potential topics (words that seem important)
  const words = text.toLowerCase().split(/\s+/)
  const potentialTopics = words.filter(word => 
    word.length > 4 && 
    !commonConcepts.includes(word) &&
    !['the', 'and', 'for', 'are', 'with', 'this', 'that', 'from', 'they', 'have', 'been', 'what', 'when', 'where', 'how'].includes(word)
  ).slice(0, 3) // Take up to 3 potential topics
  
  return Array.from(new Set([...foundConcepts, ...potentialTopics]))
}

/**
 * Get concept mastery statistics
 */
export async function getConceptMasteryStats(userId: string): Promise<{
  totalConcepts: number
  masteredConcepts: number
  averageMastery: number
  conceptsByCategory: Record<string, number>
}> {
  const concepts = await getUserConceptMastery(userId)
  
  const totalConcepts = concepts.length
  const masteredConcepts = concepts.filter(c => c.mastery_level >= 80).length
  const averageMastery = totalConcepts > 0 
    ? Math.round(concepts.reduce((sum, c) => sum + c.mastery_level, 0) / totalConcepts)
    : 0
  
  // Simple categorization
  const conceptsByCategory: Record<string, number> = {
    'STEM': concepts.filter(c => 
      ['math', 'algebra', 'geometry', 'science', 'physics', 'chemistry', 'programming', 'coding'].some(topic => 
        c.concept_name.toLowerCase().includes(topic)
      )
    ).length,
    'Languages': concepts.filter(c => 
      ['grammar', 'writing', 'literature', 'spanish', 'french', 'german', 'language'].some(topic => 
        c.concept_name.toLowerCase().includes(topic)
      )
    ).length,
    'Arts': concepts.filter(c => 
      ['art', 'music', 'drawing', 'painting'].some(topic => 
        c.concept_name.toLowerCase().includes(topic)
      )
    ).length,
    'Other': 0
  }
  
  return {
    totalConcepts,
    masteredConcepts,
    averageMastery,
    conceptsByCategory
  }
}
