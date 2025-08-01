import axios from 'axios';
// import * as cheerio from 'cheerio'; // TODO: Install cheerio for web scraping
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Database connection
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'cashflow_finder',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'AirpUgWN33IcU93D'
});

interface BusinessListing {
  source: string;
  external_id: string;
  name: string;
  industry: string;
  location: {
    address?: string;
    city: string;
    state: string;
    zip?: string;
    country?: string;
  };
  financial_data: {
    asking_price: number;
    annual_revenue?: number;
    cash_flow?: number;
    gross_profit_margin?: number;
    established_year?: number;
    employees?: number;
    asking_multiple?: number;
    monthly_profit?: number;
  };
  contact_info: {
    broker_name?: string;
    broker_email?: string;
    broker_phone?: string;
    listing_url?: string;
    description?: string;
    seller_financing?: boolean;
  };
  additional_data?: {
    website_included?: boolean;
    training_included?: boolean;
    reason_for_sale?: string;
    tech_stack?: string[];
    traffic_stats?: any;
    social_following?: any;
  };
}

export class MultiSourceImporter {

  // Flippa API Integration (Digital Businesses)
  async fetchFromFlippa(filters: any = {}): Promise<BusinessListing[]> {
    console.log('🌐 Fetching from Flippa...');
    
    try {
      // Mock Flippa API data - replace with real API when available
      const mockFlippaListings: BusinessListing[] = [
        {
          source: 'Flippa',
          external_id: 'flippa_456789',
          name: 'E-commerce Pet Supplies Store',
          industry: 'E-commerce',
          location: {
            city: 'Remote',
            state: 'CA',
            country: 'USA'
          },
          financial_data: {
            asking_price: 125000,
            annual_revenue: 180000,
            monthly_profit: 8500,
            asking_multiple: 1.2,
            established_year: 2019
          },
          contact_info: {
            listing_url: 'https://flippa.com/listing/456789',
            description: 'Profitable Shopify store selling premium pet supplies. Automated dropshipping model with 4,000+ monthly visitors. Includes trained VA team and supplier relationships.',
            seller_financing: true
          },
          additional_data: {
            website_included: true,
            training_included: true,
            reason_for_sale: 'Moving to new venture',
            tech_stack: ['Shopify', 'Google Ads', 'Facebook Ads', 'Klaviyo'],
            traffic_stats: {
              monthly_visitors: 4200,
              bounce_rate: 0.45,
              conversion_rate: 0.032
            },
            social_following: {
              instagram: 12500,
              facebook: 8300
            }
          }
        },
        {
          source: 'Flippa',
          external_id: 'flippa_789012',
          name: 'SaaS Project Management Tool',
          industry: 'Technology',
          location: {
            city: 'Remote',
            state: 'NY',
            country: 'USA'
          },
          financial_data: {
            asking_price: 380000,
            annual_revenue: 240000,
            monthly_profit: 15000,
            asking_multiple: 1.9,
            established_year: 2020
          },
          contact_info: {
            listing_url: 'https://flippa.com/listing/789012',
            description: 'B2B SaaS platform for team project management. 150+ paying customers, high retention rate. Built on modern tech stack with room for expansion.',
            seller_financing: false
          },
          additional_data: {
            website_included: true,
            training_included: true,
            reason_for_sale: 'Focusing on other projects',
            tech_stack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
            traffic_stats: {
              monthly_visitors: 8500,
              signup_conversion: 0.12
            }
          }
        }
      ];

      return mockFlippaListings;
    } catch (error: any) {
      console.error('Flippa fetch error:', error.message);
      return [];
    }
  }

