import { useState } from 'react';
import { signInWithPopup, AuthProvider } from 'firebase/auth';
import { auth, googleProvider, microsoftProvider, linkedinProvider } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ApiResponse } from '@/types';

export type SocialProvider = 'google' | 'microsoft' | 'linkedin';

interface SocialAuthOptions {
  organizationName?: string;
  redirectTo?: string;
}

export const useSocialAuth = () => {
  const [loading, setLoading] = useState<SocialProvider | null>(null);
  const { login } = useAuth();
  const { addToast } = useToast();

  const getProvider = (providerName: SocialProvider): AuthProvider => {
    switch (providerName) {
      case 'google':
        return googleProvider;
      case 'microsoft':
        return microsoftProvider;
      case 'linkedin':
        return linkedinProvider;
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  };

  const signInWithSocial = async (
    providerName: SocialProvider,
    options: SocialAuthOptions = {}
  ) => {
    setLoading(providerName);

    try {
      const provider = getProvider(providerName);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in our system
      const idToken = await user.getIdToken();
      
      try {
        // Try to login with existing account
        await login(idToken);
        
        addToast({
          message: 'Successfully signed in!',
          type: 'success'
        });

        return { success: true, isNewUser: false };
      } catch (loginError: any) {
        // If login fails, user might not exist - create account
        if (loginError.message.includes('not found') || loginError.message.includes('INVALID_CREDENTIALS')) {
          return await createSocialAccount(user, providerName, options);
        }
        throw loginError;
      }
    } catch (error: any) {
      console.error(`${providerName} auth error:`, error);
      
      let message = `Failed to sign in with ${providerName}. Please try again.`;
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign in was cancelled.';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Pop-up was blocked. Please allow pop-ups and try again.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        message = 'An account already exists with this email using a different sign-in method.';
      }
      
      addToast({
        message,
        type: 'error'
      });

      return { success: false, error: message };
    } finally {
      setLoading(null);
    }
  };

  const createSocialAccount = async (
    user: any,
    providerName: SocialProvider,
    options: SocialAuthOptions
  ) => {
    try {
      // Extract user info from social provider
      const displayName = user.displayName || user.email?.split('@')[0] || 'User';
      const organizationName = options.organizationName || `${displayName}'s Organization`;

      // Create account in backend
      const response = await fetch('/api/auth/social-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          name: displayName,
          organizationName,
          provider: providerName,
          providerUid: user.uid,
          photoURL: user.photoURL
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        // Now login with the created account
        const idToken = await user.getIdToken();
        await login(idToken);

        addToast({
          message: `Welcome to Cash Flow Finder! Account created successfully.`,
          type: 'success'
        });

        return { success: true, isNewUser: true };
      } else {
        throw new Error(result.error?.message || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Social account creation error:', error);
      
      addToast({
        message: error.message || 'Failed to create account. Please try again.',
        type: 'error'
      });

      return { success: false, error: error.message };
    }
  };

  const linkSocialAccount = async (providerName: SocialProvider) => {
    setLoading(providerName);

    try {
      const provider = getProvider(providerName);
      const result = await signInWithPopup(auth, provider);
      
      addToast({
        message: `Successfully linked ${providerName} account!`,
        type: 'success'
      });

      return { success: true };
    } catch (error: any) {
      console.error(`Link ${providerName} error:`, error);
      
      let message = `Failed to link ${providerName} account.`;
      if (error.code === 'auth/credential-already-in-use') {
        message = `This ${providerName} account is already linked to another user.`;
      }
      
      addToast({
        message,
        type: 'error'
      });

      return { success: false, error: message };
    } finally {
      setLoading(null);
    }
  };

  return {
    signInWithSocial,
    linkSocialAccount,
    loading,
    isLoading: (provider: SocialProvider) => loading === provider
  };
};