import axios from 'axios';
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
    monthly_revenue?: number;
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
    franchise_info?: any;
    verified?: boolean;
  };
}

export class AdditionalSourcesImporter {

  // Empire Flippers - Premium Online Business Marketplace
  async fetchFromEmpireFlippers(filters: any = {}): Promise<BusinessListing[]> {
    console.log('👑 Fetching from Empire Flippers...');
    
    try {
      const mockEmpireFlippersListings: BusinessListing[] = [
        {
          source: 'Empire Flippers',
          external_id: 'ef_567890',
          name: 'Affiliate Marketing Blog Network',
          industry: 'Digital Marketing',
          location: {
            city: 'Remote',
            state: 'FL',
            country: 'USA'
          },
          financial_data: {
            asking_price: 485000,
            monthly_revenue: 18500,
            monthly_profit: 14200,
            asking_multiple: 28.5,
            established_year: 2019,
            employees: 2
          },
          contact_info: {
            listing_url: 'https://empireflippers.com/listing/567890',
            description: 'Portfolio of 5 affiliate marketing websites in health/fitness niche. Diversified traffic from SEO and social. Proven content systems and VA team included.',
            seller_financing: false
          },
          additional_data: {
            website_included: true,
            training_included: true,
            reason_for_sale: 'Diversifying portfolio',
            tech_stack: ['WordPress', 'Google Analytics', 'Ahrefs', 'ConvertKit'],
            traffic_stats: {
              monthly_visitors: 145000,
              organic_traffic_percentage: 0.75,
              conversion_rate: 0.028
            },
            verified: true
          }
        },
        {
          source: 'Empire Flippers',
          external_id: 'ef_789123',
          name: 'Amazon FBA Product Line',
          industry: 'E-commerce',
          location: {
            city: 'Remote',
            state: 'CA',
            country: 'USA'
          },
          financial_data: {
            asking_price: 320000,
            monthly_revenue: 28000,
            monthly_profit: 9800,
            asking_multiple: 27.2,
            established_year: 2020
          },
          contact_info: {
            listing_url: 'https://empireflippers.com/listing/789123',
            description: 'Profitable Amazon FBA business selling kitchen gadgets. 8 SKUs with strong reviews. Includes inventory, supplier relationships, and brand assets.',
            seller_financing: true
          },
          additional_data: {
            training_included: true,
            reason_for_sale: 'Moving to different market',
            traffic_stats: {
              amazon_rank: 'Top 1000 in category',
              review_average: 4.6,
              return_rate: 0.02
            },
            verified: true
          }
        }
      ];

      return mockEmpireFlippersListings;
    } catch (error: any) {
      console.error('Empire Flippers fetch error:', error.message);
      return [];
    }
  }

  // FE International - SaaS and Content Site Broker
  async fetchFromFEInternational(filters: any = {}): Promise<BusinessListing[]> {
    console.log('🌐 Fetching from FE International...');
    
    try {
      const mockFEListings: BusinessListing[] = [
        {
          source: 'FE International',
          external_id: 'fe_345678',
          name: 'B2B SaaS Analytics Platform',
          industry: 'Technology',
          location: {
            city: 'Remote',
            state: 'WA',
            country: 'USA'
          },
          financial_data: {
            asking_price: 1250000,
            monthly_revenue: 45000,
            monthly_profit: 28000,
            asking_multiple: 37.2,
            established_year: 2018,
            employees: 6
          },
          contact_info: {
            listing_url: 'https://feinternational.com/listing/345678',
            description: 'SaaS platform providing analytics for e-commerce businesses. 280+ paying customers, 92% retention rate. Built on modern tech stack with API integrations.',
            seller_financing: true
          },
          additional_data: {
            website_included: true,
            training_included: true,
            reason_for_sale: 'Founder pursuing new venture',
            tech_stack: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Stripe'],
            traffic_stats: {
              monthly_visitors: 25000,
              trial_conversion: 0.18,
              churn_rate: 0.08
            },
            verified: true
          }
        },
        {
          source: 'FE International',
          external_id: 'fe_678901',
          name: 'Financial News & Analysis Site',
          industry: 'Media & Publishing',
          location: {
            city: 'Remote',
            state: 'NY',
            country: 'USA'
          },
          financial_data: {
            asking_price: 680000,
            monthly_revenue: 22000,
            monthly_profit: 16500,
            asking_multiple: 34.3,
            established_year: 2017,
            employees: 4
          },
          contact_info: {
            listing_url: 'https://feinternational.com/listing/678901',
            description: 'Premium financial news website with subscription model. 12K+ subscribers, strong brand recognition. Multiple revenue streams including ads and premium content.',
            seller_financing: false
          },
          additional_data: {
            website_included: true,
            training_included: true,
            reason_for_sale: 'Retirement',
            traffic_stats: {
              monthly_visitors: 185000,
              subscriber_count: 12500,
              email_open_rate: 0.34
            },
            social_following: {
              twitter: 45000,
              linkedin: 25000
            },
            verified: true
          }
        }
      ];

      return mockFEListings;
    } catch (error: any) {
      console.error('FE International fetch error:', error.message);
      return [];
    }
  }