  // Crexi Commercial Real Estate Scraper
  async fetchFromCrexi(filters: any = {}): Promise<BusinessListing[]> {
    console.log('🏢 Fetching from Crexi...');
    
    try {
      // Mock Crexi data - replace with actual scraping
      const mockCrexiListings: BusinessListing[] = [
        {
          source: 'Crexi',
          external_id: 'crexi_987654',
          name: 'Downtown Restaurant & Bar',
          industry: 'Food & Beverage',
          location: {
            address: '456 Main Street',
            city: 'Dallas',
            state: 'TX',
            zip: '75201',
            country: 'USA'
          },
          financial_data: {
            asking_price: 1250000,
            annual_revenue: 1800000,
            cash_flow: 285000,
            established_year: 2015,
            employees: 25
          },
          contact_info: {
            broker_name: 'Commercial Realty Group',
            broker_email: 'info@crg-dallas.com',
            broker_phone: '(214) 555-0789',
            listing_url: 'https://crexi.com/listing/987654',
            description: 'Turn-key restaurant and bar in prime downtown location. Full kitchen, 120 seats, liquor license included. Established customer base and catering business.'
          }
        },
        {
          source: 'Crexi',
          external_id: 'crexi_654321',
          name: 'Medical Office Building',
          industry: 'Healthcare Real Estate',
          location: {
            address: '789 Medical Center Drive',
            city: 'Phoenix',
            state: 'AZ',
            zip: '85001',
            country: 'USA'
          },
          financial_data: {
            asking_price: 2500000,
            annual_revenue: 450000,
            cash_flow: 385000,
            established_year: 2008
          },
          contact_info: {
            broker_name: 'Phoenix Commercial Properties',
            broker_email: 'sales@phoenixcommercial.com',
            broker_phone: '(602) 555-0456',
            listing_url: 'https://crexi.com/listing/654321',
            description: '15,000 sq ft medical office building. Fully leased to established medical practices. Triple net lease structure with annual escalations.'
          }
        }
      ];

      return mockCrexiListings;
    } catch (error: any) {
      console.error('Crexi fetch error:', error.message);
      return [];
    }
  }

  // Acquire.com Startup Acquisition Scraper
  async fetchFromAcquire(filters: any = {}): Promise<BusinessListing[]> {
    console.log('🚀 Fetching from Acquire.com...');
    
    try {
      // Mock Acquire.com data
      const mockAcquireListings: BusinessListing[] = [
        {
          source: 'Acquire',
          external_id: 'acquire_111222',
          name: 'AI Content Generation Startup',
          industry: 'Technology',
          location: {
            city: 'San Francisco',
            state: 'CA',
            country: 'USA'
          },
          financial_data: {
            asking_price: 750000,
            annual_revenue: 350000,
            monthly_profit: 18000,
            established_year: 2021,
            employees: 4
          },
          contact_info: {
            listing_url: 'https://acquire.com/listing/111222',
            description: 'AI-powered content generation platform for marketers. Growing customer base, profitable, and fully remote team. Strong technology moat with proprietary algorithms.',
            seller_financing: true
          },
          additional_data: {
            website_included: true,
            training_included: true,
            reason_for_sale: 'Founder moving to larger opportunity',
            tech_stack: ['Python', 'TensorFlow', 'React', 'AWS', 'Stripe'],
            traffic_stats: {
              monthly_visitors: 15000,
              trial_conversion: 0.25
            }
          }
        },
        {
          source: 'Acquire',
          external_id: 'acquire_333444',
          name: 'Mobile App Development Agency',
          industry: 'Professional Services',
          location: {
            city: 'Austin',
            state: 'TX',
            country: 'USA'
          },
          financial_data: {
            asking_price: 450000,
            annual_revenue: 600000,
            cash_flow: 180000,
            established_year: 2018,
            employees: 8
          },
          contact_info: {
            listing_url: 'https://acquire.com/listing/333444',
            description: 'Boutique mobile app development agency specializing in iOS and Android apps for startups. Strong client relationships and recurring revenue model.',
            seller_financing: false
          },
          additional_data: {
            training_included: true,
            reason_for_sale: 'Retirement',
            tech_stack: ['React Native', 'Swift', 'Kotlin', 'Node.js']
          }
        }
      ];

      return mockAcquireListings;
    } catch (error: any) {
      console.error('Acquire.com fetch error:', error.message);
      return [];
    }
  }

