/**
 * Enhanced Image Optimization Utilities
 * Advanced image compression, lazy loading, and performance optimization
 * with WebP support, progressive loading, and memory management
 */

// Enhanced compression settings with WebP support
const COMPRESSION_SETTINGS = {
  maxWidth: 1200,
  maxHeight: 800,
  quality: 0.8,
  format: 'webp',
  progressive: true,
  optimizeMemory: true
};

// WebP support detection
const isWebPSupported = (() => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
})();

/**
 * Enhanced image compression with multiple format support
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - Compressed image blob
 */
export const compressImage = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      img.onload = () => {
        try {
          const { maxWidth, maxHeight, quality, format, progressive } = { 
            ...COMPRESSION_SETTINGS, 
            ...options 
          };
          
          let { width, height } = img;
          
          // Calculate new dimensions maintaining aspect ratio
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Progressive rendering for better perceived performance
          if (progressive) {
            // Draw with lower quality first
            ctx.globalAlpha = 0.5;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Then draw with full quality
            setTimeout(() => {
              ctx.globalAlpha = 1.0;
              ctx.drawImage(img, 0, 0, width, height);
              finalizeCompression();
            }, 50);
          } else {
            ctx.drawImage(img, 0, 0, width, height);
            finalizeCompression();
          }
          
          function finalizeCompression() {
            // Choose best format based on support and quality
            const finalFormat = isWebPSupported && format === 'webp' ? 'image/webp' : 'image/jpeg';
            const finalQuality = finalFormat === 'image/webp' ? quality : Math.min(quality * 0.9, 0.9);
            
            canvas.toBlob(
              (blob) => {
                // Clean up memory
                canvas.width = 0;
                canvas.height = 0;
                URL.revokeObjectURL(img.src);
                resolve(blob);
              },
              finalFormat,
              finalQuality
            );
          }
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      
      // Use createImageBitmap for better performance if available
      if (window.createImageBitmap) {
        createImageBitmap(file)
          .then(bitmap => {
            img.src = bitmap;
          })
          .catch(() => {
            img.src = URL.createObjectURL(file);
          });
      } else {
        img.src = URL.createObjectURL(file);
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Advanced lazy loading with intersection observer and progressive loading
 * @param {string} src - Image source
 * @param {string} alt - Alt text
 * @param {Object} options - Lazy loading options
 * @returns {HTMLImageElement} - Optimized image element
 */
export const createLazyImage = (src, alt, options = {}) => {
  const {
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
    threshold = 0.1,
    rootMargin = '50px',
    progressive = true,
    quality = 'auto'
  } = options;
  
  const img = document.createElement('img');
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.crossOrigin = 'anonymous';
  
  // Set placeholder
  img.src = placeholder;
  img.classList.add('lazy-image');
  
  // Progressive loading with multiple quality levels
  if (progressive && quality === 'auto') {
    // Create multiple image sources for progressive loading
    const imgSources = [
      { src: placeholder, quality: 'placeholder' },
      { src: src.replace(/\.[^/.]+$/, '_thumb.$&'), quality: 'thumbnail' },
      { src: src, quality: 'full' }
    ];
    
    let currentQualityIndex = 0;
    
    const loadNextQuality = () => {
      if (currentQualityIndex < imgSources.length) {
        const source = imgSources[currentQualityIndex];
        if (source.quality === 'placeholder') {
          currentQualityIndex++;
          loadNextQuality();
        } else {
          img.src = source.src;
          currentQualityIndex++;
        }
      }
    };
    
    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadNextQuality();
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin,
      threshold
    });
    
    observer.observe(img);
    
    // Load full quality image after thumbnail
    img.onload = () => {
      if (currentQualityIndex === 2) { // thumbnail loaded
        setTimeout(() => {
          img.src = src;
          img.classList.add('loaded');
        }, 100);
      }
    };
  } else {
    // Simple lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin,
      threshold
    });
    
    observer.observe(img);
  }
  
  return img;
};

/**
 * Enhanced thumbnail generation with multiple sizes
 * @param {string} base64Data - Base64 image data
 * @param {Object} options - Thumbnail options
 * @returns {Promise<Object>} - Object with different thumbnail sizes
 */