  // LoopNet - Commercial Real Estate Platform
  async fetchFromLoopNet(filters: any = {}): Promise<BusinessListing[]> {
    console.log('🏭 Fetching from LoopNet...');
    
    try {
      const mockLoopNetListings: BusinessListing[] = [
        {
          source: 'LoopNet',
          external_id: 'ln_456789',
          name: 'Strip Mall with Established Tenants',
          industry: 'Commercial Real Estate',
          location: {
            address: '1234 Commerce Street',
            city: 'Tampa',
            state: 'FL',
            zip: '33601',
            country: 'USA'
          },
          financial_data: {
            asking_price: 3200000,
            annual_revenue: 485000,
            cash_flow: 420000,
            established_year: 2005,
            employees: 2
          },
          contact_info: {
            broker_name: 'Tampa Commercial Realty',
            broker_email: 'info@tampacommercial.com',
            broker_phone: '(813) 555-0890',
            listing_url: 'https://loopnet.com/listing/456789',
            description: '32,000 sq ft strip mall with 8 established tenants. Long-term leases, great location with high traffic. Includes restaurant, medical office, retail stores.'
          },
          additional_data: {
            franchise_info: {
              tenant_mix: ['Restaurant', 'Medical', 'Retail', 'Services'],
              occupancy_rate: 0.95,
              average_lease_term: 7
            }
          }
        },
        {
          source: 'LoopNet',
          external_id: 'ln_789012',
          name: 'Gas Station with Convenience Store',
          industry: 'Retail',
          location: {
            address: '5678 Highway 95',
            city: 'Las Vegas',
            state: 'NV',
            zip: '89101',
            country: 'USA'
          },
          financial_data: {
            asking_price: 1850000,
            annual_revenue: 2100000,
            cash_flow: 285000,
            established_year: 2010,
            employees: 12
          },
          contact_info: {
            broker_name: 'Nevada Business Brokers',
            broker_email: 'sales@nevadabiz.com',
            broker_phone: '(702) 555-0345',
            listing_url: 'https://loopnet.com/listing/789012',
            description: 'High-volume gas station with 2,400 sq ft convenience store. Prime highway location, major brand affiliation. Consistent cash flow and growth potential.'
          }
        }
      ];

      return mockLoopNetListings;
    } catch (error: any) {
      console.error('LoopNet fetch error:', error.message);
      return [];
    }
  }