  // Craigslist Local Business Scraper
  async fetchFromCraigslist(city: string = 'newyork', filters: any = {}): Promise<BusinessListing[]> {
    console.log(`📰 Fetching from Craigslist ${city}...`);
    
    try {
      // Mock Craigslist data - would need real scraping implementation
      const mockCraigslistListings: BusinessListing[] = [
        {
          source: 'Craigslist',
          external_id: `cl_${city}_555666`,
          name: 'Established Pizza Restaurant',
          industry: 'Food & Beverage',
          location: {
            city: 'Brooklyn',
            state: 'NY',
            country: 'USA'
          },
          financial_data: {
            asking_price: 85000,
            annual_revenue: 280000,
            established_year: 2012,
            employees: 6
          },
          contact_info: {
            listing_url: `https://${city}.craigslist.org/bfs/555666.html`,
            description: 'Family-owned pizza restaurant in busy neighborhood. Loyal customer base, delivery setup, all equipment included. Owner retiring after 11 years.',
            broker_phone: '(718) 555-0123'
          }
        },
        {
          source: 'Craigslist',
          external_id: `cl_${city}_777888`,
          name: 'Auto Repair Shop',
          industry: 'Automotive',
          location: {
            city: 'Queens',
            state: 'NY',
            country: 'USA'
          },
          financial_data: {
            asking_price: 125000,
            annual_revenue: 320000,
            cash_flow: 85000,
            established_year: 2008,
            employees: 4
          },
          contact_info: {
            listing_url: `https://${city}.craigslist.org/bfs/777888.html`,
            description: 'Full-service auto repair shop with loyal customers. All certifications current, equipment included. Great location with high visibility.',
            broker_phone: '(347) 555-0456'
          }
        }
      ];

      return mockCraigslistListings;
    } catch (error: any) {
      console.error('Craigslist fetch error:', error.message);
      return [];
    }
  }

  // Twitter/X Business Opportunity Monitor
  async fetchFromTwitter(keywords: string[] = ['business for sale', 'selling my business', 'startup acquisition']): Promise<BusinessListing[]> {
    console.log('🐦 Monitoring Twitter for business opportunities...');
    
    try {
      // Mock Twitter data - would need Twitter API v2 implementation
      const mockTwitterListings: BusinessListing[] = [
        {
          source: 'Twitter',
          external_id: 'twitter_tweet_123456',
          name: 'Newsletter Business (Twitter Discovery)',
          industry: 'Media & Publishing',
          location: {
            city: 'Remote',
            state: 'CA',
            country: 'USA'
          },
          financial_data: {
            asking_price: 35000,
            monthly_profit: 2800,
            established_year: 2022
          },
          contact_info: {
            listing_url: 'https://twitter.com/username/status/123456',
            description: 'Profitable newsletter with 5,000 subscribers in the fintech space. Consistent growth, automated systems, looking for quick sale.',
            broker_email: 'dm for details'
          },
          additional_data: {
            reason_for_sale: 'Moving to new project',
            social_following: {
              newsletter_subscribers: 5000,
              twitter_followers: 12000
            }
          }
        },
        {
          source: 'Twitter',
          external_id: 'twitter_tweet_789012',
          name: 'Chrome Extension Business',
          industry: 'Technology',
          location: {
            city: 'Remote',
            state: 'WA',
            country: 'USA'
          },
          financial_data: {
            asking_price: 65000,
            monthly_profit: 4200,
            established_year: 2021
          },
          contact_info: {
            listing_url: 'https://twitter.com/dev/status/789012',
            description: 'Chrome extension with 50K+ users. Subscription model, low maintenance, passive income. Reason for sale: focusing on larger projects.',
            broker_email: 'dm for details'
          },
          additional_data: {
            reason_for_sale: 'Scaling other ventures',
            tech_stack: ['JavaScript', 'Chrome APIs', 'Stripe'],
            traffic_stats: {
              active_users: 52000,
              conversion_rate: 0.08
            }
          }
        }
      ];

      return mockTwitterListings;
    } catch (error: any) {
      console.error('Twitter fetch error:', error.message);
      return [];
    }
  }

