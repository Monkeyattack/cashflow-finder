'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    // Redirect authenticated users to dashboard
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="heading-lg mb-4">Welcome back!</h1>
          <p className="text-muted mb-6">Redirecting you to your dashboard...</p>
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="heading-xl text-white mb-6">
              Find Your Next Business Acquisition
            </h1>
            <p className="text-xl mb-8 text-white/90">
              AI-powered due diligence and comprehensive business data to help you make informed acquisition decisions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="btn btn-secondary">
                Start Free Trial
              </Link>
              <Link href="/auth/login" className="btn bg-white/10 text-white hover:bg-white/20 border border-white/20">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Everything You Need for Business Acquisition</h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              From search to closing, we provide the tools and insights you need to find and acquire profitable businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-12 h-12 bg-trueblue/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-trueblue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="heading-sm mb-2">Advanced Search</h3>
              <p className="text-muted">
                Find businesses with powerful filters including industry, location, financials, and custom metrics
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="heading-sm mb-2">AI Due Diligence</h3>
              <p className="text-muted">
                Automated risk assessment, ROI projections, and SBA loan qualification analysis powered by AI
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="heading-sm mb-2">Financial Analysis</h3>
              <p className="text-muted">
                Comprehensive financial metrics, cash flow analysis, and valuation tools to make informed decisions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted">
              Start with our free trial and upgrade as your needs grow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="card">
              <div className="text-center mb-6">
                <h3 className="heading-sm mb-2">Starter</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-muted">/month</span>
                </div>
                <p className="text-muted">Perfect for individual investors</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100 searches/month
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Basic listing access
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Email support
                </li>
              </ul>
              <Link href="/auth/signup?plan=starter" className="btn btn-secondary w-full">
                Start Free Trial
              </Link>
            </div>

            {/* Professional */}
            <div className="card border-2 border-trueblue relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-trueblue text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="heading-sm mb-2">Professional</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$149</span>
                  <span className="text-muted">/month</span>
                </div>
                <p className="text-muted">For growing businesses</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  500 searches/month
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Data exports & analytics
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Due diligence reports
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Priority support
                </li>
              </ul>
              <Link href="/auth/signup?plan=professional" className="btn btn-primary w-full">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="card">
              <div className="text-center mb-6">
                <h3 className="heading-sm mb-2">Enterprise</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$399</span>
                  <span className="text-muted">/month</span>
                </div>
                <p className="text-muted">For large organizations</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited searches
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  API access
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Custom integrations
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Dedicated support
                </li>
              </ul>
              <Link href="/auth/signup?plan=enterprise" className="btn btn-secondary w-full">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="heading-lg text-white mb-4">Ready to Find Your Next Business?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of investors and brokers who trust Cash Flow Finder for their business acquisition needs
          </p>
          <Link href="/auth/signup" className="btn btn-primary">
            Start Your Free Trial Today
          </Link>
        </div>
      </section>
    </div>
  );
}