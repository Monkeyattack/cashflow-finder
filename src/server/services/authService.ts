import { getAuth } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';
import { pool, withTransaction } from '../database';
import { User, Organization, Membership, AuthContext } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
  private auth = getAuth();

  async createUser(userData: {
    email: string;
    name: string;
    password: string;
    organizationName: string;
  }): Promise<{ user: User; organization: Organization; membership: Membership }> {
    return withTransaction(async (client) => {
      // Create Firebase user
      const firebaseUser = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
      });

      // Create user in database
      const userId = uuidv4();
      const userResult = await client.query(`
        INSERT INTO users (id, email, name, email_verified)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [userId, userData.email, userData.name, false]);

      const user = userResult.rows[0] as User;

      // Create organization
      const organizationId = uuidv4();
      const orgResult = await client.query(`
        INSERT INTO organizations (id, name, subscription_tier, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [organizationId, userData.organizationName, 'starter', 'active']);

      const organization = orgResult.rows[0] as Organization;

      // Create membership (user as owner)
      const membershipId = uuidv4();
      const membershipResult = await client.query(`
        INSERT INTO memberships (id, user_id, organization_id, role, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [membershipId, userId, organizationId, 'owner', 'active']);

      const membership = membershipResult.rows[0] as Membership;

      // Set custom claims in Firebase
      await this.auth.setCustomUserClaims(firebaseUser.uid, {
        userId: userId,
        organizationId: organizationId,
        role: 'owner',
        subscriptionTier: 'starter'
      });

      return { user, organization, membership };
    });
  }

  async authenticateUser(idToken: string): Promise<AuthContext | null> {
    try {
      // Verify Firebase ID token
      const decodedToken = await this.auth.verifyIdToken(idToken);
      
      // Get user from database
      const userResult = await pool.query(`
        SELECT u.*, m.organization_id, m.role, o.subscription_tier
        FROM users u
        JOIN memberships m ON u.id = m.user_id
        JOIN organizations o ON m.organization_id = o.id
        WHERE u.email = $1 AND m.status = 'active'
      `, [decodedToken.email]);

      if (userResult.rows.length === 0) {
        return null;
      }

      const userData = userResult.rows[0];

      return {
        userId: userData.id,
        organizationId: userData.organization_id,
        subscriptionTier: userData.subscription_tier,
        permissions: this.getPermissionsForRole(userData.role),
        featureAccess: this.getFeatureAccessForTier(userData.subscription_tier)
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  private getPermissionsForRole(role: string): string[] {
    const permissions = {
      owner: [
        'organization:read',
        'organization:update', 
        'organization:delete',
        'users:invite',
        'users:remove',
        'billing:manage',
        'analytics:view',
        'business:search',
        'business:export',
        'business:watchlist',
        'reports:generate'
      ],
      admin: [
        'organization:read',
        'users:invite',
        'analytics:view',
        'business:search',
        'business:export',
        'business:watchlist',
        'reports:generate'
      ],
      member: [
        'organization:read',
        'business:search',
        'business:watchlist'
      ]
    };

    return permissions[role as keyof typeof permissions] || permissions.member;
  }

  private getFeatureAccessForTier(tier: string) {
    const featureAccess = {
      starter: {
        canExport: false,
        canAccessAPI: false,
        canViewPremiumAnalytics: false,
        canAccessDueDiligence: false
      },
      professional: {
        canExport: true,
        canAccessAPI: false,
        canViewPremiumAnalytics: true,
        canAccessDueDiligence: true
      },
      enterprise: {
        canExport: true,
        canAccessAPI: true,
        canViewPremiumAnalytics: true,
        canAccessDueDiligence: true
      }
    };

    return featureAccess[tier as keyof typeof featureAccess] || featureAccess.starter;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows.length > 0 ? result.rows[0] as User : null;
  }

  async generateCustomToken(authContext: AuthContext): Promise<string> {
    return jwt.sign(
      {
        userId: authContext.userId,
        organizationId: authContext.organizationId,
        subscriptionTier: authContext.subscriptionTier,
        permissions: authContext.permissions
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  async verifyCustomToken(token: string): Promise<AuthContext | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        subscriptionTier: decoded.subscriptionTier,
        permissions: decoded.permissions,
        featureAccess: this.getFeatureAccessForTier(decoded.subscriptionTier)
      };
    } catch (error) {
      return null;
    }
  }

  async inviteUser(
    invitedBy: string,
    organizationId: string,
    email: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<void> {
    // Check if inviter has permission
    const inviterResult = await pool.query(`
      SELECT role FROM memberships 
      WHERE user_id = $1 AND organization_id = $2 AND status = 'active'
    `, [invitedBy, organizationId]);

    if (inviterResult.rows.length === 0 || 
        !['owner', 'admin'].includes(inviterResult.rows[0].role)) {
      throw new Error('Insufficient permissions to invite users');
    }

    // Check if user already exists
    let userId: string;
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
    } else {
      // Create placeholder user (they'll complete signup later)
      userId = uuidv4();
      await pool.query(`
        INSERT INTO users (id, email, name, email_verified)
        VALUES ($1, $2, $3, $4)
      `, [userId, email, email.split('@')[0], false]);
    }

    // Create pending membership
    const membershipId = uuidv4();
    await pool.query(`
      INSERT INTO memberships (id, user_id, organization_id, role, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, organization_id) 
      DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status
    `, [membershipId, userId, organizationId, role, 'pending']);

    // TODO: Send invitation email
    console.log(`Invitation sent to ${email} for organization ${organizationId}`);
  }

  async acceptInvitation(userId: string, organizationId: string): Promise<void> {
    await pool.query(`
      UPDATE memberships 
      SET status = 'active'
      WHERE user_id = $1 AND organization_id = $2 AND status = 'pending'
    `, [userId, organizationId]);
  }

  async removeUser(
    removedBy: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Check permissions
    const removerResult = await pool.query(`
      SELECT role FROM memberships 
      WHERE user_id = $1 AND organization_id = $2 AND status = 'active'
    `, [removedBy, organizationId]);

    if (removerResult.rows.length === 0 || 
        removerResult.rows[0].role !== 'owner') {
      throw new Error('Only organization owners can remove users');
    }

    // Don't allow removing the owner
    const targetResult = await pool.query(`
      SELECT role FROM memberships 
      WHERE user_id = $1 AND organization_id = $2
    `, [userId, organizationId]);

    if (targetResult.rows.length > 0 && targetResult.rows[0].role === 'owner') {
      throw new Error('Cannot remove organization owner');
    }

    // Remove membership
    await pool.query(`
      UPDATE memberships 
      SET status = 'inactive'
      WHERE user_id = $1 AND organization_id = $2
    `, [userId, organizationId]);
  }

  async getUserMemberships(userId: string): Promise<any[]> {
    const result = await pool.query(`
      SELECT 
        m.*,
        o.name as organization_name,
        o.subscription_tier,
        o.status as organization_status
      FROM memberships m
      JOIN organizations o ON m.organization_id = o.id
      WHERE m.user_id = $1 AND m.status = 'active'
      ORDER BY m.created_at DESC
    `, [userId]);

    return result.rows;
  }

  async switchOrganization(userId: string, organizationId: string): Promise<AuthContext | null> {
    const result = await pool.query(`
      SELECT 
        m.role,
        o.subscription_tier
      FROM memberships m
      JOIN organizations o ON m.organization_id = o.id
      WHERE m.user_id = $1 AND m.organization_id = $2 AND m.status = 'active'
    `, [userId, organizationId]);

    if (result.rows.length === 0) {
      return null;
    }

    const membership = result.rows[0];

    return {
      userId,
      organizationId,
      subscriptionTier: membership.subscription_tier,
      permissions: this.getPermissionsForRole(membership.role),
      featureAccess: this.getFeatureAccessForTier(membership.subscription_tier)
    };
  }

  async updateUserProfile(userId: string, updates: { name?: string; email?: string }) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (updates.email) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    if (updateFields.length === 0) {
      return;
    }

    values.push(userId);
    
    await pool.query(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
    `, values);

    // Update Firebase user if email changed
    if (updates.email) {
      const userRecord = await this.auth.getUserByEmail(updates.email);
      await this.auth.updateUser(userRecord.uid, {
        email: updates.email,
        displayName: updates.name
      });
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    await withTransaction(async (client) => {
      // Check if user is owner of any organizations
      const ownershipResult = await client.query(`
        SELECT organization_id FROM memberships 
        WHERE user_id = $1 AND role = 'owner' AND status = 'active'
      `, [userId]);

      if (ownershipResult.rows.length > 0) {
        throw new Error('Cannot delete account while owning organizations. Transfer ownership first.');
      }

      // Remove all memberships
      await client.query(`
        UPDATE memberships 
        SET status = 'inactive'
        WHERE user_id = $1
      `, [userId]);

      // Anonymize user data (for GDPR compliance)
      await client.query(`
        UPDATE users 
        SET 
          email = CONCAT('deleted_', id, '@cashflowfinder.com'),
          name = 'Deleted User'
        WHERE id = $1
      `, [userId]);

      // Delete Firebase user
      const userRecord = await this.auth.getUserByEmail(userId);
      await this.auth.deleteUser(userRecord.uid);
    });
  }
}

export const authService = new AuthService();