  // Enhanced quality scoring for different business types
  calculateQualityScore(listing: BusinessListing): number {
    let score = 0;
    
    // Base scoring from original algorithm
    if (listing.financial_data.asking_price) score += 10;
    if (listing.financial_data.annual_revenue || listing.financial_data.monthly_profit) score += 10;
    if (listing.financial_data.cash_flow) score += 10;
    if (listing.financial_data.established_year) score += 10;
    
    // Contact information
    if (listing.contact_info.broker_name || listing.contact_info.broker_email) score += 10;
    if (listing.contact_info.broker_phone) score += 10;
    if (listing.contact_info.listing_url) score += 5;
    
    // Location data
    if (listing.location.city && listing.location.state) score += 10;
    if (listing.location.zip) score += 5;
    
    // Description quality
    if (listing.contact_info.description && listing.contact_info.description.length > 100) {
      score += 10;
    } else if (listing.contact_info.description) {
      score += 5;
    }
    
    // Source-specific bonuses
    switch (listing.source) {
      case 'Flippa':
        if (listing.additional_data?.tech_stack?.length) score += 5;
        if (listing.additional_data?.traffic_stats) score += 5;
        break;
      case 'Crexi':
        if (listing.location.address) score += 5;
        if (listing.financial_data.employees) score += 5;
        break;
      case 'Acquire':
        if (listing.additional_data?.tech_stack?.length) score += 5;
        if (listing.financial_data.employees) score += 5;
        break;
      case 'Twitter':
        // Twitter listings get penalty for less formal structure
        score = Math.max(0, score - 10);
        break;
    }
    
    return Math.min(score, 100);
  }

  // Enhanced risk scoring
  calculateRiskScore(listing: BusinessListing): number {
    let riskScore = 0;
    
    // Age of business
    const currentYear = new Date().getFullYear();
    const businessAge = listing.financial_data.established_year 
      ? currentYear - listing.financial_data.established_year 
      : 0;
    
    if (businessAge < 1) riskScore += 30;
    else if (businessAge < 2) riskScore += 25;
    else if (businessAge < 5) riskScore += 15;
    else if (businessAge < 10) riskScore += 10;
    else riskScore += 5;
    
    // Revenue information availability
    if (!listing.financial_data.annual_revenue && !listing.financial_data.monthly_profit) {
      riskScore += 20;
    }
    
    // Source-specific risk factors
    switch (listing.source) {
      case 'Twitter':
        riskScore += 15; // Higher risk due to informal nature
        break;
      case 'Craigslist':
        riskScore += 10; // Moderate risk due to less formal verification
        break;
      case 'Flippa':
        if (!listing.additional_data?.traffic_stats) riskScore += 10;
        break;
    }
    
    // Industry risk factors
    const highRiskIndustries = ['Restaurant', 'Retail', 'Entertainment', 'Media & Publishing'];
    if (highRiskIndustries.some(industry => listing.industry.includes(industry))) {
      riskScore += 10;
    }
    
    // Remote/location risk
    if (listing.location.city === 'Remote') {
      riskScore += 5; // Slight penalty for remote verification difficulty
    }
    
    return Math.min(riskScore, 100);
  }

