export interface BookRecommendation {
  asin: string;
  title: string;
  author: string;
  description: string;
  category: string;
  relevance_score: number;
  amazon_url: string;
}

export class BookRecommendationService {
  private static readonly ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'cashflowfinder-20';
  
  private static readonly BUSINESS_BOOKS: BookRecommendation[] = [
    {
      asin: 'B07JQZQ7XV',
      title: 'Buy Then Build: How Acquisition Entrepreneurs Outsmart the Startup Game',
      author: 'Walker Deibel',
      description: 'The definitive guide to acquiring existing businesses instead of starting from scratch. Perfect for first-time business buyers.',
      category: 'acquisition_strategy',
      relevance_score: 10,
      amazon_url: ''
    },
    {
      asin: 'B08T8J7QK2',
      title: 'The Art of Selling Your Business: Winning Strategies & Secret Hacks for Exiting on Top',
      author: 'John Warrillow',
      description: 'Essential reading for understanding business valuations and what makes businesses attractive to buyers.',
      category: 'valuation',
      relevance_score: 9,
      amazon_url: ''
    },
    {
      asin: 'B09KQHQZQX',
      title: 'Due Diligence: An M&A Value Creation Approach',
      author: 'Mark Jameson',
      description: 'Comprehensive guide to conducting thorough due diligence on business acquisitions.',
      category: 'due_diligence',
      relevance_score: 9,
      amazon_url: ''
    },
    {
      asin: 'B07CVQHQHJ',
      title: 'The SBA Loan Book: The Complete Guide to Getting Approved',
      author: 'Charles Green',
      description: 'Navigate SBA loans for business acquisitions with insider strategies and proven techniques.',
      category: 'financing',
      relevance_score: 8,
      amazon_url: ''
    },
    {
      asin: 'B08XJQP9Y7',
      title: 'HBR Guide to Buying a Small Business',
      author: 'Harvard Business Review',
      description: 'Harvard Business Review\'s practical guide to small business acquisitions.',
      category: 'acquisition_strategy',
      relevance_score: 8,
      amazon_url: ''
    },
    {
      asin: 'B01MQZR5AY',
      title: 'Financial Intelligence: A Manager\'s Guide to Knowing What the Numbers Really Mean',
      author: 'Karen Berman',
      description: 'Understand financial statements and business metrics to make smarter acquisition decisions.',
      category: 'financial_analysis',
      relevance_score: 7,
      amazon_url: ''
    },
    {
      asin: 'B07H4QRJJX',
      title: 'The Outsiders: Eight Unconventional CEOs and Their Radically Rational Blueprint for Success',
      author: 'William Thorndike',
      description: 'Learn from successful business operators and their acquisition strategies.',
      category: 'business_operations',
      relevance_score: 7,
      amazon_url: ''
    },
    {
      asin: 'B08G8WJ7QZ',
      title: 'Entrepreneurship Through Acquisition',
      author: 'James Stenzel',
      description: 'Academic approach to understanding business acquisition as an entrepreneurial path.',
      category: 'acquisition_strategy',
      relevance_score: 6,
      amazon_url: ''
    },
    {
      asin: 'B0851TGQX4',
      title: 'The Complete Guide to Selling a Business',
      author: 'Fred Steingold',
      description: 'Legal and practical considerations for business transfers and acquisitions.',
      category: 'legal',
      relevance_score: 6,
      amazon_url: ''
    },
    {
      asin: 'B087XJQR9K',
      title: 'Valuation: Measuring and Managing the Value of Companies',
      author: 'McKinsey & Company',
      description: 'Professional-grade business valuation techniques from McKinsey consultants.',
      category: 'valuation',
      relevance_score: 8,
      amazon_url: ''
    }
  ];

