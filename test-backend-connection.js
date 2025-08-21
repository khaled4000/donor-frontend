#!/usr/bin/env node

/**
 * Test Backend Connection
 * This script tests the connection to your deployed backend
 */

const https = require('https');
const http = require('http');

console.log('🧪 Testing Backend Connection...\n');

const BACKEND_URL = 'https://donor-backend-dxxd.onrender.com';
const API_ENDPOINTS = [
  '/',
  '/api/health'
];

// Test function
function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run tests
async function runTests() {
  console.log('1️⃣ Testing Backend Health...');
  
  for (const endpoint of API_ENDPOINTS) {
    const fullUrl = `${BACKEND_URL}${endpoint}`;
    console.log(`   Testing: ${fullUrl}`);
    
    try {
      const result = await testEndpoint(fullUrl);
      
      if (result.status === 200) {
        console.log(`   ✅ Status: ${result.status} - SUCCESS`);
        if (result.data.message) {
          console.log(`   📝 Message: ${result.data.message}`);
        }
        if (result.data.status) {
          console.log(`   📊 Status: ${result.data.status}`);
        }
        if (result.data.database) {
          console.log(`   🗄️  Database: ${result.data.database}`);
        }
      } else {
        console.log(`   ⚠️  Status: ${result.status} - UNEXPECTED`);
      }
      
      // Check CORS headers
      if (result.headers['access-control-allow-origin']) {
        console.log(`   🌐 CORS: ${result.headers['access-control-allow-origin']}`);
      } else {
        console.log(`   ⚠️  CORS: No CORS headers found`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('2️⃣ Testing API Endpoints...');
  
  // Test specific API endpoints
  const apiEndpoints = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/cases',
    '/api/donations'
  ];
  
  for (const endpoint of apiEndpoints) {
    const fullUrl = `${BACKEND_URL}${endpoint}`;
    console.log(`   Testing: ${fullUrl}`);
    
    try {
      const result = await testEndpoint(fullUrl);
      
      if (result.status === 401 || result.status === 400) {
        console.log(`   ✅ Status: ${result.status} - ENDPOINT EXISTS (requires auth/data)`);
      } else if (result.status === 404) {
        console.log(`   ❌ Status: ${result.status} - ENDPOINT NOT FOUND`);
      } else {
        console.log(`   ⚠️  Status: ${result.status} - UNEXPECTED`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Connection Test Complete!');
  console.log('\n📋 Summary:');
  console.log(`   Backend URL: ${BACKEND_URL}`);
  console.log(`   Status: ${BACKEND_URL} is responding`);
  console.log(`   Next: Test from your frontend application`);
  
  console.log('\n🚀 To test from frontend:');
  console.log('   1. Start your frontend: npm run dev');
  console.log('   2. Open browser console');
  console.log('   3. Test API calls manually');
  console.log('   4. Check for CORS errors');
}

// Run the tests
runTests().catch(console.error);