  // Import single listing (enhanced version)
  async importListing(listing: BusinessListing): Promise<string | null> {
    // Check for duplicates
    if (await this.isDuplicate(listing)) {
      console.log(`Duplicate listing skipped: ${listing.name}`);
      return null;
    }

    const client = await pool.connect();
    
    try {
      const id = uuidv4();
      const qualityScore = this.calculateQualityScore(listing);
      const riskScore = this.calculateRiskScore(listing);
      
      const query = `
        INSERT INTO business_listings (
          id, name, industry, location, financial_data, 
          contact_info, quality_score, risk_score, 
          data_sources, created_at, last_updated
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;
      
      // Merge additional data into contact_info for storage
      const enhancedContactInfo = {
        ...listing.contact_info,
        ...(listing.additional_data && { additional_data: listing.additional_data })
      };
      
      const values = [
        id,
        listing.name,
        listing.industry,
        JSON.stringify(listing.location),
        JSON.stringify(listing.financial_data),
        JSON.stringify(enhancedContactInfo),
        qualityScore,
        riskScore,
        [`${listing.source}:${listing.external_id}`]
      ];
      
      await client.query(query, values);
      console.log(`✅ Imported: ${listing.name} (${listing.source}) - Quality: ${qualityScore}, Risk: ${riskScore}`);
      
      return id;
    } finally {
      client.release();
    }
  }

  // Check for duplicates (enhanced)
  async isDuplicate(listing: BusinessListing): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      // Check by external ID first
      const externalCheck = await client.query(
        'SELECT id FROM business_listings WHERE data_sources @> $1',
        [[`${listing.source}:${listing.external_id}`]]
      );
      
      if (externalCheck.rows.length > 0) {
        return true;
      }
      
      // For remote businesses, check by name only
      if (listing.location.city === 'Remote') {
        const nameCheck = await client.query(
          'SELECT id FROM business_listings WHERE LOWER(name) = LOWER($1)',
          [listing.name]
        );
        return nameCheck.rows.length > 0;
      }
      
      // Check by name and location similarity
      const similarCheck = await client.query(`
        SELECT id FROM business_listings 
        WHERE LOWER(name) = LOWER($1) 
        AND location->>'city' = $2 
        AND location->>'state' = $3
      `, [listing.name, listing.location.city, listing.location.state]);
      
      return similarCheck.rows.length > 0;
      
    } finally {
      client.release();
    }
  }

  // Bulk import from all sources
  async importFromAllSources(filters: any = {}): Promise<any> {
    console.log('🌍 Starting multi-source import...\n');
    
    const results = {
      flippa: { imported: 0, skipped: 0, errors: 0 },
      crexi: { imported: 0, skipped: 0, errors: 0 },
      acquire: { imported: 0, skipped: 0, errors: 0 },
      craigslist: { imported: 0, skipped: 0, errors: 0 },
      twitter: { imported: 0, skipped: 0, errors: 0 }
    };
    
    // Import from each source
    const sources = [
      { name: 'flippa', fetcher: () => this.fetchFromFlippa(filters) },
      { name: 'crexi', fetcher: () => this.fetchFromCrexi(filters) },
      { name: 'acquire', fetcher: () => this.fetchFromAcquire(filters) },
      { name: 'craigslist', fetcher: () => this.fetchFromCraigslist('newyork', filters) },
      { name: 'twitter', fetcher: () => this.fetchFromTwitter() }
    ];
    
    for (const source of sources) {
      try {
        const listings = await source.fetcher();
        
        for (const listing of listings) {
          try {
            const result = await this.importListing(listing);
            if (result) {
              results[source.name as keyof typeof results].imported++;
            } else {
              results[source.name as keyof typeof results].skipped++;
            }
          } catch (error: any) {
            console.error(`Error importing ${listing.name}:`, error.message);
            results[source.name as keyof typeof results].errors++;
          }
        }
      } catch (error: any) {
        console.error(`Error fetching from ${source.name}:`, error.message);
        results[source.name as keyof typeof results].errors++;
      }
    }
    
    return results;
  }
}

export const multiSourceImporter = new MultiSourceImporter();