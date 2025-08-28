/**
 * Advanced Caching System for Sandpack Templates and Form Components
 * 
 * Implements intelligent caching strategies to optimize loading times and reduce
 * bundle size for Formedible form previews.
 */

import { SandpackFiles } from "@codesandbox/sandpack-react";

// Cache configuration
interface CacheConfig {
  maxSize: number;
  maxAge: number; // in milliseconds
  compressionEnabled: boolean;
  persistToStorage: boolean;
}

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  size: number;
  compressed?: boolean;
  hash: string;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
}

// Template metadata for intelligent caching
interface TemplateMetadata {
  complexity: 'basic' | 'intermediate' | 'advanced';
  features: string[];
  dependencies: string[];
  formFieldCount: number;
  hasConditionalLogic: boolean;
  hasMultiPage: boolean;
  codeLength: number;
}

/**
 * Intelligent LRU Cache with compression and persistence
 */
class IntelligentCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0,
    hitRate: 0
  };

  constructor(private config: CacheConfig) {}

  /**
   * Generate hash for cache key
   */
  private generateHash(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Calculate approximate size of data
   */
  private calculateSize(data: T): number {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16 encoding
    }
    if (data && typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    return 50; // Default size estimate
  }

  /**
   * Compress data if enabled
   */
  private async compressData(data: T): Promise<T> {
    if (!this.config.compressionEnabled) return data;
    
    try {
      // Simple compression using JSON stringification optimization
      if (typeof data === 'object') {
        const jsonString = JSON.stringify(data);
        // Remove unnecessary whitespace and optimize structure
        const optimized = jsonString.replace(/\s+/g, ' ').trim();
        return JSON.parse(optimized) as T;
      }
      return data;
    } catch {
      return data;
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.config.maxAge;
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    if (this.cache.size <= this.config.maxSize) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    const evictCount = Math.ceil(this.cache.size * 0.1); // Evict 10%
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      const [key, entry] = entries[i];
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.evictions++;
    }
    
    this.stats.entryCount = this.cache.size;
  }

  /**
   * Set cache entry
   */
  async set(key: string, data: T, metadata?: TemplateMetadata): Promise<void> {
    const hash = this.generateHash(key);
    const compressed = await this.compressData(data);
    const size = this.calculateSize(compressed);
    
    const entry: CacheEntry<T> = {
      data: compressed,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now(),
      size,
      compressed: this.config.compressionEnabled,
      hash
    };

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.stats.totalSize -= existing.size;
    }

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.entryCount = this.cache.size;

    // Evict if necessary
    this.evictLRU();

    // Persist to storage if enabled
    if (this.config.persistToStorage) {
      this.persistToStorage(key, entry);
    }
  }

  /**
   * Get cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.entryCount = this.cache.size;
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    let clearedCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxAge) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
        clearedCount++;
      }
    }
    
    this.stats.entryCount = this.cache.size;
    return clearedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0
    };
  }

  /**
   * Persist to localStorage (if available)
   */
  private persistToStorage(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    try {
      const storageKey = `sandpack_cache_${key}`;
      const storageData = {
        ...entry,
        data: typeof entry.data === 'object' ? JSON.stringify(entry.data) : entry.data
      };
      
      localStorage.setItem(storageKey, JSON.stringify(storageData));
    } catch (error) {
      console.warn('Failed to persist cache to localStorage:', error);
    }
  }

  /**
   * Load from localStorage (if available)
   */
  loadFromStorage(key: string): T | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    try {
      const storageKey = `sandpack_cache_${key}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) return null;
      
      const storageData = JSON.parse(stored);
      
      // Check expiration
      if (Date.now() - storageData.timestamp > this.config.maxAge) {
        localStorage.removeItem(storageKey);
        return null;
      }
      
      // Parse data back if it was stringified
      const data = typeof storageData.data === 'string' && storageData.data.startsWith('{') 
        ? JSON.parse(storageData.data) 
        : storageData.data;
      
      // Add back to memory cache
      this.cache.set(key, storageData);
      this.stats.totalSize += storageData.size;
      this.stats.entryCount = this.cache.size;
      
      return data;
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
      return null;
    }
  }
}

// Global cache instances
const templateCache = new IntelligentCache<SandpackFiles>({
  maxSize: 50,
  maxAge: 30 * 60 * 1000, // 30 minutes
  compressionEnabled: true,
  persistToStorage: true
});

const formCodeCache = new IntelligentCache<string>({
  maxSize: 100,
  maxAge: 10 * 60 * 1000, // 10 minutes
  compressionEnabled: true,
  persistToStorage: false
});

const metadataCache = new IntelligentCache<TemplateMetadata>({
  maxSize: 200,
  maxAge: 60 * 60 * 1000, // 1 hour
  compressionEnabled: false,
  persistToStorage: true
});

/**
 * Generate intelligent cache key based on form characteristics
 */
export function generateCacheKey(
  formCode: string, 
  options: {
    showCodeEditor?: boolean;
    showConsole?: boolean;
    showFileExplorer?: boolean;
    templateComplexity?: string;
    formConfig?: any;
  } = {}
): string {
  // Create a signature based on content and options
  const contentHash = hashString(formCode.substring(0, 200));
  const optionsHash = hashString(JSON.stringify(options));
  
  return `${contentHash}-${optionsHash}`;
}

/**
 * Simple string hashing function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract template metadata from form code
 */
export function extractTemplateMetadata(formCode: string): TemplateMetadata {
  const features: string[] = [];
  const dependencies: string[] = [];
  
  // Analyze code for features
  if (formCode.includes('useState')) features.push('state-management');
  if (formCode.includes('useEffect')) features.push('lifecycle');
  if (formCode.includes('conditional')) features.push('conditional-logic');
  if (formCode.includes('multi-page') || formCode.includes('step')) features.push('multi-page');
  if (formCode.includes('validation')) features.push('validation');
  
  // Extract dependencies
  const importMatches = formCode.match(/import\s+.*from\s+['"]([^'"]*)['"]/g);
  if (importMatches) {
    dependencies.push(...importMatches.map(match => {
      const depMatch = match.match(/from\s+['"]([^'"]*)['"]/);
      return depMatch ? depMatch[1] : '';
    }).filter(Boolean));
  }
  
  // Count form fields (rough estimate)
  const fieldCount = (formCode.match(/input|select|textarea/gi) || []).length;
  
  return {
    complexity: fieldCount > 10 ? 'advanced' : fieldCount > 5 ? 'intermediate' : 'basic',
    features,
    dependencies,
    formFieldCount: fieldCount,
    hasConditionalLogic: features.includes('conditional-logic'),
    hasMultiPage: features.includes('multi-page'),
    codeLength: formCode.length
  };
}

/**
 * Cached template retrieval
 */
export async function getCachedTemplate(cacheKey: string): Promise<SandpackFiles | null> {
  // Try memory cache first
  let cached = templateCache.get(cacheKey);
  
  // Try storage cache if not in memory
  if (!cached) {
    cached = templateCache.loadFromStorage(cacheKey);
  }
  
  return cached;
}

/**
 * Cache template with metadata
 */
export async function setCachedTemplate(
  cacheKey: string, 
  template: SandpackFiles, 
  formCode: string
): Promise<void> {
  const metadata = extractTemplateMetadata(formCode);
  
  await Promise.all([
    templateCache.set(cacheKey, template, metadata),
    metadataCache.set(cacheKey, metadata)
  ]);
}

/**
 * Cached form code retrieval
 */
export function getCachedFormCode(cacheKey: string): string | null {
  return formCodeCache.get(cacheKey);
}

/**
 * Cache form code
 */
export async function setCachedFormCode(cacheKey: string, formCode: string): Promise<void> {
  await formCodeCache.set(cacheKey, formCode);
}

/**
 * Preload popular templates
 */
export async function preloadPopularTemplates(): Promise<void> {
  const popularTemplates = [
    { complexity: 'basic', features: [] },
    { complexity: 'intermediate', features: ['validation'] },
    { complexity: 'advanced', features: ['multi-page', 'conditional-logic'] }
  ];
  
  // This would integrate with the template generation system
  // Implementation depends on the actual template creation logic
  console.log('Preloading popular templates:', popularTemplates);
}

/**
 * Clean up expired cache entries
 */
export function cleanupCache(): void {
  const expired = templateCache.clearExpired() + 
                 formCodeCache.clearExpired() + 
                 metadataCache.clearExpired();
  
  console.log(`Cleaned up ${expired} expired cache entries`);
}

/**
 * Get comprehensive cache statistics
 */
export function getCacheStatistics() {
  return {
    templates: templateCache.getStats(),
    formCode: formCodeCache.getStats(),
    metadata: metadataCache.getStats(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  templateCache.clear();
  formCodeCache.clear();
  metadataCache.clear();
}

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 5 * 60 * 1000);
}

// Export cache instances for advanced usage
export { templateCache, formCodeCache, metadataCache };