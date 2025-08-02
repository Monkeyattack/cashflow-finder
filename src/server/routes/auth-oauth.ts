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

// Get Google OAuth URL
router.get('/google/url', (req, res) => {
  const scopes = ['email', 'profile'];
  const authUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  
  res.json({
    success: true,
    data: { url: authUrl }
  });
});

// Get LinkedIn OAuth URL  
router.get('/linkedin/url', (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const scope = 'r_liteprofile r_emailaddress';
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&scope=${encodeURIComponent(scope)}`;
  
  res.json({
    success: true,
    data: { url: authUrl }
  });
});

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
      emailVerified = true;
    }

    // Check if user exists by email
    let existingUserResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    
    let user;
    if (existingUserResult.rows.length > 0) {
      // Update existing user
      user = existingUserResult.rows[0];
      await client.query(
        `UPDATE users SET 
         name = $1, 
         avatar_url = $2, 
         email_verified = $3 
         WHERE email = $4`,
        [name, avatarUrl, emailVerified, email]
      );
    } else {
      // Create new user - check if it's meredith@monkeyattack.com for premium access
      const isOwner = email === 'meredith@monkeyattack.com';
      const subscriptionTier = isOwner ? 'enterprise' : 'starter';
      
      const userId = uuidv4();
      const insertResult = await client.query(
        `INSERT INTO users (
          id, email, name, avatar_url, email_verified, 
          subscription_tier, monthly_searches_used, monthly_exports_used
        ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0) RETURNING *`,
        [userId, email, name, avatarUrl, emailVerified, subscriptionTier]
      );
      user = insertResult.rows[0];
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

export default router;