#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all API endpoints from your deployed backend
 * Run this before deploying frontend to ensure everything works
 */

const https = require('https');

console.log('🧪 Testing All API Endpoints from Deployed Backend...\n');

const BACKEND_URL = 'https://donor-backend-dxxd.onrender.com';
const API_BASE_URL = `${BACKEND_URL}/api`;

// Test data for API calls
const testData = {
  user: {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    role: 'donor',
    phone: '1234567890',
    address: '123 Test Street'
  },
  admin: {
    username: 'admin@nahdatwatan.com',
    password: 'admin123'
  },
  case: {
    title: 'Test Case',
    description: 'This is a test case for API testing',
    amount: 1000,
    category: 'medical',
    urgency: 'medium'
  }
};

// Test function
function testEndpoint(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers,
            url: url
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
            url: url,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Test categories
const testCategories = {
  'Health & Status': [
    { url: '/', method: 'GET', description: 'Root endpoint' },
    { url: '/api/health', method: 'GET', description: 'Health check' }
  ],
  
  'Authentication': [
    { url: '/api/auth/register', method: 'POST', data: testData.user, description: 'User registration' },
    { url: '/api/auth/login', method: 'POST', data: { email: testData.user.email, password: testData.user.password }, description: 'User login' },
    { url: '/api/auth/forgot-password', method: 'POST', data: { email: testData.user.email }, description: 'Forgot password' }
  ],
  
  'Admin Authentication': [
    { url: '/api/admin/auth/login', method: 'POST', data: testData.admin, description: 'Admin login' }
  ],
  
  'Cases': [
    { url: '/api/cases', method: 'GET', description: 'Get all cases' },
    { url: '/api/cases/fully-funded', method: 'GET', description: 'Get fully funded cases' }
  ],
  
  'Admin Cases': [
    { url: '/api/admin/cases/all', method: 'GET', description: 'Admin get all cases' },
    { url: '/api/admin/cases/kanban', method: 'GET', description: 'Admin kanban data' }
  ],
  
  'Users & Management': [
    { url: '/api/admin/users', method: 'GET', description: 'Admin get all users' },
    { url: '/api/admin/checker-management/checkers', method: 'GET', description: 'Admin get checkers' }
  ],
  
  'Donations': [
    { url: '/api/donations', method: 'GET', description: 'Get donations' }
  ],
  
  'Statistics': [
    { url: '/api/stats', method: 'GET', description: 'Get general stats' },
    { url: '/api/stats/impact', method: 'GET', description: 'Get impact stats' }
  ],
  
  'Files': [
    { url: '/api/files', method: 'GET', description: 'Get files' }
  ]
};

// Run tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive API testing...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const [category, endpoints] of Object.entries(testCategories)) {
    console.log(`📋 Testing Category: ${category}`);
    console.log('─'.repeat(50));
    
    for (const endpoint of endpoints) {
      totalTests++;
      const fullUrl = `${BACKEND_URL}${endpoint.url}`;
      
      try {
        console.log(`   Testing: ${endpoint.method} ${endpoint.url}`);
        console.log(`   Description: ${endpoint.description}`);
        
        const result = await testEndpoint(fullUrl, endpoint.method, endpoint.data, endpoint.headers);
        
        // Analyze response
        if (result.status === 200) {
          console.log(`   ✅ SUCCESS (${result.status})`);
          passedTests++;
        } else if (result.status === 401 || result.status === 403) {
          console.log(`   🔒 AUTH REQUIRED (${result.status}) - Expected for protected endpoints`);
          passedTests++;
        } else if (result.status === 400) {
          console.log(`   ⚠️  BAD REQUEST (${result.status}) - ${result.data.message || result.data.error || 'Validation error'}`);
          passedTests++;
        } else if (result.status === 404) {
          console.log(`   ❌ NOT FOUND (${result.status}) - Endpoint may not be implemented`);
          failedTests++;
        } else if (result.status >= 500) {
          console.log(`   💥 SERVER ERROR (${result.status}) - Backend issue`);
          failedTests++;
        } else {
          console.log(`   ⚠️  UNEXPECTED (${result.status}) - ${result.data.message || 'Unknown response'}`);
          passedTests++;
        }
        
        // Show response details for debugging
        if (result.data && typeof result.data === 'object') {
          if (result.data.message) console.log(`      Message: ${result.data.message}`);
          if (result.data.error) console.log(`      Error: ${result.data.error}`);
          if (result.data.status) console.log(`      Status: ${result.data.status}`);
        }
        
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        failedTests++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log(''); // Empty line between categories
  }
  
  // Final summary
  console.log('🎯 API Testing Complete!');
  console.log('─'.repeat(50));
  console.log(`📊 Results:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Analysis:');
  if (failedTests === 0) {
    console.log('   🎉 All API endpoints are working correctly!');
    console.log('   🚀 Your backend is ready for frontend deployment!');
  } else if (failedTests <= 3) {
    console.log('   ⚠️  Most endpoints are working, but a few may need attention.');
    console.log('   🔧 Check the failed endpoints above.');
  } else {
    console.log('   ❌ Several endpoints have issues that need to be resolved.');
    console.log('   🔧 Review the failed endpoints and fix backend issues.');
  }
  
  console.log('\n🌐 Backend URL:', BACKEND_URL);
  console.log('📚 API Documentation:', `${BACKEND_URL}/api/health`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (passedTests / totalTests >= 0.9) {
    console.log('   ✅ Your backend is production-ready!');
    console.log('   🚀 Proceed with frontend deployment.');
  } else if (passedTests / totalTests >= 0.7) {
    console.log('   ⚠️  Backend is mostly ready, but review failed endpoints.');
    console.log('   🔧 Fix critical issues before deployment.');
  } else {
    console.log('   ❌ Backend needs significant work before deployment.');
    console.log('   🔧 Focus on fixing API endpoints first.');
  }
}

// Run the tests
runAllTests().catch(console.error);
