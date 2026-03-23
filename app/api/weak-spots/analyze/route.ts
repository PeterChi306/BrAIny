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

    let { quizzes, performance, subjects, grade_level } = await request.json()

    // 🧠 REVOLUTIONARY: Auto-fetch data if not provided (for background analysis)
    if (!quizzes || quizzes.length === 0) {
      const { data: fetchedQuizzes } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      quizzes = fetchedQuizzes || []
    }

    if (!performance || performance.length === 0) {
      const { data: fetchedPerf } = await supabase
        .from('user_performance')
        .select('*')
        .eq('user_id', session.user.id)
      performance = fetchedPerf || []
    }

    if (!subjects || subjects.length === 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subjects, grade_level')
        .eq('id', session.user.id)
        .maybeSingle()
      subjects = profile?.subjects || []
      grade_level = grade_level || profile?.grade_level || 'General'
    }

    // Generate weak spots analysis using AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' })

    const prompt = `Analyze this student's performance data to identify weak spots and learning gaps.

Student Profile:
- Grade Level: ${grade_level}
- Subjects: ${subjects.join(', ')}

Quiz Performance Data:
${quizzes?.map((q: any) => `- ${q.topic}: ${q.score}/${q.total_questions} (${Math.round(q.score/q.total_questions*100)}%)`).join('\n') || 'No quiz data'}

Performance Data:
${performance?.map((p: any) => `- Subject: ${p.subject}, Average: ${p.average_score}%, Weak areas: ${p.weak_concepts.join(', ')}`).join('\n') || 'No performance data'}

Generate a comprehensive weak spots analysis with this JSON structure:
{
  "weak_spots": [
    {
      "concept": "Specific concept name",
      "subject": "Subject area",
      "frequency": number_of_times_weak,
      "recent_failures": number_of_recent_failures,
      "improvement_suggestions": [
        "Specific actionable suggestion 1",
        "Specific actionable suggestion 2"
      ],
      "practice_resources": [
        {
          "type": "quiz|flashcards|video|practice",
          "title": "Resource title",
          "action": "Specific topic to practice"
        }
      ]
    }
  ],
  "overall_performance": overall_score_percentage,
  "improvement_plan": {
    "priority_concepts": ["concept1", "concept2"],
    "study_strategy": "Detailed study strategy based on learning patterns",
    "estimated_improvement_time": "Time estimate (e.g., '2-3 weeks')"
  }
}

Make the analysis:
1. Data-driven based on actual performance
2. Actionable with specific improvement steps
3. Personalized to the student's grade level and subjects
4. Include varied practice resource types
5. Provide realistic time estimates

Return ONLY the JSON, no additional text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    const analysisData = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))

    return NextResponse.json({ analysis: analysisData })

  } catch (error) {
    console.error('Error analyzing weak spots:', error)
    return NextResponse.json(
      { error: 'Failed to analyze weak spots' },
      { status: 500 }
    )
  }
}
