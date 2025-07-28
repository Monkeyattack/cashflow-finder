'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { ApiResponse } from '@/types';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'starter';
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addToast({
        message: 'Passwords do not match',
        type: 'error'
      });
      return;
    }

    if (formData.password.length < 8) {
      addToast({
        message: 'Password must be at least 8 characters long',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Create user in backend
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          organizationName: formData.organizationName
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        addToast({
          message: 'Account created successfully! Welcome to Cash Flow Finder.',
          type: 'success'
        });
        
        router.push('/dashboard');
      } else {
        throw new Error(result.error?.message || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let message = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      
      addToast({
        message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-trueblue rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center heading-lg">
            Start your free trial
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Or{' '}
            <Link href="/auth/login" className="font-medium text-trueblue hover:text-deepocean">
              sign in to your existing account
            </Link>
          </p>
        </div>

        {/* Plan Selection */}
        <div className="bg-trueblue/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 capitalize">{selectedPlan} Plan</h3>
              <p className="text-sm text-muted">
                {selectedPlan === 'starter' && '$49/month after 14-day free trial'}
                {selectedPlan === 'professional' && '$149/month after 14-day free trial'}
                {selectedPlan === 'enterprise' && '$399/month after 14-day free trial'}
              </p>
            </div>
            <Link href="/" className="text-sm text-trueblue hover:text-deepocean">
              Change plan
            </Link>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="organizationName" className="label">
                Organization Name
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                required
                className="input"
                placeholder="Your Company Name"
                value={formData.organizationName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              className="h-4 w-4 text-trueblue focus:ring-trueblue border-gray-300 rounded"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <Link href="/terms" className="text-trueblue hover:text-deepocean">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-trueblue hover:text-deepocean">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating account...
                </>
              ) : (
                'Start free trial'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted">
              No credit card required. Cancel anytime during the 14-day trial.
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-muted">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <SocialAuthButtons 
                mode="signup" 
                onSuccess={() => router.push('/dashboard')}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}