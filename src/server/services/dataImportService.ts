import axios from 'axios';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Database connection for import service
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'cashflow_finder',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'AirpUgWN33IcU93D'
});

interface ExternalListing {
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
  };
  contact_info: {
    broker_name?: string;
    broker_email?: string;
    broker_phone?: string;
    listing_url?: string;
    description?: string;
  };
}

export class DataImportService {
  
  // Clearbit API integration for company enrichment
  async enrichWithClearbit(companyName: string, domain?: string): Promise<any> {
    const apiKey = process.env.CLEARBIT_API_KEY;
    if (!apiKey) {
      console.log('Clearbit API key not configured');
      return null;
    }

    try {
      const response = await axios.get(`https://company.clearbit.com/v2/companies/find`, {
        params: {
          name: companyName,
          domain: domain
        },
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000
      });

      return response.data;
    } catch (error: any) {
      console.error('Clearbit enrichment error:', error.message);
      return null;
    }
  }

  // Mock BizBuySell API integration (replace with real API when available)
  async fetchFromBizBuySell(filters: any = {}): Promise<ExternalListing[]> {
    // This is a mock implementation - replace with real BizBuySell API
    console.log('Mock: Fetching from BizBuySell API...');
    
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data that would come from BizBuySell
    const mockListings: ExternalListing[] = [
      {
        source: 'BizBuySell',
        external_id: 'bbs_12345',
        name: 'Metro Area Dental Practice',
        industry: 'Healthcare',
        location: {
          address: '123 Medical Plaza',
          city: 'Atlanta',
          state: 'GA',
          zip: '30309',
          country: 'USA'
        },
        financial_data: {
          asking_price: 850000,
          annual_revenue: 1200000,
          cash_flow: 320000,
          gross_profit_margin: 0.72,
          established_year: 2010,
          employees: 8
        },
        contact_info: {
          broker_name: 'John Smith',
          broker_email: 'john@atlantabrokers.com',
          broker_phone: '(404) 555-0123',
          listing_url: 'https://bizbuysell.com/listing/12345',
          description: 'Established dental practice with modern equipment and loyal patient base. Located in high-traffic medical plaza with ample parking.'
        }
      },
      {
        source: 'BizBuySell',
        external_id: 'bbs_12346',
        name: 'Premier Event Planning Company',
        industry: 'Professional Services',
        location: {
          city: 'Miami',
          state: 'FL',
          zip: '33101',
          country: 'USA'
        },
        financial_data: {
          asking_price: 450000,
          annual_revenue: 680000,
          cash_flow: 185000,
          established_year: 2016,
          employees: 6
        },
        contact_info: {
          broker_name: 'Maria Rodriguez',
          broker_email: 'maria@floridabiz.com',
          broker_phone: '(305) 555-0456',
          listing_url: 'https://bizbuysell.com/listing/12346',
          description: 'Full-service event planning company specializing in corporate events and weddings. Established client base and vendor relationships.'
        }
      }
    ];

    return mockListings;
  }