export const generateThumbnails = async (base64Data, options = {}) => {
  const {
    sizes = [50, 100, 150, 200],
    format = 'webp',
    quality = 0.7
  } = options;
  
  const thumbnails = {};
  
  try {
    for (const size of sizes) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const { width, height } = img;
          
          // Calculate thumbnail dimensions
          let thumbWidth, thumbHeight;
          
          if (width > height) {
            thumbWidth = size;
            thumbHeight = (height * size) / width;
          } else {
            thumbHeight = size;
            thumbWidth = (width * size) / height;
          }
          
          canvas.width = thumbWidth;
          canvas.height = thumbHeight;
          
          // Enable smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw thumbnail
          ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
          
          // Convert to specified format
          const finalFormat = isWebPSupported && format === 'webp' ? 'image/webp' : 'image/jpeg';
          const finalQuality = finalFormat === 'image/webp' ? quality : Math.min(quality * 0.9, 0.9);
          
          const thumbnail = canvas.toDataURL(finalFormat, finalQuality);
          thumbnails[`${size}x${size}`] = thumbnail;
          
          // Clean up
          canvas.width = 0;
          canvas.height = 0;
          resolve();
        };
        
        img.onerror = reject;
        img.src = base64Data;
      });
    }
    
    return thumbnails;
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    throw error;
  }
};

/**
 * Memory-efficient image preloading with priority queue
 * @param {Array<string>} imageUrls - Array of image URLs to preload
 * @param {Object} options - Preloading options
 * @returns {Promise<Object>} - Preloading results
 */
export const preloadImages = async (imageUrls, options = {}) => {
  const {
    maxConcurrent = 3,
    priority = 'high',
    timeout = 10000
  } = options;
  
  const results = {
    loaded: [],
    failed: [],
    total: imageUrls.length
  };
  
  // Priority queue for image loading
  const queue = [...imageUrls];
  const active = new Set();
  
  const loadImage = async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        priority: priority === 'high' ? 'high' : 'low'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      // Create blob URL for caching
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      results.loaded.push({ url, blobUrl, size: blob.size });
      return blobUrl;
    } catch (error) {
      results.failed.push({ url, error: error.message });
      throw error;
    }
  };
  
  // Process queue with concurrency limit
  const processQueue = async () => {
    while (queue.length > 0 && active.size < maxConcurrent) {
      const url = queue.shift();
      active.add(url);
      
      loadImage(url)
        .finally(() => {
          active.delete(url);
          if (queue.length > 0) {
            processQueue();
          }
        });
    }
  };
  
  // Start processing
  await processQueue();
  
  // Wait for all active requests to complete
  while (active.size > 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

/**
 * Enhanced debounce with immediate execution option
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {Object} options - Debounce options
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait, options = {}) => {
  const { leading = false, trailing = true } = options;
  let timeout;
  let lastCallTime;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (trailing && lastCallTime !== undefined) {
        func.apply(this, args);
        lastCallTime = undefined;
      }
    };
    
    const callNow = leading && !timeout;
    
    clearTimeout(timeout);
    lastCallTime = Date.now();
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func.apply(this, args);
    }
  };
};

/**
 * Enhanced throttle with leading and trailing options
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @param {Object} options - Throttle options
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit, options = {}) => {
  const { leading = true, trailing = true } = options;
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      if (leading) {
        func.apply(this, args);
        lastRan = Date.now();
      }
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (trailing && lastFunc) {
          func.apply(this, lastFunc);
          lastFunc = null;
        }
      }, limit - (Date.now() - lastRan));
    } else if (trailing) {
      lastFunc = args;
    }
  };
};

/**
 * Virtual scrolling with dynamic item heights
 * @param {Array} items - Array of items
 * @param {Object} options - Virtual scrolling options
 * @returns {Object} - Virtual scrolling state and methods
 */
export const createVirtualScroller = (items, options = {}) => {
  const {
    itemHeight = 100,
    containerHeight = 600,
    overscan = 5,
    dynamicHeight = false
  } = options;
  
  let scrollTop = 0;
  let itemHeights = dynamicHeight ? new Map() : null;
  
  const getVisibleRange = () => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
      visibleItems: items.slice(
        Math.max(0, startIndex - overscan),
        endIndex
      ),
      offsetY: Math.max(0, startIndex - overscan) * itemHeight
    };
  };
  
  const updateScrollPosition = (newScrollTop) => {
    scrollTop = newScrollTop;
  };
  
  const updateItemHeight = (index, height) => {
    if (dynamicHeight && itemHeights) {
      itemHeights.set(index, height);
    }
  };
  
  const getTotalHeight = () => {
    if (dynamicHeight && itemHeights) {
      return Array.from(itemHeights.values()).reduce((sum, height) => sum + height, 0);
    }
    return items.length * itemHeight;
  };
  
  return {
    getVisibleRange,
    updateScrollPosition,
    updateItemHeight,
    getTotalHeight,
    scrollTop: () => scrollTop
  };
};

/**
 * Image cache management with LRU eviction
 */
class ImageCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

// Export cache instance
export const imageCache = new ImageCache();

// Export all utilities
export default {
  compressImage,
  createLazyImage,
  generateThumbnails,
  preloadImages,
  debounce,
  throttle,
  createVirtualScroller,
  imageCache,
  isWebPSupported
};