  static getRecommendationsByIndustry(industry: string, userTier: string = 'starter'): BookRecommendation[] {
    let recommendations = [...this.BUSINESS_BOOKS];
    
    // Add industry-specific relevance scoring
    recommendations = recommendations.map(book => {
      let adjustedScore = book.relevance_score;
      
      // Industry-specific adjustments
      if (industry.toLowerCase().includes('restaurant') || industry.toLowerCase().includes('food')) {
        if (book.category === 'due_diligence' || book.category === 'financial_analysis') {
          adjustedScore += 2;
        }
      } else if (industry.toLowerCase().includes('tech') || industry.toLowerCase().includes('software')) {
        if (book.category === 'valuation' || book.category === 'acquisition_strategy') {
          adjustedScore += 2;
        }
      } else if (industry.toLowerCase().includes('service')) {
        if (book.category === 'business_operations' || book.category === 'financial_analysis') {
          adjustedScore += 1;
        }
      }
      
      return {
        ...book,
        relevance_score: adjustedScore,
        amazon_url: this.generateAmazonURL(book.asin)
      };
    });
    
    // Sort by relevance and limit based on tier
    recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
    
    const limits = {
      starter: 3,
      professional: 6,
      enterprise: 10
    };
    
    return recommendations.slice(0, limits[userTier as keyof typeof limits] || 3);
  }
  
  static getRecommendationsByFinancialData(financialData: any, userTier: string = 'starter'): BookRecommendation[] {
    let recommendations = [...this.BUSINESS_BOOKS];
    const askingPrice = financialData?.asking_price || 0;
    
    recommendations = recommendations.map(book => {
      let adjustedScore = book.relevance_score;
      
      // Price-based adjustments
      if (askingPrice < 100000) {
        // Small business focus
        if (book.category === 'financing' || book.category === 'acquisition_strategy') {
          adjustedScore += 2;
        }
      } else if (askingPrice > 1000000) {
        // Larger business focus
        if (book.category === 'valuation' || book.category === 'due_diligence') {
          adjustedScore += 2;
        }
      }
      
      // Revenue multiple analysis
      const revenue = financialData?.annual_revenue || 0;
      if (revenue > 0 && askingPrice > 0) {
        const multiple = askingPrice / revenue;
        if (multiple > 3) {
          // High multiple - focus on valuation
          if (book.category === 'valuation' || book.category === 'financial_analysis') {
            adjustedScore += 1;
          }
        }
      }
      
      return {
        ...book,
        relevance_score: adjustedScore,
        amazon_url: this.generateAmazonURL(book.asin)
      };
    });
    
    recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
    
    const limits = {
      starter: 3,
      professional: 5,
      enterprise: 8
    };
    
    return recommendations.slice(0, limits[userTier as keyof typeof limits] || 3);
  }
  
  static getRecommendationsByBusinessStage(stage: 'research' | 'due_diligence' | 'financing' | 'closing', userTier: string = 'starter'): BookRecommendation[] {
    let recommendations = [...this.BUSINESS_BOOKS];
    
    const stageRelevance = {
      research: ['acquisition_strategy', 'business_operations'],
      due_diligence: ['due_diligence', 'financial_analysis', 'valuation'],
      financing: ['financing', 'legal'],
      closing: ['legal', 'business_operations']
    };
    
    recommendations = recommendations.map(book => {
      let adjustedScore = book.relevance_score;
      
      if (stageRelevance[stage].includes(book.category)) {
        adjustedScore += 3;
      }
      
      return {
        ...book,
        relevance_score: adjustedScore,
        amazon_url: this.generateAmazonURL(book.asin)
      };
    });
    
    recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
    
    const limits = {
      starter: 2,
      professional: 4,
      enterprise: 6
    };
    
    return recommendations.slice(0, limits[userTier as keyof typeof limits] || 2);
  }
  
  private static generateAmazonURL(asin: string): string {
    return `https://www.amazon.com/dp/${asin}?tag=${this.ASSOCIATE_TAG}&linkCode=ogi&th=1&psc=1`;
  }
  
  static trackAffiliateClick(userId: string, asin: string): void {
    // This would be implemented to track clicks for attribution
    console.log(`Tracking Amazon affiliate click: User ${userId} clicked ${asin}`);
  }
}

export default BookRecommendationService;