  // MicroAcquire - Startup Acquisition Platform
  async fetchFromMicroAcquire(filters: any = {}): Promise<BusinessListing[]> {
    console.log('🦄 Fetching from MicroAcquire...');
    
    try {
      const mockMicroAcquireListings: BusinessListing[] = [
        {
          source: 'MicroAcquire',
          external_id: 'ma_123789',
          name: 'No-Code Automation SaaS',
          industry: 'Technology',
          location: {
            city: 'Remote',
            state: 'TX',
            country: 'USA'
          },
          financial_data: {
            asking_price: 180000,
            monthly_revenue: 8500,
            monthly_profit: 6200,
            established_year: 2022,
            employees: 1
          },
          contact_info: {
            listing_url: 'https://microacquire.com/listing/123789',
            description: 'No-code automation platform helping businesses connect their favorite tools. Growing customer base, high retention. Solo founder looking for strategic buyer.',
            seller_financing: true
          },
          additional_data: {
            website_included: true,
            training_included: true,
            reason_for_sale: 'Want to join larger team',
            tech_stack: ['Next.js', 'Supabase', 'Stripe', 'Vercel'],
            traffic_stats: {
              monthly_visitors: 12000,
              trial_conversion: 0.15,
              customer_count: 285
            }
          }
        },
        {
          source: 'MicroAcquire',
          external_id: 'ma_456012',
          name: 'Developer Tools Marketplace',
          industry: 'Technology',
          location: {
            city: 'Remote',
            state: 'CA',
            country: 'USA'
          },
          financial_data: {
            asking_price: 95000,
            monthly_revenue: 4200,
            monthly_profit: 3100,
            established_year: 2021,
            employees: 1
          },
          contact_info: {
            listing_url: 'https://microacquire.com/listing/456012',
            description: 'Marketplace for developer tools and code snippets. Community of 8,000+ developers, subscription and commission model. Perfect for technical acquirer.',
            seller_financing: false
          },
          additional_data: {
            website_included: true,
            training_included: true,
            reason_for_sale: 'Focusing on full-time job',
            tech_stack: ['Vue.js', 'Firebase', 'Stripe', 'Algolia'],
            traffic_stats: {
              monthly_visitors: 28000,
              registered_users: 8200,
              marketplace_transactions: 450
            }
          }
        }
      ];

      return mockMicroAcquireListings;
    } catch (error: any) {
      console.error('MicroAcquire fetch error:', error.message);
      return [];
    }
  }

  // BizQuest - Business Brokerage Network
  async fetchFromBizQuest(filters: any = {}): Promise<BusinessListing[]> {
    console.log('🏪 Fetching from BizQuest...');
    
    try {
      const mockBizQuestListings: BusinessListing[] = [
        {
          source: 'BizQuest',
          external_id: 'bq_234567',
          name: 'Subway Franchise Location',
          industry: 'Food & Beverage',
          location: {
            address: '789 Shopping Center',
            city: 'Orlando',
            state: 'FL',
            zip: '32801',
            country: 'USA'
          },
          financial_data: {
            asking_price: 165000,
            annual_revenue: 485000,
            cash_flow: 78000,
            established_year: 2016,
            employees: 8
          },
          contact_info: {
            broker_name: 'Florida Franchise Brokers',
            broker_email: 'info@flfranchise.com',
            broker_phone: '(407) 555-0678',
            listing_url: 'https://bizquest.com/listing/234567',
            description: 'Profitable Subway franchise in busy shopping center. Established customer base, trained staff, all equipment included. Owner financing available.'
          },
          additional_data: {
            franchise_info: {
              franchise_fee_paid: true,
              territory_protected: true,
              training_provided: true,
              franchise_term_remaining: 12
            }
          }
        },
        {
          source: 'BizQuest',
          external_id: 'bq_567890',
          name: 'Insurance Agency',
          industry: 'Professional Services',
          location: {
            address: '456 Business Plaza',
            city: 'Charlotte',
            state: 'NC',
            zip: '28202',
            country: 'USA'
          },
          financial_data: {
            asking_price: 420000,
            annual_revenue: 680000,
            cash_flow: 185000,
            established_year: 2008,
            employees: 6
          },
          contact_info: {
            broker_name: 'Carolina Business Brokers',
            broker_email: 'sales@carolinabiz.com',
            broker_phone: '(704) 555-0234',
            listing_url: 'https://bizquest.com/listing/567890',
            description: 'Independent insurance agency with diverse book of business. Strong relationships with carriers, experienced staff. Growth opportunity in expanding market.'
          }
        }
      ];

      return mockBizQuestListings;
    } catch (error: any) {
      console.error('BizQuest fetch error:', error.message);
      return [];
    }
  }

