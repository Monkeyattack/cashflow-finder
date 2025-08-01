import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { pool } from '../database/index';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

interface LinkedInUserInfo {
  id: string;
  email: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    'displayImage~': {
      elements: Array<{
        identifiers: Array<{ identifier: string }>;
      }>;
    };
  };
}

// Google OAuth callback
router.post('/google/callback', async (req, res) => {
  try {
    const { credential } = req.body;
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid Google token' } 
      });
    }

    const googleUser: GoogleUserInfo = {
      id: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture!,
      email_verified: payload.email_verified!
    };

    const user = await findOrCreateUser('google', googleUser);
    const token = generateJWT(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          subscription_tier: user.subscription_tier,
          email_verified: user.email_verified
        },
        token
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Google authentication failed' } 
    });
  }
});

// LinkedIn OAuth callback
router.post('/linkedin/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
      grant_type: 'authorization_code',
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/people/~?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    // Get user email
    const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const linkedinUser: LinkedInUserInfo = {
      id: profileResponse.data.id,
      email: emailResponse.data.elements[0]['handle~'].emailAddress,
      localizedFirstName: profileResponse.data.localizedFirstName,
      localizedLastName: profileResponse.data.localizedLastName,
      profilePicture: profileResponse.data.profilePicture
    };

    const user = await findOrCreateUser('linkedin', linkedinUser);
    const token = generateJWT(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          subscription_tier: user.subscription_tier,
          email_verified: user.email_verified
        },
        token
      }
    });
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'LinkedIn authentication failed' } 
    });
  }
});

async function findOrCreateUser(provider: 'google' | 'linkedin', oauthUser: GoogleUserInfo | LinkedInUserInfo) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    let email: string;
    let name: string;
    let avatarUrl: string;
    let providerId: string;
    let emailVerified = false;

    if (provider === 'google') {
      const googleUser = oauthUser as GoogleUserInfo;
      email = googleUser.email;
      name = googleUser.name;
      avatarUrl = googleUser.picture;
      providerId = googleUser.id;
      emailVerified = googleUser.email_verified;
    } else {
      const linkedinUser = oauthUser as LinkedInUserInfo;
      email = linkedinUser.email;
      name = `${linkedinUser.localizedFirstName} ${linkedinUser.localizedLastName}`;
      providerId = linkedinUser.id;
      avatarUrl = linkedinUser.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier || '';
      emailVerified = true; // LinkedIn emails are always verified
    }

    // Check if user exists by provider ID
    const providerColumn = provider === 'google' ? 'google_id' : 'linkedin_id';
    let existingUserResult = await client.query(
      `SELECT * FROM users WHERE ${providerColumn} = $1`,
      [providerId]
    );

    let user;
    if (existingUserResult.rows.length > 0) {
      // Update existing user
      user = existingUserResult.rows[0];
      await client.query(
        `UPDATE users SET 
         name = $1, 
         avatar_url = $2, 
         email_verified = $3 
         WHERE ${providerColumn} = $4`,
        [name, avatarUrl, emailVerified, providerId]
      );
    } else {
      // Check if user exists by email
      existingUserResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (existingUserResult.rows.length > 0) {
        // Link OAuth account to existing user
        user = existingUserResult.rows[0];
        await client.query(
          `UPDATE users SET 
           ${providerColumn} = $1,
           name = $2,
           avatar_url = $3,
           email_verified = $4
           WHERE email = $5`,
          [providerId, name, avatarUrl, emailVerified, email]
        );
      } else {
        // Create new user - check if it's meredith@monkeyattack.com for premium access
        const isOwner = email === 'meredith@monkeyattack.com';
        const subscriptionTier = isOwner ? 'enterprise' : 'starter';
        
        const userId = uuidv4();
        const insertResult = await client.query(
          `INSERT INTO users (
            id, email, name, avatar_url, email_verified, 
            ${providerColumn}, subscription_tier, 
            monthly_searches_used, monthly_exports_used
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0) RETURNING *`,
          [userId, email, name, avatarUrl, emailVerified, providerId, subscriptionTier]
        );
        user = insertResult.rows[0];

        // If it's the owner, mark as paid subscription
        if (isOwner) {
          await client.query(
            `INSERT INTO subscriptions (
              id, organization_id, status, current_period_start, current_period_end
            ) VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '1 year')`,
            [uuidv4(), userId, userId] // Using user_id as org_id for individual users
          );
        }
      }
    }

    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function generateJWT(userId: string): string {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

// Get OAuth URLs for frontend
router.get('/google/url', (req, res) => {
  const authUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'profile', 'email'],
    prompt: 'consent'
  });
  
  res.json({ success: true, data: { authUrl } });
});

router.get('/linkedin/url', (req, res) => {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI!)}&` +
    `scope=r_liteprofile%20r_emailaddress`;
  
  res.json({ success: true, data: { authUrl } });
});

export default router;