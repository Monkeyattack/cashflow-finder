import axios from 'axios';
import { BusinessListing } from '../../types';

// Free alternative data sources to Twitter API
export class FreeDataSources {

  // Google Alerts - Free business opportunity monitoring
  async setupGoogleAlerts(): Promise<string[]> {
    const alerts = [
      'business for sale site:twitter.com',
      'startup acquisition site:twitter.com', 
      'saas for sale site:twitter.com',
      'selling my business site:linkedin.com',
      'business opportunity site:reddit.com/r/entrepreneur'
    ];

    console.log('📧 Set up Google Alerts for these searches:');
    alerts.forEach(alert => console.log(`  - ${alert}`));
    console.log('\n🔗 Create alerts at: https://www.google.com/alerts');
    
    return alerts;
  }

  // Reddit API - Free access to business communities  
  async fetchFromRedditFree(): Promise<BusinessListing[]> {
    console.log('📱 Fetching from Reddit (Free API)...');
    
    const subreddits = [
      'entrepreneur',
      'SideProject', 
      'startups',
      'BusinessForSale',
      'SaaS'
    ];

    const listings: BusinessListing[] = [];

    for (const subreddit of subreddits) {
      try {
        // Reddit public JSON API (no auth required)
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/search.json?q="for sale" OR "selling" OR "acquisition"&sort=new&limit=10`);
        
        const posts = response.data.data.children;
        
        for (const post of posts) {
          const postData = post.data;
          
          // Parse business opportunities from post titles/content
          const listing = this.parseRedditPost(postData, subreddit);
          if (listing) {
            listings.push(listing);
          }
        }
        
        // Be respectful - delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`Error fetching from r/${subreddit}:`, error.message);
      }
    }

    console.log(`✅ Found ${listings.length} opportunities from Reddit`);
    return listings;
  }

  private parseRedditPost(postData: any, subreddit: string): BusinessListing | null {
    const title = postData.title.toLowerCase();
    const content = postData.selftext?.toLowerCase() || '';
    
    // Look for business sale indicators
    const saleKeywords = ['for sale', 'selling', 'acquisition', 'exit', 'buy my'];
    const hasSaleKeywords = saleKeywords.some(keyword => 
      title.includes(keyword) || content.includes(keyword)
    );
    
    if (!hasSaleKeywords) return null;

    // Extract potential price information
    const priceMatch = (title + ' ' + content).match(/\$([0-9,]+)/);
    const asking_price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
    
    // Determine industry from subreddit and content
    let industry = 'Technology'; // Default
    if (subreddit === 'entrepreneur') industry = 'Various';
    if (title.includes('saas') || content.includes('saas')) industry = 'Technology';
    if (title.includes('ecommerce') || content.includes('store')) industry = 'E-commerce';
    if (title.includes('newsletter') || content.includes('blog')) industry = 'Media & Publishing';

    return {
      id: `reddit_${postData.id}`,
      name: `Business Opportunity (Reddit: r/${subreddit})`,
      industry,
      location: {
        city: 'Remote',
        state: 'Unknown', 
        country: 'Unknown'
      },
      financial_data: {
        asking_price: asking_price || 25000, // Default estimate
        year_established: new Date().getFullYear() - 2
      },
      contact_info: {
        listing_url: `https://reddit.com${postData.permalink}`,
        broker_name: postData.author
      },
      quality_score: 60, // Medium quality for Reddit posts
      risk_score: 70, // Higher risk due to limited verification
      data_sources: ['Reddit'],
      last_updated: new Date(),
      created_at: new Date(postData.created_utc * 1000)
    };
  }