  // Reddit Business Communities Monitor
  async fetchFromReddit(subreddits: string[] = ['entrepreneur', 'BusinessForSale', 'SideProject', 'startups']): Promise<BusinessListing[]> {
    console.log('📱 Fetching from Reddit communities...');
    
    try {
      const mockRedditListings: BusinessListing[] = [
        {
          source: 'Reddit',
          external_id: 'reddit_r_entrepreneur_123',
          name: 'Profitable Print-on-Demand Store',
          industry: 'E-commerce',
          location: {
            city: 'Remote',
            state: 'Unknown',
            country: 'USA'
          },
          financial_data: {
            asking_price: 42000,
            monthly_revenue: 3800,
            monthly_profit: 1900,
            established_year: 2021
          },
          contact_info: {
            listing_url: 'https://reddit.com/r/entrepreneur/posts/123',
            description: 'Etsy + Shopify print-on-demand business selling custom designs. Automated systems, proven designs, growing organically. No inventory needed.',
            broker_email: 'DM on Reddit'
          },
          additional_data: {
            reason_for_sale: 'Moving to different business model',
            tech_stack: ['Shopify', 'Printful', 'Canva'],
            social_following: {
              etsy_favorites: 2500,
              shopify_customers: 1200
            }
          }
        },
        {
          source: 'Reddit',
          external_id: 'reddit_r_sideproject_456',
          name: 'YouTube Automation Channel',
          industry: 'Media & Publishing',
          location: {
            city: 'Remote',
            state: 'Unknown',
            country: 'USA'
          },
          financial_data: {
            asking_price: 28000,
            monthly_revenue: 2200,
            monthly_profit: 1800,
            established_year: 2022
          },
          contact_info: {
            listing_url: 'https://reddit.com/r/sideproject/posts/456',
            description: 'Automated YouTube channel in personal finance niche. Outsourced content creation, consistent views, monetized. Great passive income opportunity.',
            broker_email: 'DM on Reddit'
          },
          additional_data: {
            reason_for_sale: 'Need quick cash for new opportunity',
            social_following: {
              youtube_subscribers: 45000,
              monthly_views: 180000
            },
            traffic_stats: {
              average_cpm: 2.8,
              watch_time_hours: 12000
            }
          }
        }
      ];

      return mockRedditListings;
    } catch (error: any) {
      console.error('Reddit fetch error:', error.message);
      return [];
    }
  }

  // LinkedIn Business Posts Monitor
  async fetchFromLinkedIn(keywords: string[] = ['business for sale', 'acquisition opportunity', 'exit opportunity']): Promise<BusinessListing[]> {
    console.log('💼 Fetching from LinkedIn...');
    
    try {
      const mockLinkedInListings: BusinessListing[] = [
        {
          source: 'LinkedIn',
          external_id: 'linkedin_post_789123',
          name: 'Manufacturing Services Company',
          industry: 'Manufacturing',
          location: {
            city: 'Detroit',
            state: 'MI',
            country: 'USA'
          },
          financial_data: {
            asking_price: 2800000,
            annual_revenue: 4200000,
            cash_flow: 620000,
            established_year: 1995,
            employees: 28
          },
          contact_info: {
            listing_url: 'https://linkedin.com/posts/activity-789123',
            description: 'Established manufacturing services company specializing in automotive parts. Long-term contracts with major OEMs. Experienced management team stays with acquisition.',
            broker_name: 'CEO - Mike Johnson',
            broker_email: 'Connect on LinkedIn'
          },
          additional_data: {
            reason_for_sale: 'Retirement succession planning',
            verified: true
          }
        }
      ];

      return mockLinkedInListings;
    } catch (error: any) {
      console.error('LinkedIn fetch error:', error.message);
      return [];
    }
  }

