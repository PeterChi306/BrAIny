#!/usr/bin/env node

/**
 * Test the fixed streak system
 */

const fetch = require('node-fetch');

async function testStreakSystem() {
  console.log('🔥 Testing Fixed Streak System...\n');

  const API_URL = 'http://localhost:3001/api/tutor';
  
  // Test 1: First message of the day (should increment streak)
  console.log('=== Test 1: First message of the day ===');
  try {
    const response1 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What is 2+2?",
        mode: 'explain',
        displayName: 'Test Student',
        profile: {
          display_name: 'Test Student',
          interests: ['math']
        }
      })
    });

    if (response1.ok) {
      console.log('✅ First message sent successfully');
    } else {
      console.log('❌ First message failed:', response1.status);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Second message of the same day (should NOT increment streak)
  console.log('\n=== Test 2: Second message (same day) ===');
  try {
    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What is 3+3?",
        mode: 'explain',
        displayName: 'Test Student',
        profile: {
          display_name: 'Test Student',
          interests: ['math']
        }
      })
    });

    if (response2.ok) {
      console.log('✅ Second message sent successfully');
    } else {
      console.log('❌ Second message failed:', response2.status);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Third message of the same day (should NOT increment streak)
  console.log('\n=== Test 3: Third message (same day) ===');
  try {
    const response3 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What is 4+4?",
        mode: 'explain',
        displayName: 'Test Student',
        profile: {
          display_name: 'Test Student',
          interests: ['math']
        }
      })
    });

    if (response3.ok) {
      console.log('✅ Third message sent successfully');
    } else {
      console.log('❌ Third message failed:', response3.status);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('\n🎯 Expected Behavior:');
  console.log('- First message: Should create daily_usage record and update streak');
  console.log('- Second & Third messages: Should NOT update streak (already active today)');
  console.log('- Streak should only increment ONCE per day');

  console.log('\n📊 Check browser console for:');
  console.log('- "🔥 User already active today - not updating streak" messages');
  console.log('- "📅 First activity of the day - updating streak" messages');
}

testStreakSystem().catch(console.error);
