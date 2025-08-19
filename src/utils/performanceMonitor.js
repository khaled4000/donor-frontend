/**
 * Performance Monitoring Utility
 * Tracks performance metrics, memory usage, and provides optimization suggestions
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTimes: [],
      memoryUsage: [],
      frameRates: [],
      dragOperations: [],
      imageLoadTimes: []
    };
    
    this.observers = new Map();
    this.isMonitoring = false;
    this.startTime = performance.now();
    
    // Performance thresholds
    this.thresholds = {
      renderTime: 16.67, // 60fps target
      memoryUsage: 50 * 1024 * 1024, // 50MB
      frameRate: 30, // Minimum acceptable FPS
      dragLatency: 100 // Maximum drag latency in ms
    };
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = performance.now();
    
    // Monitor frame rate
    this.monitorFrameRate();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor long tasks
    this.monitorLongTasks();
    
    console.log('🚀 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Clear intervals
    this.observers.forEach(observer => {
      if (observer.interval) {
        clearInterval(observer.interval);
      }
    });
    
    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Monitor frame rate
   */
  monitorFrameRate() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.metrics.frameRates.push({
          timestamp: currentTime,
          fps,
          timestamp: Date.now()
        });
        
        // Keep only last 100 measurements
        if (this.metrics.frameRates.length > 100) {
          this.metrics.frameRates.shift();
        }
        
        // Check for performance issues
        if (fps < this.thresholds.frameRate) {
          this.reportPerformanceIssue('low_frame_rate', { fps, threshold: this.thresholds.frameRate });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFrameRate);
      }
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (!performance.memory) return;
    
    const interval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(interval);
        return;
      }
      
      const memory = performance.memory;
      const usedMemory = memory.usedJSHeapSize;
      
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        used: usedMemory,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
      
      // Check for memory issues
      if (usedMemory > this.thresholds.memoryUsage) {
        this.reportPerformanceIssue('high_memory_usage', { 
          used: usedMemory, 
          threshold: this.thresholds.memoryUsage 
        });
      }
    }, 5000); // Check every 5 seconds
    
    this.observers.set('memory', { interval });
  }

  /**
   * Monitor long tasks
   */
  monitorLongTasks() {
    if (!PerformanceObserver) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.reportPerformanceIssue('long_task', {
              duration: entry.duration,
              name: entry.name,
              startTime: entry.startTime
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', { observer });
    } catch (error) {
      console.warn('Long task monitoring not supported:', error);
    }
  }

  /**
   * Measure render time for a component
   */
  measureRenderTime(componentName, renderFunction) {
    const startTime = performance.now();
    
    try {
      const result = renderFunction();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      this.metrics.renderTimes.push({
        component: componentName,
        renderTime,
        timestamp: Date.now()
      });
      
      // Keep only last 100 measurements
      if (this.metrics.renderTimes.length > 100) {
        this.metrics.renderTimes.shift();
      }
      
      // Check for performance issues
      if (renderTime > this.thresholds.renderTime) {
        this.reportPerformanceIssue('slow_render', {
          component: componentName,
          renderTime,
          threshold: this.thresholds.renderTime
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error measuring render time for ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Measure drag operation performance
   */
  measureDragOperation(operation, startTime) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.metrics.dragOperations.push({
      operation,
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 100 measurements
    if (this.metrics.dragOperations.length > 100) {
      this.metrics.dragOperations.shift();
    }
    
    // Check for performance issues
    if (duration > this.thresholds.dragLatency) {
      this.reportPerformanceIssue('slow_drag', {
        operation,
        duration,
        threshold: this.thresholds.dragLatency
      });
    }
  }

  /**
   * Measure image load time
   */
  measureImageLoad(imageUrl, startTime) {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    this.metrics.imageLoadTimes.push({
      url: imageUrl,
      loadTime,
      timestamp: Date.now()
    });
    
    // Keep only last 100 measurements
    if (this.metrics.imageLoadTimes.length > 100) {
      this.metrics.imageLoadTimes.shift();
    }
    
    // Check for performance issues
    if (loadTime > 1000) { // Images taking longer than 1 second
      this.reportPerformanceIssue('slow_image_load', {
        url: imageUrl,
        loadTime
      });
    }
  }

  /**
   * Report performance issues
   */
  reportPerformanceIssue(type, data) {
    const issue = {
      type,
      data,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.warn('⚠️ Performance issue detected:', issue);
    
    // Could send to analytics service here
    this.sendToAnalytics(issue);
    
    // Emit custom event for other parts of the app
    window.dispatchEvent(new CustomEvent('performance-issue', { detail: issue }));
  }

  /**
   * Send performance data to analytics
   */
  sendToAnalytics(issue) {
    // Implementation depends on your analytics service
    // Example: Google Analytics, Sentry, etc.
    if (window.gtag) {
      window.gtag('event', 'performance_issue', {
        event_category: 'performance',
        event_label: issue.type,
        value: issue.data.renderTime || issue.data.duration || issue.data.loadTime
      });
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const now = Date.now();
    const timeRange = now - this.startTime;
    
    // Calculate averages
    const avgFrameRate = this.metrics.frameRates.length > 0
      ? this.metrics.frameRates.reduce((sum, m) => sum + m.fps, 0) / this.metrics.frameRates.length
      : 0;
    
    const avgRenderTime = this.metrics.renderTimes.length > 0
      ? this.metrics.renderTimes.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.renderTimes.length
      : 0;
    
    const avgDragTime = this.metrics.dragOperations.length > 0
      ? this.metrics.dragOperations.reduce((sum, m) => sum + m.duration, 0) / this.metrics.dragOperations.length
      : 0;
    
    const avgImageLoadTime = this.metrics.imageLoadTimes.length > 0
      ? this.metrics.imageLoadTimes.reduce((sum, m) => sum + m.loadTime, 0) / this.metrics.imageLoadTimes.length
      : 0;
    
    // Get current memory usage
    const currentMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    return {
      uptime: timeRange,
      averageFrameRate: Math.round(avgFrameRate),
      averageRenderTime: Math.round(avgRenderTime * 100) / 100,
      averageDragTime: Math.round(avgDragTime * 100) / 100,
      averageImageLoadTime: Math.round(avgImageLoadTime * 100) / 100,
      currentMemoryUsage: Math.round(currentMemory / 1024 / 1024 * 100) / 100,
      totalMeasurements: {
        frameRates: this.metrics.frameRates.length,
        renderTimes: this.metrics.renderTimes.length,
        dragOperations: this.metrics.dragOperations.length,
        imageLoadTimes: this.metrics.imageLoadTimes.length
      },
      performanceScore: this.calculatePerformanceScore()
    };
  }

  /**
   * Calculate overall performance score (0-100)
   */
  calculatePerformanceScore() {
    let score = 100;
    
    // Frame rate penalty
    const avgFPS = this.metrics.frameRates.length > 0
      ? this.metrics.frameRates.reduce((sum, m) => sum + m.fps, 0) / this.metrics.frameRates.length
      : 60;
    
    if (avgFPS < 30) score -= 30;
    else if (avgFPS < 45) score -= 15;
    else if (avgFPS < 55) score -= 5;
    
    // Render time penalty
    const avgRenderTime = this.metrics.renderTimes.length > 0
      ? this.metrics.renderTimes.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.renderTimes.length
      : 0;
    
    if (avgRenderTime > 33) score -= 25;
    else if (avgRenderTime > 16.67) score -= 10;
    
    // Memory usage penalty
    if (performance.memory) {
      const avgMemory = this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage.reduce((sum, m) => sum + m.used, 0) / this.metrics.memoryUsage.length
        : 0;
      
      if (avgMemory > 100 * 1024 * 1024) score -= 20; // 100MB
      else if (avgMemory > 50 * 1024 * 1024) score -= 10; // 50MB
    }
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions() {
    const suggestions = [];
    const summary = this.getPerformanceSummary();
    
    if (summary.averageFrameRate < 45) {
      suggestions.push({
        type: 'frame_rate',
        priority: 'high',
        message: 'Frame rate is below optimal. Consider reducing animation complexity or implementing virtual scrolling.',
        action: 'Review animation performance and implement performance optimizations'
      });
    }
    
    if (summary.averageRenderTime > 16.67) {
      suggestions.push({
        type: 'render_time',
        priority: 'medium',
        message: 'Component render times are slow. Consider memoization and reducing re-renders.',
        action: 'Implement React.memo, useMemo, and useCallback optimizations'
      });
    }
    
    if (summary.currentMemoryUsage > 50) {
      suggestions.push({
        type: 'memory_usage',
        priority: 'high',
        message: 'Memory usage is high. Check for memory leaks and implement cleanup.',
        action: 'Review component cleanup and implement proper unmounting'
      });
    }
    
    if (summary.averageImageLoadTime > 500) {
      suggestions.push({
        type: 'image_loading',
        priority: 'medium',
        message: 'Image loading is slow. Consider implementing lazy loading and compression.',
        action: 'Implement image optimization and lazy loading strategies'
      });
    }
    
    return suggestions;
  }

  /**
   * Export performance data
   */
  exportData() {
    return {
      metrics: this.metrics,
      summary: this.getPerformanceSummary(),
      suggestions: this.getOptimizationSuggestions(),
      exportTime: Date.now()
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = [];
    });
    this.startTime = performance.now();
    console.log('🧹 Performance metrics cleared');
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.start();
}

export default performanceMonitor;
