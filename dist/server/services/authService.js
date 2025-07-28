"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const auth_1 = require("firebase-admin/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const uuid_1 = require("uuid");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
class AuthService {
    constructor() {
        this.auth = (0, auth_1.getAuth)();
    }
    async createUser(userData) {
        return (0, database_1.withTransaction)(async (client) => {
            // Create Firebase user
            const firebaseUser = await this.auth.createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.name,
            });
            // Create user in database
            const userId = (0, uuid_1.v4)();
            const userResult = await client.query(`
        INSERT INTO users (id, email, name, email_verified)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [userId, userData.email, userData.name, false]);
            const user = userResult.rows[0];
            // Create organization
            const organizationId = (0, uuid_1.v4)();
            const orgResult = await client.query(`
        INSERT INTO organizations (id, name, subscription_tier, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [organizationId, userData.organizationName, 'starter', 'active']);
            const organization = orgResult.rows[0];
            // Create membership (user as owner)
            const membershipId = (0, uuid_1.v4)();
            const membershipResult = await client.query(`
        INSERT INTO memberships (id, user_id, organization_id, role, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [membershipId, userId, organizationId, 'owner', 'active']);
            const membership = membershipResult.rows[0];
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
    async authenticateUser(idToken) {
        try {
            // Verify Firebase ID token
            const decodedToken = await this.auth.verifyIdToken(idToken);
            // Get user from database
            const userResult = await database_1.pool.query(`
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
        }
        catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }
    getPermissionsForRole(role) {
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
        return permissions[role] || permissions.member;
    }
    getFeatureAccessForTier(tier) {
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
        return featureAccess[tier] || featureAccess.starter;
    }
    async getUserByEmail(email) {
        const result = await database_1.pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    async generateCustomToken(authContext) {
        return jsonwebtoken_1.default.sign({
            userId: authContext.userId,
            organizationId: authContext.organizationId,
            subscriptionTier: authContext.subscriptionTier,
            permissions: authContext.permissions
        }, JWT_SECRET, { expiresIn: '24h' });
    }
    async verifyCustomToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            return {
                userId: decoded.userId,
                organizationId: decoded.organizationId,
                subscriptionTier: decoded.subscriptionTier,
                permissions: decoded.permissions,
                featureAccess: this.getFeatureAccessForTier(decoded.subscriptionTier)
            };
        }
        catch (error) {
            return null;
        }
    }
    async inviteUser(invitedBy, organizationId, email, role = 'member') {
        // Check if inviter has permission
        const inviterResult = await database_1.pool.query(`
      SELECT role FROM memberships 
      WHERE user_id = $1 AND organization_id = $2 AND status = 'active'
    `, [invitedBy, organizationId]);
        if (inviterResult.rows.length === 0 ||
            !['owner', 'admin'].includes(inviterResult.rows[0].role)) {
            throw new Error('Insufficient permissions to invite users');
        }
        // Check if user already exists
        let userId;
        const existingUser = await database_1.pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            userId = existingUser.rows[0].id;
        }
        else {
            // Create placeholder user (they'll complete signup later)
            userId = (0, uuid_1.v4)();
            await database_1.pool.query(`
        INSERT INTO users (id, email, name, email_verified)
        VALUES ($1, $2, $3, $4)
      `, [userId, email, email.split('@')[0], false]);
        }
        // Create pending membership
        const membershipId = (0, uuid_1.v4)();
        await database_1.pool.query(`
      INSERT INTO memberships (id, user_id, organization_id, role, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, organization_id) 
      DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status
    `, [membershipId, userId, organizationId, role, 'pending']);
        // TODO: Send invitation email
        console.log(`Invitation sent to ${email} for organization ${organizationId}`);
    }
    async acceptInvitation(userId, organizationId) {
        await database_1.pool.query(`
      UPDATE memberships 
      SET status = 'active'
      WHERE user_id = $1 AND organization_id = $2 AND status = 'pending'
    `, [userId, organizationId]);
    }
    async removeUser(removedBy, organizationId, userId) {
        // Check permissions
        const removerResult = await database_1.pool.query(`
      SELECT role FROM memberships 
      WHERE user_id = $1 AND organization_id = $2 AND status = 'active'
    `, [removedBy, organizationId]);
        if (removerResult.rows.length === 0 ||
            removerResult.rows[0].role !== 'owner') {
            throw new Error('Only organization owners can remove users');
        }
        // Don't allow removing the owner
        const targetResult = await database_1.pool.query(`
      SELECT role FROM memberships 
      WHERE user_id = $1 AND organization_id = $2
    `, [userId, organizationId]);
        if (targetResult.rows.length > 0 && targetResult.rows[0].role === 'owner') {
            throw new Error('Cannot remove organization owner');
        }
        // Remove membership
        await database_1.pool.query(`
      UPDATE memberships 
      SET status = 'inactive'
      WHERE user_id = $1 AND organization_id = $2
    `, [userId, organizationId]);
    }
    async getUserMemberships(userId) {
        const result = await database_1.pool.query(`
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
    async switchOrganization(userId, organizationId) {
        const result = await database_1.pool.query(`
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
    async updateUserProfile(userId, updates) {
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
        await database_1.pool.query(`
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
    async deleteAccount(userId) {
        await (0, database_1.withTransaction)(async (client) => {
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
exports.AuthService = AuthService;
exports.authService = new AuthService();
