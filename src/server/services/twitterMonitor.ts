import axios from 'axios';

interface TwitterConfig {
  bearerToken: string;
  keywords: string[];
  minFollowers?: number;
  languages?: string[];
}

interface TweetData {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  author?: {
    username: string;
    name: string;
    public_metrics: {
      followers_count: number;
      following_count: number;
    };
  };
}

export class TwitterMonitor {
  private bearerToken: string;
  private baseUrl = 'https://api.twitter.com/2';

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }

  // Search for business opportunity tweets
  async searchBusinessOpportunities(keywords: string[] = [
    'business for sale',
    'selling my business', 
    'startup acquisition',
    'saas for sale',
    'website for sale',
    'app for sale',
    'newsletter for sale',
    'ecommerce for sale'
  ]): Promise<TweetData[]> {
    
    if (!this.bearerToken || this.bearerToken === 'your_twitter_bearer_token') {
      console.log('Twitter Bearer Token not configured - using mock data');
      return this.getMockTweets();
    }

    try {
      const query = keywords.map(kw => `"${kw}"`).join(' OR ');
      
      const response = await axios.get(`${this.baseUrl}/tweets/search/recent`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        },
        params: {
          query: `(${query}) -is:retweet lang:en`,
          'tweet.fields': 'created_at,public_metrics,author_id',
          'user.fields': 'username,name,public_metrics',
          'expansions': 'author_id',
          'max_results': 100
        }
      });

      const tweets = response.data.data || [];
      const users = response.data.includes?.users || [];

      // Combine tweet and user data
      return tweets.map((tweet: any) => {
        const author = users.find((user: any) => user.id === tweet.author_id);
        return {
          ...tweet,
          author
        };
      });

    } catch (error: any) {
      console.error('Twitter API error:', error.response?.data || error.message);
      return this.getMockTweets();
    }
  }

  // Parse tweets for business opportunities
  parseTweetForBusiness(tweet: TweetData): any | null {
    const text = tweet.text.toLowerCase();
    
    // Extract potential business info using regex
    const priceMatch = text.match(/\$([0-9,]+)/);
    const revenueMatch = text.match(/revenue[:\s]*\$([0-9,k]+)/i);
    const profitMatch = text.match(/profit[:\s]*\$([0-9,k]+)/i);
    const usersMatch = text.match(/([0-9,k]+)\s*(users|subscribers|customers)/i);
    
    // Only proceed if there are business indicators
    if (!priceMatch && !revenueMatch && !profitMatch) {
      return null;
    }
    
    // Extract business type/industry
    let industry = 'Technology'; // Default
    if (text.includes('saas') || text.includes('software')) industry = 'Technology';
    else if (text.includes('ecommerce') || text.includes('shopify')) industry = 'E-commerce';
    else if (text.includes('newsletter') || text.includes('blog')) industry = 'Media & Publishing';
    else if (text.includes('app') || text.includes('chrome extension')) industry = 'Technology';
    else if (text.includes('website') || text.includes('domain')) industry = 'Technology';
    
    // Convert text numbers to actual numbers
    const convertToNumber = (str: string): number => {
      if (!str) return 0;
      str = str.replace(/,/g, '');
      if (str.includes('k')) return parseFloat(str) * 1000;
      if (str.includes('m')) return parseFloat(str) * 1000000;
      return parseFloat(str) || 0;
    };
    
    const asking_price = priceMatch ? convertToNumber(priceMatch[1]) : 0;
    const revenue = revenueMatch ? convertToNumber(revenueMatch[1]) : 0;
    const profit = profitMatch ? convertToNumber(profitMatch[1]) : 0;
    const users = usersMatch ? convertToNumber(usersMatch[1]) : 0;
    
    return {
      source: 'Twitter',
      external_id: `twitter_${tweet.id}`,
      name: `Business Opportunity (Twitter: @${tweet.author?.username})`,
      industry,
      location: {
        city: 'Remote',
        state: 'Unknown',
        country: 'Unknown'
      },
      financial_data: {
        asking_price,
        annual_revenue: revenue,
        monthly_profit: profit / 12, // Assume annual profit
        established_year: new Date().getFullYear() - 2 // Estimate
      },
      contact_info: {
        listing_url: `https://twitter.com/${tweet.author?.username}/status/${tweet.id}`,
        description: tweet.text,
        broker_name: tweet.author?.name,
        broker_email: `@${tweet.author?.username} (Twitter DM)`
      },
      additional_data: {
        twitter_metrics: {
          likes: tweet.public_metrics.like_count,
          retweets: tweet.public_metrics.retweet_count,
          replies: tweet.public_metrics.reply_count,
          author_followers: tweet.author?.public_metrics.followers_count
        },
        user_count: users,
        reason_for_sale: 'See tweet for details',
        created_at: tweet.created_at
      }
    };
  }

  // Filter high-quality opportunities
  filterQualityOpportunities(opportunities: any[]): any[] {
    return opportunities.filter(opp => {
      // Minimum price threshold
      if (opp.financial_data.asking_price < 10000) return false;
      
      // Author must have reasonable follower count (reduces spam)
      if (opp.additional_data.twitter_metrics.author_followers < 100) return false;
      
      // Must have some engagement
      const totalEngagement = opp.additional_data.twitter_metrics.likes + 
                            opp.additional_data.twitter_metrics.retweets + 
                            opp.additional_data.twitter_metrics.replies;
      if (totalEngagement < 5) return false;
      
      return true;
    });
  }

  // Get mock Twitter data for testing
  private getMockTweets(): TweetData[] {
    return [
      {
        id: '1234567890',
        text: 'Selling my SaaS that does $8k MRR. Built over 2 years, 500+ customers. Looking for $120k. Includes training and handover. DM if interested. #SaaS #BusinessForSale',
        author_id: 'user123',
        created_at: '2024-01-15T10:30:00Z',
        public_metrics: {
          retweet_count: 12,
          like_count: 45,
          reply_count: 8,
          quote_count: 3
        },
        author: {
          username: 'saasfounder',
          name: 'John SaaS Builder',
          public_metrics: {
            followers_count: 2500,
            following_count: 800
          }
        }
      },
      {
        id: '2345678901',
        text: 'Time to sell my profitable newsletter with 12k subscribers. Consistent $3k/month revenue. Health niche. Asking $45k. Fully automated systems. DM for details.',
        author_id: 'user456',
        created_at: '2024-01-14T15:45:00Z',
        public_metrics: {
          retweet_count: 8,
          like_count: 23,
          reply_count: 15,
          quote_count: 2
        },
        author: {
          username: 'newsletterpro',
          name: 'Sarah Newsletter',
          public_metrics: {
            followers_count: 1800,
            following_count: 600
          }
        }
      },
      {
        id: '3456789012',
        text: 'Chrome extension with 85k active users for sale. Makes $5k/month passive income. Perfect side business. Asking $75k. All documentation included.',
        author_id: 'user789',
        created_at: '2024-01-13T09:20:00Z',
        public_metrics: {
          retweet_count: 25,
          like_count: 67,
          reply_count: 20,
          quote_count: 5
        },
        author: {
          username: 'chromedev',
          name: 'Mike Chrome Dev',
          public_metrics: {
            followers_count: 4200,
            following_count: 1200
          }
        }
      }
    ];
  }

  // Monitor Twitter continuously
  async startMonitoring(intervalMinutes: number = 60): Promise<void> {
    console.log(`🐦 Starting Twitter monitoring (checking every ${intervalMinutes} minutes)...`);
    
    const monitorFunction = async () => {
      try {
        const tweets = await this.searchBusinessOpportunities();
        const opportunities = tweets
          .map(tweet => this.parseTweetForBusiness(tweet))
          .filter(opp => opp !== null);
        
        const qualityOpportunities = this.filterQualityOpportunities(opportunities);
        
        if (qualityOpportunities.length > 0) {
          console.log(`🔍 Found ${qualityOpportunities.length} potential opportunities on Twitter`);
          
          // Here you would typically save to database or send notifications
          qualityOpportunities.forEach(opp => {
            console.log(`  💡 ${opp.name} - $${opp.financial_data.asking_price.toLocaleString()}`);
          });
        }
        
      } catch (error) {
        console.error('Twitter monitoring error:', error);
      }
    };
    
    // Run immediately, then on interval
    await monitorFunction();
    setInterval(monitorFunction, intervalMinutes * 60 * 1000);
  }
}

// Export configured instance
export const twitterMonitor = new TwitterMonitor(
  process.env.TWITTER_BEARER_TOKEN || 'your_twitter_bearer_token'
);