// Test the parseActionButtons function
const { parseActionButtons } = require('./lib/ai-response-parser.ts')

const testResponse = `This is a test response.

[ActionButtons]
- Practice this topic
- Take a quiz
- Create flashcards`

try {
  const result = parseActionButtons(testResponse)
  console.log('✅ Function works:', result)
} catch (error) {
  console.error('❌ Function error:', error.message)
}
