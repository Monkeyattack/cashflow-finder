import Redis from 'ioredis';
import { BusinessListing, SearchQuery } from '../../types';

class CacheService {
  private redis: Redis;
  private readonly CACHE_TTL = {
    BUSINESS_METADATA: 7 * 24 * 60 * 60, // 7 days for business data
    SEARCH_RESULTS: 1 * 60 * 60, // 1 hour for search results
    USER_SEARCHES: 24 * 60 * 60, // 24 hours for user search history
    RATE_LIMIT: 60 * 60, // 1 hour for rate limiting
  };

  constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // GCP Memorystore doesn't require auth by default
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD })
    };

    this.redis = new Redis(redisConfig);

    this.redis.on('connect', () => {
      console.log('✅ Connected to Redis cache');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });
  }

  // Business metadata caching
  async cacheBusinessData(businessId: string, data: BusinessListing): Promise<void> {
    try {
      const key = `business:${businessId}`;
      await this.redis.setex(key, this.CACHE_TTL.BUSINESS_METADATA, JSON.stringify(data));
      
      // Also cache by domain for quick lookups
      if (data.website) {
        const domain = new URL(data.website).hostname;
        await this.redis.setex(`business:domain:${domain}`, this.CACHE_TTL.BUSINESS_METADATA, businessId);
      }
    } catch (error) {
      console.error('Error caching business data:', error);
    }
  }

  async getBusinessData(businessId: string): Promise<BusinessListing | null> {
    try {
      const key = `business:${businessId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error retrieving cached business data:', error);
      return null;
    }
  }

  async getBusinessByDomain(domain: string): Promise<BusinessListing | null> {
    try {
      const businessId = await this.redis.get(`business:domain:${domain}`);
      if (!businessId) return null;
      
      return await this.getBusinessData(businessId);
    } catch (error) {
      console.error('Error retrieving business by domain:', error);
      return null;
    }
  }

  // Search results caching
  async cacheSearchResults(query: SearchQuery, results: BusinessListing[]): Promise<void> {
    try {
      const queryHash = this.generateQueryHash(query);
      const key = `search:${queryHash}`;
      
      const cacheData = {
        query,
        results,
        timestamp: Date.now(),
        count: results.length
      };
      
      await this.redis.setex(key, this.CACHE_TTL.SEARCH_RESULTS, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching search results:', error);
    }
  }

  async getCachedSearchResults(query: SearchQuery): Promise<BusinessListing[] | null> {
    try {
      const queryHash = this.generateQueryHash(query);
      const key = `search:${queryHash}`;
      const cached = await this.redis.get(key);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      return data.results;
    } catch (error) {
      console.error('Error retrieving cached search results:', error);
      return null;
    }
  }

  // User search history caching
  async cacheUserSearch(userId: string, query: SearchQuery): Promise<void> {
    try {
      const key = `user:${userId}:searches`;
      const searchData = {
        query,
        timestamp: Date.now()
      };
      
      // Add to user's recent searches (keep last 20)
      await this.redis.lpush(key, JSON.stringify(searchData));
      await this.redis.ltrim(key, 0, 19);
      await this.redis.expire(key, this.CACHE_TTL.USER_SEARCHES);
    } catch (error) {
      console.error('Error caching user search:', error);
    }
  }

  async getUserSearchHistory(userId: string): Promise<SearchQuery[]> {
    try {
      const key = `user:${userId}:searches`;
      const searches = await this.redis.lrange(key, 0, 9); // Get last 10 searches
      
      return searches.map(search => {
        const data = JSON.parse(search);
        return data.query;
      });
    } catch (error) {
      console.error('Error retrieving user search history:', error);
      return [];
    }
  }

  // Rate limiting
  async checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const rateLimitKey = `ratelimit:${key}`;
      const current = await this.redis.incr(rateLimitKey);
      
      if (current === 1) {
        await this.redis.expire(rateLimitKey, windowSeconds);
      }
      
      const ttl = await this.redis.ttl(rateLimitKey);
      const resetTime = Date.now() + (ttl * 1000);
      
      return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetTime
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Fail open - allow request if cache is down
      return { allowed: true, remaining: maxRequests, resetTime: Date.now() + windowSeconds * 1000 };
    }
  }

  // Business intelligence caching
  async cacheIndustryData(industry: string, data: any): Promise<void> {
    try {
      const key = `industry:${industry.toLowerCase()}`;
      await this.redis.setex(key, this.CACHE_TTL.BUSINESS_METADATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching industry data:', error);
    }
  }

  async getIndustryData(industry: string): Promise<any | null> {
    try {
      const key = `industry:${industry.toLowerCase()}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error retrieving industry data:', error);
      return null;
    }
  }

  // Analytics caching
  async incrementCounter(key: string, expireSeconds?: number): Promise<number> {
    try {
      const count = await this.redis.incr(`counter:${key}`);
      if (expireSeconds && count === 1) {
        await this.redis.expire(`counter:${key}`, expireSeconds);
      }
      return count;
    } catch (error) {
      console.error('Error incrementing counter:', error);
      return 0;
    }
  }

  async getCounter(key: string): Promise<number> {
    try {
      const count = await this.redis.get(`counter:${key}`);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error getting counter:', error);
      return 0;
    }
  }

  // Utility methods
  private generateQueryHash(query: SearchQuery): string {
    const queryString = JSON.stringify({
      ...query,
      // Remove timestamp fields that shouldn't affect cache key
      timestamp: undefined
    });
    
    return Buffer.from(queryString).toString('base64').substring(0, 32);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  // Clear cache (for admin use)
  async clearCache(pattern?: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern || '*');
      if (keys.length === 0) return 0;
      
      return await this.redis.del(...keys);
    } catch (error) {
      console.error('Error clearing cache:', error);
      return 0;
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: await this.healthCheck()
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;