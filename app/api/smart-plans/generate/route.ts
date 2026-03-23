import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subjects, grade_level, learning_style, interests } = await request.json()

    // Get user performance data to identify weak spots
    const { data: performance } = await supabase
      .from('user_performance')
      .select('*')
      .eq('user_id', session.user.id)

    const { data: recentQuizzes } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Generate smart plan using AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' })

    const prompt = `Create a personalized study plan for a ${grade_level} grade student.

Student Profile:
- Subjects: ${subjects.join(', ')}
- Learning Style: ${learning_style}
- Interests: ${interests?.join(', ') || 'Not specified'}
- Weak Areas: ${performance?.map(p => p.weak_concepts).flat().join(', ') || 'None identified'}
- Recent Quiz Performance: ${recentQuizzes?.map(q => `${q.topic}: ${q.score}/${q.total_questions}`).join(', ') || 'No recent quizzes'}

Generate a study plan with this JSON structure:
{
  "title": "Engaging title for the plan",
  "description": "Brief description of what this plan covers",
  "subject": "Main subject focus",
  "difficulty": "easy|medium|hard",
  "estimated_time": total_minutes,
  "tasks": [
    {
      "id": "unique_id",
      "title": "Task description",
      "type": "study|practice|quiz|review",
      "time_estimate": minutes,
      "completed": false
    }
  ]
}

Make it:
1. Personalized to their interests and learning style
2. Focus on improving weak areas
3. Include a mix of learning activities
4. Be achievable in one study session
5. Use engaging, relevant examples

Return ONLY the JSON, no additional text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    const planData = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))

    return NextResponse.json({ plan: planData })

  } catch (error) {
    console.error('Error generating smart plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate smart plan' },
      { status: 500 }
    )
  }
}