  // Quality scoring for additional sources
  calculateQualityScore(listing: BusinessListing): number {
    let score = 0;
    
    // Base scoring
    if (listing.financial_data.asking_price) score += 10;
    if (listing.financial_data.annual_revenue || listing.financial_data.monthly_revenue) score += 10;
    if (listing.financial_data.cash_flow || listing.financial_data.monthly_profit) score += 10;
    if (listing.financial_data.established_year) score += 10;
    
    // Contact information
    if (listing.contact_info.broker_name || listing.contact_info.broker_email) score += 10;
    if (listing.contact_info.broker_phone) score += 10;
    if (listing.contact_info.listing_url) score += 5;
    
    // Location data
    if (listing.location.city && listing.location.state) score += 10;
    if (listing.location.address) score += 5;
    
    // Description quality
    if (listing.contact_info.description && listing.contact_info.description.length > 100) {
      score += 10;
    } else if (listing.contact_info.description) {
      score += 5;
    }
    
    // Source-specific bonuses
    switch (listing.source) {
      case 'Empire Flippers':
        if (listing.additional_data?.verified) score += 10;
        if (listing.additional_data?.traffic_stats) score += 5;
        break;
      case 'FE International':
        if (listing.additional_data?.verified) score += 10;
        if (listing.financial_data.employees) score += 5;
        break;
      case 'LoopNet':
        if (listing.location.address) score += 10;
        if (listing.contact_info.broker_phone) score += 5;
        break;
      case 'MicroAcquire':
        if (listing.additional_data?.tech_stack?.length) score += 5;
        if (listing.financial_data.monthly_revenue) score += 5;
        break;
      case 'BizQuest':
        if (listing.additional_data?.franchise_info) score += 10;
        if (listing.location.address) score += 5;
        break;
      case 'Reddit':
        score = Math.max(0, score - 15); // Penalty for informal nature
        break;
      case 'LinkedIn':
        if (listing.additional_data?.verified) score += 10;
        if (listing.financial_data.employees) score += 5;
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
    
    if (businessAge < 1) riskScore += 35;
    else if (businessAge < 2) riskScore += 25;
    else if (businessAge < 5) riskScore += 15;
    else if (businessAge < 10) riskScore += 10;
    else riskScore += 5;
    
    // Revenue information
    if (!listing.financial_data.annual_revenue && !listing.financial_data.monthly_revenue) {
      riskScore += 20;
    }
    
    // Source-specific risk factors
    switch (listing.source) {
      case 'Reddit':
        riskScore += 20; // Higher risk due to informal verification
        break;
      case 'LinkedIn':
        riskScore += 10; // Moderate risk for social media sourcing
        break;
      case 'MicroAcquire':
        riskScore += 5; // Slight penalty for newer platform
        break;
      case 'Empire Flippers':
        if (listing.additional_data?.verified) riskScore -= 5; // Bonus for verification
        break;
      case 'FE International':
        if (listing.additional_data?.verified) riskScore -= 5; // Bonus for verification
        break;
    }
    
    // Industry risk factors
    const highRiskIndustries = ['Restaurant', 'Retail', 'Entertainment', 'Media & Publishing'];
    if (highRiskIndustries.some(industry => listing.industry.includes(industry))) {
      riskScore += 10;
    }
    
    return Math.min(riskScore, 100);
  }

  // Import single listing with enhanced duplicate detection
  async importListing(listing: BusinessListing): Promise<string | null> {
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

  // Enhanced duplicate detection
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
      
      // For remote businesses, check by URL if available
      if (listing.location.city === 'Remote' && listing.contact_info.listing_url) {
        const urlCheck = await client.query(
          `SELECT id FROM business_listings WHERE contact_info->>'listing_url' = $1`,
          [listing.contact_info.listing_url]
        );
        if (urlCheck.rows.length > 0) return true;
      }
      
      // Check by name and location
      if (listing.location.city !== 'Remote') {
        const similarCheck = await client.query(`
          SELECT id FROM business_listings 
          WHERE LOWER(name) = LOWER($1) 
          AND location->>'city' = $2 
          AND location->>'state' = $3
        `, [listing.name, listing.location.city, listing.location.state]);
        
        return similarCheck.rows.length > 0;
      }
      
      return false;
      
    } finally {
      client.release();
    }
  }

  // Import from all additional sources
  async importFromAllAdditionalSources(filters: any = {}): Promise<any> {
    console.log('🌟 Starting additional sources import...\n');
    
    const results = {
      empireflippers: { imported: 0, skipped: 0, errors: 0 },
      feinternational: { imported: 0, skipped: 0, errors: 0 },
      loopnet: { imported: 0, skipped: 0, errors: 0 },
      microacquire: { imported: 0, skipped: 0, errors: 0 },
      bizquest: { imported: 0, skipped: 0, errors: 0 },
      reddit: { imported: 0, skipped: 0, errors: 0 },
      linkedin: { imported: 0, skipped: 0, errors: 0 }
    };
    
    const sources = [
      { name: 'empireflippers', fetcher: () => this.fetchFromEmpireFlippers(filters) },
      { name: 'feinternational', fetcher: () => this.fetchFromFEInternational(filters) },
      { name: 'loopnet', fetcher: () => this.fetchFromLoopNet(filters) },
      { name: 'microacquire', fetcher: () => this.fetchFromMicroAcquire(filters) },
      { name: 'bizquest', fetcher: () => this.fetchFromBizQuest(filters) },
      { name: 'reddit', fetcher: () => this.fetchFromReddit() },
      { name: 'linkedin', fetcher: () => this.fetchFromLinkedIn() }
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

export const additionalSourcesImporter = new AdditionalSourcesImporter();