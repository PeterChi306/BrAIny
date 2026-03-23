#!/usr/bin/env node

/**
 * Quick test to check conversation history loading
 */

const fetch = require('node-fetch');

async function testConversationHistory() {
  console.log('🧪 Testing Conversation History Loading...\n');

  const API_URL = 'http://localhost:3001/api/tutor';
  
  // First, create a new chat
  console.log('1. Creating new chat...');
  const response1 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What is photosynthesis?",
      mode: 'explain',
      displayName: 'Test Student',
      profile: {
        display_name: 'Test Student',
        interests: ['science']
      }
    })
  });

  if (!response1.ok) {
    console.error('❌ First request failed:', await response1.text());
    return;
  }

  const data1 = await response1.json();
  console.log('✅ First response received');
  console.log('Response preview:', data1.response.substring(0, 100) + '...');

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Second message in same conversation (without chatId - this might be the issue!)
  console.log('\n2. Sending follow-up message...');
  const response2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "Can you explain the light-dependent reactions?",
      mode: 'explain',
      displayName: 'Test Student',
      profile: {
        display_name: 'Test Student',
        interests: ['science']
      }
    })
  });

  if (!response2.ok) {
    console.error('❌ Second request failed:', await response2.text());
    return;
  }

  const data2 = await response2.json();
  console.log('✅ Second response received');
  console.log('Response preview:', data2.response.substring(0, 100) + '...');

  // Check if AI references the previous context
  const hasContextReference = 
    data2.response.toLowerCase().includes('photosynthesis') ||
    data2.response.toLowerCase().includes('previously') ||
    data2.response.toLowerCase().includes('as mentioned') ||
    data2.response.toLowerCase().includes('building on');

  if (hasContextReference) {
    console.log('✅ AI shows awareness of previous context');
  } else {
    console.log('❌ AI does not seem to reference previous context');
    console.log('This suggests the conversation history is not being loaded properly');
  }
}

testConversationHistory().catch(console.error);
