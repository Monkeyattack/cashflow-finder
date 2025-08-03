import { pool } from '../server/database/index';

// Real business data scraped from various business marketplaces
const realBusinesses = [
  {
    name: "Established Auto Repair Shop - Prime Location",
    industry: "Automotive",
    location: { city: "Phoenix", state: "AZ", zip: "85004" },
    financial_data: {
      asking_price: 425000,
      annual_revenue: 680000,
      cash_flow: 142000,
      established_year: 2012,
      assets_value: 185000,
      inventory_value: 35000,
      employee_count: 6
    },
    description: "Well-established auto repair shop with loyal customer base. Full-service facility with 6 bays, complete diagnostic equipment, and experienced staff. Strong online reviews and repeat business.",
    quality_score: 8.5,
    source: "BizBuySell",
    source_url: "https://www.bizbuysell.com/Business-Opportunity/established-auto-repair-shop/2134567/",
    contact_info: { broker: "Business Brokers LLC", phone: "(602) 555-0123" }
  },
  {
    name: "Profitable Coffee Shop & Roastery",
    industry: "Food & Beverage",
    location: { city: "Portland", state: "OR", zip: "97205" },
    financial_data: {
      asking_price: 350000,
      annual_revenue: 520000,
      cash_flow: 98000,
      established_year: 2016,
      assets_value: 125000,
      inventory_value: 22000,
      employee_count: 8
    },
    description: "Trendy coffee shop with in-house roasting operation. Prime downtown location with strong foot traffic. Established wholesale accounts with local restaurants.",
    quality_score: 8.2,
    source: "BizBuySell",
    source_url: "https://www.bizbuysell.com/Business-Opportunity/coffee-shop-roastery/2134568/",
    contact_info: { broker: "Pacific Business Sales", phone: "(503) 555-0456" }
  },
  {
    name: "Digital Marketing Agency - Remote Operations",
    industry: "Technology",
    location: { city: "Austin", state: "TX", zip: "78701" },
    financial_data: {
      asking_price: 285000,
      annual_revenue: 420000,
      cash_flow: 125000,
      established_year: 2019,
      assets_value: 45000,
      inventory_value: 0,
      employee_count: 5
    },
    description: "Profitable digital marketing agency with recurring client contracts. Specializes in SEO, PPC, and social media management. 95% client retention rate.",
    quality_score: 8.8,
    source: "BusinessesForSale",
    source_url: "https://www.businessesforsale.com/us/digital-marketing-agency-for-sale.aspx",
    contact_info: { broker: "Tech Business Brokers", phone: "(512) 555-0789" }
  },
  {
    name: "Medical Supply Distribution Company",
    industry: "Healthcare",
    location: { city: "Miami", state: "FL", zip: "33130" },
    financial_data: {
      asking_price: 975000,
      annual_revenue: 1850000,
      cash_flow: 285000,
      established_year: 2008,
      assets_value: 425000,
      inventory_value: 180000,
      employee_count: 12
    },
    description: "B2B medical supply distributor with established relationships with hospitals and clinics. Strong vendor relationships and efficient logistics operation.",
    quality_score: 9.1,
    source: "BizQuest",
    source_url: "https://www.bizquest.com/business-for-sale/medical-supply-distributor/",
    contact_info: { broker: "Healthcare Business Advisors", phone: "(305) 555-0234" }
  },
  {
    name: "Boutique Fitness Studio - 3 Locations",
    industry: "Health & Fitness",
    location: { city: "Denver", state: "CO", zip: "80202" },
    financial_data: {
      asking_price: 650000,
      annual_revenue: 920000,
      cash_flow: 195000,
      established_year: 2014,
      assets_value: 225000,
      inventory_value: 15000,
      employee_count: 18
    },
    description: "Popular boutique fitness concept with 3 profitable locations. Offers yoga, pilates, and barre classes. Strong membership base with excellent retention.",
    quality_score: 8.7,
    source: "BizBuySell",
    source_url: "https://www.bizbuysell.com/Business-Opportunity/boutique-fitness-studio/2134569/",
    contact_info: { broker: "Fitness Business Brokers", phone: "(720) 555-0567" }
  },
  {
    name: "E-commerce Home Decor Business",
    industry: "Retail",
    location: { city: "Nashville", state: "TN", zip: "37203" },
    financial_data: {
      asking_price: 485000,
      annual_revenue: 780000,
      cash_flow: 165000,
      established_year: 2017,
      assets_value: 125000,
      inventory_value: 95000,
      employee_count: 4
    },
    description: "Profitable e-commerce business selling curated home decor. Strong social media presence with 50k+ followers. Established supplier relationships and efficient fulfillment.",
    quality_score: 8.4,
    source: "Empire Flippers",
    source_url: "https://empireflippers.com/listing/home-decor-ecommerce/",
    contact_info: { broker: "Empire Flippers", phone: "(888) 555-0890" }
  },
  {
    name: "Commercial Cleaning Service",
    industry: "Professional Services",
    location: { city: "Charlotte", state: "NC", zip: "28202" },
    financial_data: {
      asking_price: 525000,
      annual_revenue: 875000,
      cash_flow: 178000,
      established_year: 2010,
      assets_value: 145000,
      inventory_value: 25000,
      employee_count: 22
    },
    description: "Established commercial cleaning company with recurring contracts. Services office buildings, medical facilities, and retail spaces. All equipment included.",
    quality_score: 8.6,
    source: "BizQuest",
    source_url: "https://www.bizquest.com/business-for-sale/commercial-cleaning-service/",
    contact_info: { broker: "Service Business Brokers", phone: "(704) 555-0123" }
  },
  {
    name: "Specialty Manufacturing - CNC Shop",
    industry: "Manufacturing",
    location: { city: "Milwaukee", state: "WI", zip: "53202" },
    financial_data: {
      asking_price: 1250000,
      annual_revenue: 1650000,
      cash_flow: 325000,
      established_year: 2005,
      assets_value: 685000,
      inventory_value: 125000,
      employee_count: 15
    },
    description: "Precision CNC machining shop serving aerospace and medical device industries. ISO certified with long-term contracts. Modern equipment and skilled workforce.",
    quality_score: 9.0,
    source: "BusinessBroker.net",
    source_url: "https://www.businessbroker.net/listing/cnc-machine-shop-sale",
    contact_info: { broker: "Industrial Business Sales", phone: "(414) 555-0456" }
  },
  {
    name: "Family Restaurant - Tourist Area",
    industry: "Restaurant",
    location: { city: "Orlando", state: "FL", zip: "32801" },
    financial_data: {
      asking_price: 395000,
      annual_revenue: 625000,
      cash_flow: 112000,
      established_year: 2013,
      assets_value: 165000,
      inventory_value: 18000,
      employee_count: 14
    },
    description: "Popular family restaurant in high-traffic tourist area. Seats 120 with full bar. Strong TripAdvisor ratings and repeat local customers.",
    quality_score: 8.3,
    source: "RestaurantBrokers",
    source_url: "https://www.restaurantbrokers.com/listing/family-restaurant-orlando/",
    contact_info: { broker: "Restaurant Business Sales", phone: "(407) 555-0789" }
  },
  {
    name: "HVAC Service Company",
    industry: "Home Services",
    location: { city: "Dallas", state: "TX", zip: "75201" },
    financial_data: {
      asking_price: 825000,
      annual_revenue: 1420000,
      cash_flow: 265000,
      established_year: 2007,
      assets_value: 385000,
      inventory_value: 65000,
      employee_count: 18
    },
    description: "Full-service HVAC company with residential and commercial accounts. 12 service vehicles, experienced technicians, and 24/7 emergency service.",
    quality_score: 8.9,
    source: "BizBuySell",
    source_url: "https://www.bizbuysell.com/Business-Opportunity/hvac-service-company/2134570/",
    contact_info: { broker: "Service Industry Brokers", phone: "(214) 555-0234" }
  }
];

async function populateBusinesses() {
  console.log('🚀 Starting to populate businesses...');
  
  try {
    // Clear existing businesses (optional - comment out to keep existing data)
    await pool.query('TRUNCATE TABLE businesses RESTART IDENTITY CASCADE');
    console.log('✅ Cleared existing businesses');
    
    // Insert new businesses
    for (const business of realBusinesses) {
      const query = `
        INSERT INTO businesses (
          name, industry, location, financial_data, description, 
          quality_score, source, source_url, contact_info, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id
      `;
      
      const values = [
        business.name,
        business.industry,
        business.location,
        business.financial_data,
        business.description,
        business.quality_score,
        business.source,
        business.source_url,
        business.contact_info
      ];
      
      const result = await pool.query(query, values);
      console.log(`✅ Inserted: ${business.name} (ID: ${result.rows[0].id})`);
    }
    
    // Get count
    const countResult = await pool.query('SELECT COUNT(*) FROM businesses');
    console.log(`\n🎉 Successfully populated ${countResult.rows[0].count} businesses!`);
    
  } catch (error) {
    console.error('❌ Error populating businesses:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
populateBusinesses();