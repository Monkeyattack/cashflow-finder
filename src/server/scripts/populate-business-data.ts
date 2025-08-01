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

// Realistic business data
const businessData = [
  {
    name: 'Mountain View Coffee Roasters',
    industry: 'Food & Beverage',
    location: {
      address: '1234 Main Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      country: 'USA'
    },
    financial_data: {
      asking_price: 750000,
      annual_revenue: 1200000,
      cash_flow: 280000,
      gross_profit_margin: 0.65,
      inventory_value: 45000,
      ff_e_value: 125000,
      established_year: 2015,
      employees: 12
    },
    contact_info: {
      broker_name: 'Sarah Johnson',
      broker_email: 'sarah@bizbrokers.com',
      broker_phone: '(303) 555-0123'
    },
    description: 'Established coffee roastery with strong local brand recognition. Features on-site roasting, retail cafe, and wholesale accounts with 30+ local restaurants. Prime downtown location with 10-year lease.',
    quality_score: 92,
    risk_score: 15,
    data_sources: ['BizBuySell', 'LoopNet', 'Direct Listing']
  },
  {
    name: 'TechRepair Pro Solutions',
    industry: 'Technology Services',
    location: {
      address: '5678 Tech Boulevard',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'USA'
    },
    financial_data: {
      asking_price: 425000,
      annual_revenue: 680000,
      cash_flow: 165000,
      gross_profit_margin: 0.72,
      inventory_value: 35000,
      ff_e_value: 65000,
      established_year: 2018,
      employees: 8
    },
    contact_info: {
      broker_name: 'Michael Chen',
      broker_email: 'mchen@austinbusinessbrokers.com',
      broker_phone: '(512) 555-0456'
    },
    description: 'Full-service computer and phone repair shop with certified technicians. Strong B2B contracts with local businesses. Includes all equipment, inventory, and customer database of 2,000+ clients.',
    quality_score: 85,
    risk_score: 22,
    data_sources: ['BizQuest', 'Direct Listing']
  },
  {
    name: 'Elite Home Cleaning Services',
    industry: 'Professional Services',
    location: {
      address: '910 Service Drive',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001',
      country: 'USA'
    },
    financial_data: {
      asking_price: 950000,
      annual_revenue: 1450000,
      cash_flow: 385000,
      gross_profit_margin: 0.58,
      inventory_value: 15000,
      ff_e_value: 85000,
      established_year: 2012,
      employees: 24
    },
    contact_info: {
      broker_name: 'Jennifer Martinez',
      broker_email: 'jmartinez@phoenixbizbrokers.com',
      broker_phone: '(602) 555-0789'
    },
    description: 'Residential and commercial cleaning company with 500+ recurring contracts. Fully systematized operations with management team in place. Strong online reviews and brand reputation.',
    quality_score: 94,
    risk_score: 12,
    data_sources: ['BusinessBroker.net', 'MLS']
  },
  {
    name: 'Fitness First Gym & Studio',
    industry: 'Health & Fitness',
    location: {
      address: '2345 Wellness Way',
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
      country: 'USA'
    },
    financial_data: {
      asking_price: 1250000,
      annual_revenue: 1680000,
      cash_flow: 420000,
      gross_profit_margin: 0.68,
      inventory_value: 25000,
      ff_e_value: 350000,
      established_year: 2016,
      employees: 18
    },
    contact_info: {
      broker_name: 'Robert Thompson',
      broker_email: 'rthompson@socalbizbrokers.com',
      broker_phone: '(619) 555-0234'
    },
    description: '8,000 sq ft facility with state-of-the-art equipment. 1,200+ active members with strong retention. Includes group fitness studios, personal training area, and juice bar. Long-term lease with favorable terms.',
    quality_score: 88,
    risk_score: 18,
    data_sources: ['BizBuySell', 'LoopNet']
  },
  {
    name: 'Green Thumb Landscaping Co',
    industry: 'Home Services',
    location: {
      address: '789 Garden Grove',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      country: 'USA'
    },
    financial_data: {
      asking_price: 575000,
      annual_revenue: 920000,
      cash_flow: 235000,
      gross_profit_margin: 0.52,
      inventory_value: 20000,
      ff_e_value: 185000,
      established_year: 2014,
      employees: 15
    },
    contact_info: {
      broker_name: 'David Wilson',
      broker_email: 'dwilson@portlandbusinessbrokers.com',
      broker_phone: '(503) 555-0567'
    },
    description: 'Full-service landscaping company with commercial and residential accounts. Fleet of 8 trucks and all equipment included. Strong recurring revenue from maintenance contracts.',
    quality_score: 82,
    risk_score: 24,
    data_sources: ['BizQuest', 'Direct Listing']
  },
  {
    name: 'Digital Marketing Masters',
    industry: 'Marketing & Advertising',
    location: {
      address: '1111 Creative Commons',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'USA'
    },
    financial_data: {
      asking_price: 850000,
      annual_revenue: 1100000,
      cash_flow: 380000,
      gross_profit_margin: 0.78,
      inventory_value: 0,
      ff_e_value: 45000,
      established_year: 2017,
      employees: 10
    },
    contact_info: {
      broker_name: 'Lisa Anderson',
      broker_email: 'landerson@seattlebizbrokers.com',
      broker_phone: '(206) 555-0890'
    },
    description: 'Digital marketing agency specializing in SEO, PPC, and social media. 40+ active retainer clients. Remote-first operation with proven systems. Strong recurring revenue model.',
    quality_score: 90,
    risk_score: 16,
    data_sources: ['Flippa', 'Empire Flippers']
  },
  {
    name: 'Auto Excellence Repair Center',
    industry: 'Automotive',
    location: {
      address: '4567 Motor Mile',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
      country: 'USA'
    },
    financial_data: {
      asking_price: 1100000,
      annual_revenue: 1850000,
      cash_flow: 425000,
      gross_profit_margin: 0.55,
      inventory_value: 65000,
      ff_e_value: 275000,
      established_year: 2010,
      employees: 16
    },
    contact_info: {
      broker_name: 'Carlos Rodriguez',
      broker_email: 'crodriguez@houstonbizbrokers.com',
      broker_phone: '(713) 555-0123'
    },
    description: 'Full-service auto repair shop with 8 bays and state certifications. Specializes in foreign and domestic vehicles. Strong Google reviews and repeat customer base.',
    quality_score: 86,
    risk_score: 20,
    data_sources: ['BizBuySell', 'AutoTrader Commercial']
  },
  {
    name: 'Bella Italia Restaurant',
    industry: 'Food & Beverage',
    location: {
      address: '888 Tuscan Trail',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'USA'
    },
    financial_data: {
      asking_price: 950000,
      annual_revenue: 1420000,
      cash_flow: 285000,
      gross_profit_margin: 0.62,
      inventory_value: 35000,
      ff_e_value: 225000,
      established_year: 2013,
      employees: 22
    },
    contact_info: {
      broker_name: 'Maria Rossi',
      broker_email: 'mrossi@chicagobizbrokers.com',
      broker_phone: '(312) 555-0456'
    },
    description: 'Authentic Italian restaurant in prime location. Full liquor license, 120 seats, private event space. Known for handmade pasta and wine selection. Catering business adds 20% to revenue.',
    quality_score: 87,
    risk_score: 19,
    data_sources: ['RestaurantBrokers.com', 'BizQuest']
  },
  {
    name: 'Pet Paradise Grooming & Boarding',
    industry: 'Pet Services',
    location: {
      address: '222 Puppy Place',
      city: 'Nashville',
      state: 'TN',
      zip: '37201',
      country: 'USA'
    },
    financial_data: {
      asking_price: 625000,
      annual_revenue: 880000,
      cash_flow: 245000,
      gross_profit_margin: 0.64,
      inventory_value: 15000,
      ff_e_value: 95000,
      established_year: 2015,
      employees: 11
    },
    contact_info: {
      broker_name: 'Amy Thompson',
      broker_email: 'athompson@nashvillebizbrokers.com',
      broker_phone: '(615) 555-0789'
    },
    description: 'Full-service pet grooming and boarding facility. 30 boarding suites, 4 grooming stations, retail area. Database of 1,500+ regular customers. Great location with parking.',
    quality_score: 89,
    risk_score: 17,
    data_sources: ['PetBusinessBrokers.com', 'BizBuySell']
  },
  {
    name: 'QuickPrint Solutions',
    industry: 'Printing & Graphics',
    location: {
      address: '333 Print Plaza',
      city: 'Atlanta',
      state: 'GA',
      zip: '30301',
      country: 'USA'
    },
    financial_data: {
      asking_price: 485000,
      annual_revenue: 720000,
      cash_flow: 175000,
      gross_profit_margin: 0.59,
      inventory_value: 40000,
      ff_e_value: 165000,
      established_year: 2011,
      employees: 9
    },
    contact_info: {
      broker_name: 'James Lee',
      broker_email: 'jlee@atlantabizbrokers.com',
      broker_phone: '(404) 555-0234'
    },
    description: 'Commercial printing shop with digital and offset capabilities. Serves B2B clients with regular orders. Includes all equipment, customer lists, and vendor relationships.',
    quality_score: 81,
    risk_score: 25,
    data_sources: ['PrintingBusinessBrokers.com', 'Direct Listing']
  }
];

