import { pool } from '../database/index';

async function setupDatabase(): Promise<void> {
  console.log('🗄️  Setting up database schema...');
  
  const client = await pool.connect();
  
  try {
    // Create businesses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100) NOT NULL,
        location JSONB NOT NULL,
        financial_data JSONB NOT NULL,
        description TEXT,
        quality_score DECIMAL(3,1) DEFAULT 0,
        source VARCHAR(50) NOT NULL,
        source_url TEXT,
        contact_info TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_industry ON businesses(industry);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_source ON businesses(source);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);
    `);
    
    // Create user_alerts table for email subscriptions (without foreign key for now)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_alerts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        filters JSONB,
        frequency VARCHAR(20) DEFAULT 'weekly',
        last_sent TIMESTAMP,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Database schema setup completed successfully!');
    
    // Show table info
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('businesses', 'user_alerts')
      ORDER BY table_name, ordinal_position;
    `);
    
    console.log('\n📋 Database Schema:');
    let currentTable = '';
    result.rows.forEach(row => {
      if (row.table_name !== currentTable) {
        console.log(`\n  📄 ${row.table_name}:`);
        currentTable = row.table_name;
      }
      console.log(`    - ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('\n🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { setupDatabase };