  // HackerNews Who's Hiring - Free startup/business opportunities
  async fetchFromHackerNews(): Promise<BusinessListing[]> {
    console.log('📰 Checking HackerNews for business opportunities...');
    
    try {
      // HackerNews API is free
      const response = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topStories = response.data.slice(0, 50); // Check top 50 stories
      
      const listings: BusinessListing[] = [];
      
      for (const storyId of topStories) {
        try {
          const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
          const story = storyResponse.data;
          
          if (story.title && story.title.toLowerCase().includes('acquisition') || 
              story.title.toLowerCase().includes('for sale') ||
              story.title.toLowerCase().includes('selling my')) {
            
            const listing: BusinessListing = {
              id: `hn_${storyId}`,
              name: story.title,
              industry: 'Technology',
              location: {
                city: 'Remote',
                state: 'Unknown',
                country: 'Unknown'
              },
              financial_data: {
                asking_price: 100000, // Estimate for HN startups
                year_established: new Date().getFullYear() - 3
              },
              contact_info: {
                listing_url: `https://news.ycombinator.com/item?id=${storyId}`,
                broker_name: story.by
              },
              quality_score: 75, // Higher quality for HN
              risk_score: 60, // Lower risk, tech-focused
              data_sources: ['HackerNews'],
              last_updated: new Date(),
              created_at: new Date(story.time * 1000)
            };
            
            listings.push(listing);
          }
          
          // Rate limiting for HN API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error fetching HN story ${storyId}:`, error);
        }
      }
      
      console.log(`✅ Found ${listings.length} opportunities from HackerNews`);
      return listings;
      
    } catch (error: any) {
      console.error('Error fetching from HackerNews:', error.message);
      return [];
    }
  }

  // IndieHackers - Free access to founder discussions
  async fetchFromIndieHackers(): Promise<BusinessListing[]> {
    console.log('🚀 Monitoring IndieHackers for opportunities...');
    
    // IndieHackers doesn't have a public API, but we can return mock data
    // that represents what you'd find by manually monitoring
    const mockListings: BusinessListing[] = [
      {
        id: 'ih_mock_1',
        name: 'B2B SaaS Tool (IndieHackers)',
        industry: 'Technology',
        location: {
          city: 'Remote',
          state: 'Unknown',
          country: 'Unknown'
        },
        financial_data: {
          asking_price: 150000,
          annual_revenue: 96000, // 8k * 12
          year_established: 2021
        },
        contact_info: {
          listing_url: 'https://indiehackers.com/post/123',
          broker_name: 'IndieHacker Founder'
        },
        quality_score: 85, // High quality, verified founders
        risk_score: 45, // Lower risk, transparent community
        data_sources: ['IndieHackers'],
        last_updated: new Date(),
        created_at: new Date()
      }
    ];

    console.log(`📋 Mock data: ${mockListings.length} IndieHackers opportunities`);
    return mockListings;
  }

  // Consolidated free data import
  async importAllFreeSources(): Promise<BusinessListing[]> {
    console.log('🆓 Starting free data source import...\n');
    
    const allListings: BusinessListing[] = [];
    
    try {
      // Reddit (Free API)
      const redditListings = await this.fetchFromRedditFree();
      allListings.push(...redditListings);
      
      // HackerNews (Free API)
      const hnListings = await this.fetchFromHackerNews();
      allListings.push(...hnListings);
      
      // IndieHackers (Manual monitoring simulation)
      const ihListings = await this.fetchFromIndieHackers();
      allListings.push(...ihListings);
      
      console.log(`\n🎉 Total free opportunities found: ${allListings.length}`);
      
      // Set up Google Alerts for ongoing monitoring
      await this.setupGoogleAlerts();
      
      return allListings;
      
    } catch (error) {
      console.error('Error in free data import:', error);
      return allListings;
    }
  }

  // Manual Twitter monitoring setup (Free alternative)
  async setupFreeTwitterMonitoring(): Promise<string[]> {
    const tweetdeckColumns = [
      'business for sale',
      'selling my business',
      'startup acquisition', 
      'saas for sale',
      'website for sale',
      'app for sale'
    ];

    console.log('🐦 Set up TweetDeck columns for manual monitoring:');
    tweetdeckColumns.forEach(column => console.log(`  - ${column}`));
    console.log('\n🔗 Access TweetDeck at: https://tweetdeck.twitter.com');
    console.log('💡 Check columns 2-3 times per day for new opportunities');
    
    return tweetdeckColumns;
  }
}

export const freeDataSources = new FreeDataSources();