async function populateBusinessData() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Clear existing data (optional - comment out if you want to append)
    await client.query('DELETE FROM business_listings');
    console.log('🗑️  Cleared existing business listings');
    
    // Insert new business data
    for (const business of businessData) {
      const id = uuidv4();
      
      // Add description to contact_info since there's no description column
      const contactInfoWithDescription = {
        ...business.contact_info,
        description: business.description
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
        business.name,
        business.industry,
        JSON.stringify(business.location),
        JSON.stringify(business.financial_data),
        JSON.stringify(contactInfoWithDescription),
        business.quality_score,
        business.risk_score,
        business.data_sources
      ];
      
      await client.query(query, values);
      console.log(`✅ Inserted: ${business.name}`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log(`\n🎉 Successfully populated ${businessData.length} business listings!`);
    
    // Verify the data
    const result = await client.query('SELECT COUNT(*) as count FROM business_listings');
    console.log(`📊 Total business listings in database: ${result.rows[0].count}`);
    
  } catch (error) {
    // Rollback on error
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Error populating data:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Add some additional analytics data
async function addAnalyticsData() {
  let client;
  
  try {
    client = await pool.connect();
    
    // Get all business IDs
    const businessResult = await client.query('SELECT id FROM business_listings');
    const businessIds = businessResult.rows.map(row => row.id);
    
    // Add some view analytics
    for (const businessId of businessIds) {
      const viewCount = Math.floor(Math.random() * 500) + 100;
      const contactViews = Math.floor(viewCount * 0.3);
      
      // This assumes you have an analytics table - adjust based on your schema
      console.log(`📈 Would add analytics for business ${businessId}: ${viewCount} views`);
    }
    
  } catch (error) {
    console.error('Error adding analytics:', error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Run the population script
console.log('🚀 Starting business data population...\n');
populateBusinessData()
  .then(() => {
    console.log('\n✅ Data population complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Data population failed:', error);
    process.exit(1);
  });

export { populateBusinessData };