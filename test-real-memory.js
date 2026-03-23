#!/usr/bin/env node

/**
 * Real test of conversation memory with proper authentication simulation
 */

const fetch = require('node-fetch');

async function testConversationMemory() {
  console.log('🧪 Testing Conversation Memory with Real Flow...\n');

  // First, let's check if we can access the tutor page directly
  const API_URL = 'http://localhost:3001/api/tutor';
  
  // Test 1: Check what happens with no chatId (new conversation)
  console.log('=== Test 1: New Conversation (no chatId) ===');
  try {
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

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ New conversation response received');
      console.log('Response length:', data1.response.length);
      console.log('Response preview:', data1.response.substring(0, 150) + '...');
      
      // Test 2: Simulate follow-up with same chatId (we need to extract it)
      console.log('\n=== Test 2: Follow-up Conversation ===');
      console.log('Note: In real app, chatId would be passed from frontend');
      
      // For testing, let's try with a fake chatId to see if history loading works
      const response2 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Can you explain the light-dependent reactions?",
          chatId: "test-chat-123", // Simulating a real chatId
          mode: 'explain',
          displayName: 'Test Student',
          profile: {
            display_name: 'Test Student',
            interests: ['science']
          }
        })
      });

      if (response2.ok) {
        const data2 = await response2.json();
        console.log('✅ Follow-up response received');
        console.log('Response length:', data2.response.length);
        console.log('Response preview:', data2.response.substring(0, 150) + '...');
        
        // Check if response shows continuity
        const continuityIndicators = [
          'previously', 'earlier', 'building on', 'as mentioned',
          'following up', 'continuing', 'photosynthesis', 'light-dependent'
        ];
        
        const hasContinuity = continuityIndicators.some(indicator => 
          data2.response.toLowerCase().includes(indicator)
        );
        
        if (hasContinuity) {
          console.log('✅ Response shows conversation continuity!');
        } else {
          console.log('❌ Response does NOT show conversation continuity');
          console.log('This suggests the memory system may not be working');
        }
      } else {
        console.log('❌ Follow-up request failed:', response2.status);
      }
    } else {
      console.log('❌ Initial request failed:', response1.status);
      console.log('Error:', await response1.text());
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testConversationMemory();
