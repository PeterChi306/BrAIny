#!/usr/bin/env node

/**
 * Test script to verify conversation continuity in brAIny AI
 * This simulates a conversation to test if the AI remembers previous context
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api/tutor';

async function testConversationContinuity() {
  console.log('🧪 Testing brAIny Conversation Continuity...\n');

  // Simulate a conversation about photosynthesis
  const conversation = [
    {
      user: "What is photosynthesis?",
      expectedContext: "First question about photosynthesis"
    },
    {
      user: "Can you explain the light-dependent reactions?",
      expectedContext: "Follow-up question about specific part of photosynthesis"
    },
    {
      user: "What happens during the Calvin cycle?",
      expectedContext: "Another specific part of photosynthesis"
    },
    {
      user: "How do these two stages work together?",
      expectedContext: "Connecting the previously discussed stages"
    }
  ];

  let chatId = 'test-chat-' + Date.now();
  let conversationHistory = [];

  for (let i = 0; i < conversation.length; i++) {
    const turn = conversation[i];
    
    console.log(`\n--- Turn ${i + 1} ---`);
    console.log(`User: ${turn.user}`);
    console.log(`Expected: ${turn.expectedContext}`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: turn.user,
          chatId: chatId,
          mode: 'explain',
          displayName: 'Test Student',
          interests: ['science'],
          profile: {
            display_name: 'Test Student',
            interests: ['science'],
            learning_style: 'visual'
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Error: ${response.status} - ${error}`);
        continue;
      }

      const data = await response.json();
      const aiResponse = data.response;
      
      console.log(`\nbrAIny: ${aiResponse.substring(0, 200)}...`);
      
      // Check if AI references previous context (after first turn)
      if (i > 0) {
        const hasContextReference = 
          aiResponse.toLowerCase().includes('previously') ||
          aiResponse.toLowerCase().includes('earlier') ||
          aiResponse.toLowerCase().includes('as mentioned') ||
          aiResponse.toLowerCase().includes('we discussed') ||
          aiResponse.toLowerCase().includes('building on') ||
          aiResponse.toLowerCase().includes('following up') ||
          // Check for references to photosynthesis stages
          (i === 2 && (aiResponse.toLowerCase().includes('light-dependent') || aiResponse.toLowerCase().includes('first stage'))) ||
          (i === 3 && (aiResponse.toLowerCase().includes('both stages') || aiResponse.toLowerCase().includes('together')));
        
        if (hasContextReference) {
          console.log('✅ AI shows awareness of conversation context');
        } else {
          console.log('⚠️  AI may not be referencing previous context clearly');
        }
      }
      
      conversationHistory.push({
        role: 'user',
        content: turn.user
      });
      
      conversationHistory.push({
        role: 'assistant', 
        content: aiResponse
      });
      
    } catch (error) {
      console.error(`❌ Network error:`, error.message);
    }
  }

  console.log('\n🏁 Test completed!');
  console.log('\n📝 Summary:');
  console.log('- Check if AI remembered previous parts of photosynthesis discussion');
  console.log('- Look for natural references to previously explained concepts');
  console.log('- Verify the conversation flows logically without starting over each time');
}

// Run the test
testConversationContinuity().catch(console.error);
