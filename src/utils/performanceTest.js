/**
 * Performance Test Utility
 * Tests the performance optimizations and provides benchmarks
 */

import performanceMonitor from './performanceMonitor';

/**
 * Run comprehensive performance tests
 */
export const runPerformanceTests = async () => {
  console.log('🧪 Starting performance tests...');
  
  const results = {
    imageOptimization: await testImageOptimization(),
    dragAndDrop: await testDragAndDrop(),
    rendering: await testRendering(),
    memoryUsage: await testMemoryUsage(),
    overall: {}
  };
  
  // Calculate overall score
  results.overall = calculateOverallScore(results);
  
  console.log('📊 Performance test results:', results);
  return results;
};

/**
 * Test image optimization performance
 */
const testImageOptimization = async () => {
  const testImage = createTestImage(1920, 1080);
  const startTime = performance.now();
  
  try {
    // Test compression
    const compressed = await compressTestImage(testImage);
    
    // Test thumbnail generation
    const thumbnails = await generateTestThumbnails(testImage);
    
    // Test lazy loading simulation
    const lazyLoadTime = await simulateLazyLoading(testImage);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    return {
      success: true,
      compressionTime: totalTime,
      originalSize: testImage.size,
      compressedSize: compressed.size,
      compressionRatio: (compressed.size / testImage.size * 100).toFixed(2),
      thumbnailCount: Object.keys(thumbnails).length,
      lazyLoadTime,
      score: calculateImageScore(totalTime, compressed.size, testImage.size)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      score: 0
    };
  }
};

/**
 * Test drag and drop performance
 */
const testDragAndDrop = async () => {
  const results = [];
  const iterations = 10;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    // Simulate drag operation
    await simulateDragOperation();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    results.push(duration);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
  const minTime = Math.min(...results);
  const maxTime = Math.max(...results);
  
  return {
    success: true,
    iterations,
    averageTime: avgTime.toFixed(2),
    minTime: minTime.toFixed(2),
    maxTime: maxTime.toFixed(2),
    score: calculateDragScore(avgTime)
  };
};

/**
 * Test rendering performance
 */
const testRendering = async () => {
  const results = [];
  const iterations = 5;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    // Simulate complex rendering
    await simulateComplexRendering();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    results.push(duration);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
  
  return {
    success: true,
    iterations,
    averageTime: avgTime.toFixed(2),
    score: calculateRenderScore(avgTime)
  };
};

/**
 * Test memory usage
 */
const testMemoryUsage = async () => {
  const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  
  // Simulate memory-intensive operations
  await simulateMemoryIntensiveOperations();
  
  const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  const memoryIncrease = finalMemory - initialMemory;
  
  // Force garbage collection if available
  if (window.gc) {
    window.gc();
    await new Promise(resolve => setTimeout(resolve, 100));
    const afterGCMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    return {
      success: true,
      initialMemory: formatBytes(initialMemory),
      finalMemory: formatBytes(finalMemory),
      memoryIncrease: formatBytes(memoryIncrease),
      afterGCMemory: formatBytes(afterGCMemory),
      score: calculateMemoryScore(memoryIncrease, afterGCMemory)
    };
  }
  
  return {
    success: true,
    initialMemory: formatBytes(initialMemory),
    finalMemory: formatBytes(finalMemory),
    memoryIncrease: formatBytes(memoryIncrease),
    score: calculateMemoryScore(memoryIncrease, 0)
  };
};

/**
 * Helper functions
 */
const createTestImage = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);
  
  // Add some test content
  ctx.fillStyle = '#333';
  ctx.font = '24px Arial';
  ctx.fillText('Test Image', 50, 50);
  
  return {
    canvas,
    size: width * height * 4, // Approximate size in bytes
    width,
    height
  };
};

const compressTestImage = async (testImage) => {
  return new Promise((resolve) => {
    testImage.canvas.toBlob((blob) => {
      resolve({
        blob,
        size: blob.size
      });
    }, 'image/webp', 0.8);
  });
};

const generateTestThumbnails = async (testImage) => {
  const thumbnails = {};
  const sizes = [50, 100, 150, 200];
  
  for (const size of sizes) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(testImage.canvas, 0, 0, size, size);
    
    thumbnails[`${size}x${size}`] = canvas.toDataURL('image/webp', 0.7);
  }
  
  return thumbnails;
};

const simulateLazyLoading = async (testImage) => {
  const startTime = performance.now();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate image loading
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = testImage.canvas.toDataURL();
  });
  
  const endTime = performance.now();
  return endTime - startTime;
};

const simulateDragOperation = async () => {
  // Simulate drag operation complexity
  const operations = 1000;
  let result = 0;
  
  for (let i = 0; i < operations; i++) {
    result += Math.sin(i) * Math.cos(i);
  }
  
  return result;
};

const simulateComplexRendering = async () => {
  // Simulate complex rendering operations
  const elements = 100;
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  
  const ctx = canvas.getContext('2d');
  
  for (let i = 0; i < elements; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    const size = Math.random() * 20 + 5;
    
    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  return canvas;
};

const simulateMemoryIntensiveOperations = async () => {
  // Simulate memory-intensive operations
  const arrays = [];
  const arraySize = 10000;
  
  for (let i = 0; i < 10; i++) {
    arrays.push(new Array(arraySize).fill(Math.random()));
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // Clear arrays to free memory
  arrays.length = 0;
};

/**
 * Scoring functions
 */
const calculateImageScore = (time, compressedSize, originalSize) => {
  let score = 100;
  
  // Time penalty
  if (time > 1000) score -= 30;
  else if (time > 500) score -= 20;
  else if (time > 200) score -= 10;
  
  // Compression ratio penalty
  const compressionRatio = compressedSize / originalSize;
  if (compressionRatio > 0.8) score -= 20;
  else if (compressionRatio > 0.6) score -= 10;
  
  return Math.max(0, score);
};

const calculateDragScore = (avgTime) => {
  let score = 100;
  
  if (avgTime > 100) score -= 40;
  else if (avgTime > 50) score -= 20;
  else if (avgTime > 20) score -= 10;
  
  return Math.max(0, score);
};

const calculateRenderScore = (avgTime) => {
  let score = 100;
  
  if (avgTime > 100) score -= 40;
  else if (avgTime > 50) score -= 20;
  else if (avgTime > 20) score -= 10;
  
  return Math.max(0, score);
};

const calculateMemoryScore = (increase, afterGC) => {
  let score = 100;
  
  const increaseMB = increase / (1024 * 1024);
  
  if (increaseMB > 50) score -= 40;
  else if (increaseMB > 20) score -= 20;
  else if (increaseMB > 10) score -= 10;
  
  if (afterGC > 0) {
    const afterGCMB = afterGC / (1024 * 1024);
    if (afterGCMB > 100) score -= 20;
  }
  
  return Math.max(0, score);
};

const calculateOverallScore = (results) => {
  const scores = [
    results.imageOptimization.score,
    results.dragAndDrop.score,
    results.rendering.score,
    results.memoryUsage.score
  ];
  
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  return {
    average: Math.round(avgScore),
    grade: getGrade(avgScore),
    breakdown: {
      imageOptimization: results.imageOptimization.score,
      dragAndDrop: results.dragAndDrop.score,
      rendering: results.rendering.score,
      memoryUsage: results.memoryUsage.score
    }
  };
};

const getGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Export test functions
 */
export default {
  runPerformanceTests,
  testImageOptimization,
  testDragAndDrop,
  testRendering,
  testMemoryUsage
};
