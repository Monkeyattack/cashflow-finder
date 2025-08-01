import axios, { AxiosRequestConfig } from 'axios';
import { BusinessListing } from '../../types';

interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

interface ScrapingConfig {
  useProxies: boolean;
  proxies?: ProxyConfig[];
  delayBetweenRequests: number;
  maxRetries: number;
  userAgents: string[];
}

export class CraigslistScraper {
  private config: ScrapingConfig;
  private currentProxyIndex = 0;
  private currentUserAgentIndex = 0;

  constructor() {
    this.config = {
      useProxies: process.env.USE_PROXIES === 'true',
      proxies: this.parseProxies(),
      delayBetweenRequests: parseInt(process.env.SCRAPING_DELAY || '3000'), // 3 seconds default
      maxRetries: 3,
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
      ]
    };
  }

  private parseProxies(): ProxyConfig[] {
    const proxyString = process.env.PROXY_LIST;
    if (!proxyString) return [];

    // Format: "host1:port1:user1:pass1,host2:port2:user2:pass2"
    return proxyString.split(',').map(proxy => {
      const [host, port, username, password] = proxy.split(':');
      return {
        host,
        port: parseInt(port),
        auth: username && password ? { username, password } : undefined
      };
    });
  }

  private getRandomUserAgent(): string {
    const agent = this.config.userAgents[this.currentUserAgentIndex];
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.config.userAgents.length;
    return agent;
  }

  private getNextProxy(): ProxyConfig | undefined {
    if (!this.config.useProxies || !this.config.proxies?.length) {
      return undefined;
    }

    const proxy = this.config.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.config.proxies.length;
    return proxy;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(url: string): Promise<string> {
    const proxy = this.getNextProxy();
    const userAgent = this.getRandomUserAgent();

    const config: AxiosRequestConfig = {
      timeout: 10000,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0'
      }
    };

    if (proxy) {
      config.proxy = {
        host: proxy.host,
        port: proxy.port,
        auth: proxy.auth
      };
      console.log(`Using proxy: ${proxy.host}:${proxy.port}`);
    }

    let lastError: any;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1}/${this.config.maxRetries} for ${url}`);
        
        const response = await axios.get(url, config);
        
        // Check if we got blocked (common Craigslist responses)
        if (response.data.includes('blocked') || 
            response.data.includes('unusual traffic') ||
            response.status === 403) {
          throw new Error('Request blocked by Craigslist');
        }

        return response.data;
        
      } catch (error: any) {
        lastError = error;
        console.log(`Attempt ${attempt + 1} failed:`, error.message);
        
        // If using proxies and got blocked, try next proxy
        if (this.config.useProxies && attempt < this.config.maxRetries - 1) {
          const nextProxy = this.getNextProxy();
          if (nextProxy) {
            config.proxy = {
              host: nextProxy.host,
              port: nextProxy.port,
              auth: nextProxy.auth
            };
          }
        }
        
        // Wait before retry
        await this.delay(this.config.delayBetweenRequests * (attempt + 1));
      }
    }

    throw lastError;
  }

  async scrapeBusinessListings(city: string): Promise<BusinessListing[]> {
    console.log(`🔍 Scraping Craigslist ${city} for business listings...`);
    
    if (!this.config.useProxies) {
      console.log('⚠️  WARNING: Scraping without proxies - you may get blocked quickly');
      console.log('💡 Set USE_PROXIES=true and PROXY_LIST environment variables for production');
    }

    const baseUrl = `https://${city}.craigslist.org`;
    const businessUrl = `${baseUrl}/search/bfs`; // Business for sale section

    try {
      // Add delay before request
      await this.delay(this.config.delayBetweenRequests);
      
      const html = await this.makeRequest(businessUrl);
      
      // Parse HTML to extract business listings
      // Note: In production, you'd use a proper HTML parser like Cheerio
      const listings = this.parseListingsFromHtml(html, baseUrl, city);
      
      console.log(`✅ Found ${listings.length} business listings in ${city}`);
      return listings;
      
    } catch (error: any) {
      console.error(`❌ Error scraping ${city}:`, error.message);
      
      // Return mock data if scraping fails (for development)
      return this.getMockListings(city);
    }
  }

  private parseListingsFromHtml(html: string, baseUrl: string, city: string): BusinessListing[] {
    // Mock parser - in production, implement actual HTML parsing
    console.log('📝 Parsing HTML (mock implementation)');
    
    // This would use Cheerio or similar to parse actual HTML:
    // const $ = cheerio.load(html);
    // const listings = $('.result-row').map((i, el) => { ... }).get();
    
    return this.getMockListings(city);
  }

  private getMockListings(city: string): BusinessListing[] {
    // Return mock data that represents what would be scraped
    return [
      {
        id: `cl_${city}_${Date.now()}_1`,
        name: `Local Restaurant (${city})`,
        industry: 'Food & Beverage',
        location: {
          city: city.charAt(0).toUpperCase() + city.slice(1),
          state: 'XX', // Would be parsed from actual listings
          country: 'USA'
        },
        financial_data: {
          asking_price: 125000,
          annual_revenue: 350000,
          year_established: 2018
        },
        contact_info: {
          listing_url: `https://${city}.craigslist.org/bfs/123456.html`,
          broker_phone: '(555) 123-4567'
        },
        quality_score: 50, // Lower quality due to limited verification
        risk_score: 75, // Higher risk, local businesses
        data_sources: ['Craigslist'],
        last_updated: new Date(),
        created_at: new Date()
      },
      {
        id: `cl_${city}_${Date.now()}_2`,
        name: `Service Business (${city})`,
        industry: 'Professional Services',
        location: {
          city: city.charAt(0).toUpperCase() + city.slice(1),
          state: 'XX',
          country: 'USA'
        },
        financial_data: {
          asking_price: 85000,
          annual_revenue: 180000,
          cash_flow: 45000,
          year_established: 2020
        },
        contact_info: {
          listing_url: `https://${city}.craigslist.org/bfs/234567.html`,
          broker_phone: '(555) 234-5678'
        },
        quality_score: 50, // Lower quality due to limited verification
        risk_score: 75, // Higher risk, local businesses
        data_sources: ['Craigslist'],
        last_updated: new Date(),
        created_at: new Date()
      }
    ];
  }

  // Scrape multiple cities
  async scrapeMultipleCities(cities: string[]): Promise<BusinessListing[]> {
    const allListings: BusinessListing[] = [];
    
    for (const city of cities) {
      try {
        const listings = await this.scrapeBusinessListings(city);
        allListings.push(...listings);
        
        // Delay between cities to be respectful
        await this.delay(this.config.delayBetweenRequests * 2);
        
      } catch (error) {
        console.error(`Failed to scrape ${city}:`, error);
        continue;
      }
    }
    
    return allListings;
  }
}

// Proxy service recommendations and setup
export const PROXY_SERVICES = {
  budget: {
    name: 'ProxyMesh',
    cost: '$10/month',
    ips: '10 rotating',
    setup: 'PROXY_LIST=proxy.proxymesh.com:31280:username:password'
  },
  mid_tier: {
    name: 'Smartproxy',
    cost: '$75/month', 
    ips: '10GB residential',
    setup: 'PROXY_LIST=gate.smartproxy.com:10000:username:password'
  },
  premium: {
    name: 'Bright Data',
    cost: '$500/month',
    ips: '40M+ residential',
    setup: 'PROXY_LIST=zproxy.lum-superproxy.io:22225:customer-username:password'
  },
  diy: {
    name: 'Multiple VPS',
    cost: '$25/month (5 servers)',
    ips: '5 dedicated IPs',
    setup: 'PROXY_LIST=vps1.com:3128:,vps2.com:3128:,vps3.com:3128:'
  }
};

export const craigslistScraper = new CraigslistScraper();