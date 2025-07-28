import { Router } from 'express';
import { authService } from '../services/authService';
import { subscriptionService } from '../services/subscriptionService';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
  organizationName: z.string().min(2).max(100)
});

const loginSchema = z.object({
  idToken: z.string()
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member')
});

const socialSignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  organizationName: z.string().min(2).max(100),
  provider: z.enum(['google', 'microsoft', 'linkedin']),
  providerUid: z.string(),
  photoURL: z.string().optional()
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, name, password, organizationName } = signupSchema.parse(req.body);

    const { user, organization, membership } = await authService.createUser({
      email,
      name,
      password,
      organizationName
    });

    // Create Stripe customer and default subscription
    const customer = await subscriptionService.createCustomer(
      email,
      name,
      organization.id
    );

    // Start with 14-day free trial on Starter tier
    const subscription = await subscriptionService.createSubscription(
      customer.id,
      organization.id,
      'starter',
      14
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        organization: {
          id: organization.id,
          name: organization.name,
          subscription_tier: organization.subscription_tier
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          trial_end: subscription.trial_end
        }
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists'
        }
      });
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'SIGNUP_FAILED',
        message: error.message || 'Failed to create account'
      }
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { idToken } = loginSchema.parse(req.body);

    const authContext = await authService.authenticateUser(idToken);
    if (!authContext) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid login credentials'
        }
      });
    }

    // Generate custom JWT for API access
    const customToken = await authService.generateCustomToken(authContext);

    res.json({
      success: true,
      data: {
        token: customToken,
        user: {
          id: authContext.userId,
          organizationId: authContext.organizationId,
          subscriptionTier: authContext.subscriptionTier,
          permissions: authContext.permissions
        }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: error.message || 'Login failed'
      }
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const memberships = await authService.getUserMemberships(req.authContext!.userId);
    const subscriptionStatus = await subscriptionService.getSubscriptionStatus(
      req.authContext!.organizationId
    );

    res.json({
      success: true,
      data: {
        user: {
          id: req.authContext!.userId,
          organizationId: req.authContext!.organizationId,
          subscriptionTier: req.authContext!.subscriptionTier,
          permissions: req.authContext!.permissions
        },
        memberships,
        subscription: subscriptionStatus
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_FETCH_FAILED',
        message: 'Failed to fetch user information'
      }
    });
  }
});

// POST /api/auth/invite
router.post('/invite', authenticateUser, requirePermission('users:invite'), async (req, res) => {
  try {
    const { email, role } = inviteSchema.parse(req.body);

    await authService.inviteUser(
      req.authContext!.userId,
      req.authContext!.organizationId,
      email,
      role
    );

    res.json({
      success: true,
      data: {
        message: `Invitation sent to ${email}`
      }
    });
  } catch (error: any) {
    console.error('Invite error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'INVITE_FAILED',
        message: error.message || 'Failed to send invitation'
      }
    });
  }
});

// POST /api/auth/accept-invitation
router.post('/accept-invitation', authenticateUser, async (req, res) => {
  try {
    const { organizationId } = req.body;

    await authService.acceptInvitation(req.authContext!.userId, organizationId);

    res.json({
      success: true,
      data: {
        message: 'Invitation accepted successfully'
      }
    });
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'ACCEPT_INVITATION_FAILED',
        message: error.message || 'Failed to accept invitation'
      }
    });
  }
});

// POST /api/auth/switch-organization
router.post('/switch-organization', authenticateUser, async (req, res) => {
  try {
    const { organizationId } = req.body;

    const newAuthContext = await authService.switchOrganization(
      req.authContext!.userId,
      organizationId
    );

    if (!newAuthContext) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this organization'
        }
      });
    }

    const customToken = await authService.generateCustomToken(newAuthContext);

    res.json({
      success: true,
      data: {
        token: customToken,
        user: {
          id: newAuthContext.userId,
          organizationId: newAuthContext.organizationId,
          subscriptionTier: newAuthContext.subscriptionTier,
          permissions: newAuthContext.permissions
        }
      }
    });
  } catch (error: any) {
    console.error('Switch organization error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'SWITCH_ORG_FAILED',
        message: error.message || 'Failed to switch organization'
      }
    });
  }
});

// DELETE /api/auth/remove-user/:userId
router.delete('/remove-user/:userId', authenticateUser, requirePermission('users:remove'), async (req, res) => {
  try {
    await authService.removeUser(
      req.authContext!.userId,
      req.authContext!.organizationId,
      req.params.userId
    );

    res.json({
      success: true,
      data: {
        message: 'User removed successfully'
      }
    });
  } catch (error: any) {
    console.error('Remove user error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'REMOVE_USER_FAILED',
        message: error.message || 'Failed to remove user'
      }
    });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    await authService.updateUserProfile(req.authContext!.userId, { name, email });

    res.json({
      success: true,
      data: {
        message: 'Profile updated successfully'
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'PROFILE_UPDATE_FAILED',
        message: error.message || 'Failed to update profile'
      }
    });
  }
});

// POST /api/auth/social-signup
router.post('/social-signup', async (req, res) => {
  try {
    const { email, name, organizationName, provider, providerUid, photoURL } = socialSignupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await authService.getUserByEmail?.(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email already exists'
        }
      });
    }

    const { user, organization, membership } = await authService.createUser({
      email,
      name,
      password: '', // Social auth users don't need password
      organizationName
    });

    // Create Stripe customer and default subscription
    const customer = await subscriptionService.createCustomer(
      email,
      name,
      organization.id
    );

    // Start with 14-day free trial on Starter tier
    const subscription = await subscriptionService.createSubscription(
      customer.id,
      organization.id,
      'starter',
      14
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        organization: {
          id: organization.id,
          name: organization.name,
          subscription_tier: organization.subscription_tier
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          trial_end: subscription.trial_end
        }
      }
    });
  } catch (error: any) {
    console.error('Social signup error:', error);
    
    res.status(400).json({
      success: false,
      error: {
        code: 'SOCIAL_SIGNUP_FAILED',
        message: error.message || 'Failed to create account with social provider'
      }
    });
  }
});

// DELETE /api/auth/account
router.delete('/account', authenticateUser, async (req, res) => {
  try {
    await authService.deleteAccount(req.authContext!.userId);

    res.json({
      success: true,
      data: {
        message: 'Account deleted successfully'
      }
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'ACCOUNT_DELETE_FAILED',
        message: error.message || 'Failed to delete account'
      }
    });
  }
});

export { router as authRoutes };