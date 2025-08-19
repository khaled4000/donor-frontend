#!/usr/bin/env node

/**
 * Clean Restart Script for Donor Project
 * This script helps clean restart the server and clear cached data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting clean restart process...\n');

// Function to run commands safely
function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.log(`❌ ${description} failed: ${error.message}\n`);
  }
}

// Function to check if process is running
function isProcessRunning(processName) {
  try {
    const result = execSync(`tasklist /FI "IMAGENAME eq ${processName}" 2>NUL | find /I /N "${processName}"`, { encoding: 'utf8' });
    return result.includes(processName);
  } catch {
    return false;
  }
}

// Function to kill process
function killProcess(processName) {
  try {
    if (isProcessRunning(processName)) {
      console.log(`🔄 Killing ${processName}...`);
      execSync(`taskkill /F /IM ${processName}`, { stdio: 'inherit' });
      console.log(`✅ ${processName} killed\n`);
    } else {
      console.log(`ℹ️ ${processName} is not running\n`);
    }
  } catch (error) {
    console.log(`❌ Failed to kill ${processName}: ${error.message}\n`);
  }
}

// Main cleanup process
async function cleanRestart() {
  console.log('🔍 Checking for running processes...\n');
  
  // Kill Node.js processes
  killProcess('node.exe');
  killProcess('nodemon.exe');
  
  // Clear npm cache
  runCommand('npm cache clean --force', 'Clearing npm cache');
  
  // Clear node_modules and reinstall (optional - uncomment if needed)
  // console.log('🗑️ Removing node_modules...');
  // if (fs.existsSync('node_modules')) {
  //   fs.rmSync('node_modules', { recursive: true, force: true });
  //   console.log('✅ node_modules removed\n');
  // }
  
  // Clear any temporary files
  console.log('🧹 Clearing temporary files...');
  const tempFiles = ['.DS_Store', 'Thumbs.db', '*.log', '*.tmp'];
  tempFiles.forEach(pattern => {
    try {
      execSync(`del /Q ${pattern} 2>NUL`, { stdio: 'ignore' });
    } catch {}
  });
  console.log('✅ Temporary files cleared\n');
  
  // Reinstall dependencies
  runCommand('npm install', 'Reinstalling dependencies');
  
  console.log('🚀 Ready to start server!');
  console.log('\n📝 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Check console for any remaining errors');
  console.log('3. Test the application functionality');
  
  console.log('\n✨ Clean restart process completed!');
}

// Run the cleanup
cleanRestart().catch(console.error);