  // Quality scoring algorithm
  calculateQualityScore(listing: ExternalListing): number {
    let score = 0;
    
    // Financial data completeness (40 points)
    if (listing.financial_data.asking_price) score += 10;
    if (listing.financial_data.annual_revenue) score += 10;
    if (listing.financial_data.cash_flow) score += 10;
    if (listing.financial_data.established_year) score += 10;
    
    // Contact information (30 points)
    if (listing.contact_info.broker_name) score += 10;
    if (listing.contact_info.broker_email) score += 10;
    if (listing.contact_info.broker_phone) score += 10;
    
    // Location data (20 points)
    if (listing.location.city && listing.location.state) score += 15;
    if (listing.location.zip) score += 5;
    
    // Description quality (10 points)
    if (listing.contact_info.description && listing.contact_info.description.length > 100) {
      score += 10;
    } else if (listing.contact_info.description) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  // Risk assessment algorithm
  calculateRiskScore(listing: ExternalListing): number {
    let riskScore = 0;
    
    // Age of business (older = lower risk)
    const currentYear = new Date().getFullYear();
    const businessAge = listing.financial_data.established_year 
      ? currentYear - listing.financial_data.established_year 
      : 0;
    
    if (businessAge < 2) riskScore += 25;
    else if (businessAge < 5) riskScore += 15;
    else if (businessAge < 10) riskScore += 10;
    else riskScore += 5;
    
    // Revenue to price ratio (lower ratio = higher risk)
    if (listing.financial_data.annual_revenue && listing.financial_data.asking_price) {
      const revenueRatio = listing.financial_data.annual_revenue / listing.financial_data.asking_price;
      if (revenueRatio < 0.5) riskScore += 20;
      else if (revenueRatio < 1.0) riskScore += 10;
      else if (revenueRatio < 1.5) riskScore += 5;
    } else {
      riskScore += 15; // No financial data is risky
    }
    
    // Cash flow availability
    if (!listing.financial_data.cash_flow) {
      riskScore += 10;
    }
    
    // Industry risk factors
    const highRiskIndustries = ['Restaurant', 'Retail', 'Entertainment'];
    if (highRiskIndustries.includes(listing.industry)) {
      riskScore += 10;
    }
    
    return Math.min(riskScore, 100);
  }

  // Check for duplicate listings
  async isDuplicate(listing: ExternalListing): Promise<boolean> {
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

  // Import single listing
  async importListing(listing: ExternalListing): Promise<string | null> {
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
      
      // Enrich with Clearbit data if available
      const enrichmentData = await this.enrichWithClearbit(listing.name);
      
      // Merge enrichment data
      const enhancedFinancialData = {
        ...listing.financial_data,
        ...(enrichmentData?.metrics && {
          employees: enrichmentData.metrics.employees,
          estimated_annual_revenue: enrichmentData.metrics.estimatedAnnualRevenue
        })
      };
      
      const enhancedContactInfo = {
        ...listing.contact_info,
        ...(enrichmentData && {
          website: enrichmentData.domain,
          linkedin: enrichmentData.linkedin?.handle,
          company_description: enrichmentData.description
        })
      };
      
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
      
      const values = [
        id,
        listing.name,
        listing.industry,
        JSON.stringify(listing.location),
        JSON.stringify(enhancedFinancialData),
        JSON.stringify(enhancedContactInfo),
        qualityScore,
        riskScore,
        [`${listing.source}:${listing.external_id}`]
      ];
      
      await client.query(query, values);
      console.log(`✅ Imported: ${listing.name} (Quality: ${qualityScore}, Risk: ${riskScore})`);
      
      return id;
    } finally {
      client.release();
    }
  }

  // Bulk import from external source
  async bulkImport(source: string, filters: any = {}): Promise<{ imported: number; skipped: number; errors: number }> {
    console.log(`🚀 Starting bulk import from ${source}...`);
    
    let listings: ExternalListing[] = [];
    
    try {
      switch (source.toLowerCase()) {
        case 'bizbuysell':
          listings = await this.fetchFromBizBuySell(filters);
          break;
        default:
          throw new Error(`Unknown data source: ${source}`);
      }
    } catch (error: any) {
      console.error(`Error fetching from ${source}:`, error.message);
      return { imported: 0, skipped: 0, errors: 1 };
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const listing of listings) {
      try {
        const result = await this.importListing(listing);
        if (result) {
          imported++;
        } else {
          skipped++;
        }
      } catch (error: any) {
        console.error(`Error importing ${listing.name}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Import Summary for ${source}:`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    
    return { imported, skipped, errors };
  }

  // Refresh existing listings
  async refreshListings(maxAge: number = 7): Promise<void> {
    console.log(`🔄 Refreshing listings older than ${maxAge} days...`);
    
    // This would typically re-fetch data from external sources
    // and update existing records with new information
    
    // Implementation would depend on each source's update API
    console.log('Refresh functionality would go here...');
  }
}

export const dataImportService = new DataImportService();