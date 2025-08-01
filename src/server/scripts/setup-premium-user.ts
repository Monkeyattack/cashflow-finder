import { pool } from '../database/index';
import { v4 as uuidv4 } from 'uuid';

async function setupPremiumUser() {
  console.log('🚀 Setting up premium user account for meredith@monkeyattack.com...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const email = 'meredith@monkeyattack.com';
    const userId = uuidv4();
    
    // Check if user already exists
    const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists. Updating to Enterprise tier...');
      
      await client.query(`
        UPDATE users SET 
          subscription_tier = 'enterprise',
          monthly_searches_used = 0,
          monthly_exports_used = 0,
          last_tier_reset = NOW()
        WHERE email = $1
      `, [email]);
      
      const updatedUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      console.log('🎉 User updated:', updatedUser.rows[0]);
    } else {
      console.log('🔧 Creating new Enterprise user...');
      
      const newUser = await client.query(`
        INSERT INTO users (
          id, email, name, subscription_tier, 
          monthly_searches_used, monthly_exports_used, 
          email_verified, created_at
        ) VALUES ($1, $2, $3, 'enterprise', 0, 0, true, NOW())
        RETURNING *
      `, [userId, email, 'Meredith (Owner)']);
      
      console.log('🎉 New user created:', newUser.rows[0]);
    }
    
    // Create or update subscription record
    const userForSubscription = existingUser.rows.length > 0 ? existingUser.rows[0] : { id: userId };
    
    const existingSubscription = await client.query(
      'SELECT * FROM subscriptions WHERE organization_id = $1',
      [userForSubscription.id]
    );
    
    if (existingSubscription.rows.length === 0) {
      await client.query(`
        INSERT INTO subscriptions (
          id, organization_id, status, 
          current_period_start, current_period_end
        ) VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '1 year')
      `, [uuidv4(), userForSubscription.id]);
      
      console.log('✅ Enterprise subscription created');
    } else {
      await client.query(`
        UPDATE subscriptions SET 
          status = 'active',
          current_period_end = NOW() + INTERVAL '1 year'
        WHERE organization_id = $1
      `, [userForSubscription.id]);
      
      console.log('✅ Enterprise subscription updated');
    }
    
    await client.query('COMMIT');
    
    console.log('🎊 Premium user setup complete!');
    console.log('📊 Benefits:');
    console.log('  • Unlimited searches');
    console.log('  • Unlimited exports');
    console.log('  • Full financial data access');
    console.log('  • ROI analysis and projections');
    console.log('  • SBA qualification assessments');
    console.log('  • Due diligence reports');
    console.log('  • API access');
    console.log('  • White-label options');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up premium user:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupPremiumUser()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { setupPremiumUser };