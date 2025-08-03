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
    // General Business Acquisition
    {
      asin: 'B07VSXS4NK',
      title: 'Buy Then Build: How Acquisition Entrepreneurs Outsmart the Startup Game',
      author: 'Walker Deibel',
      description: 'The definitive guide to acquiring existing businesses instead of starting from scratch. Perfect for first-time business buyers.',
      category: 'acquisition_strategy',
      relevance_score: 10,
      amazon_url: ''
    },
    {
      asin: 'B07C7M8SX9',
      title: 'The Art of Selling Your Business: Winning Strategies & Secret Hacks for Exiting on Top',
      author: 'John Warrillow',
      description: 'Essential reading for understanding business valuations and what makes businesses attractive to buyers.',
      category: 'valuation',
      relevance_score: 9,
      amazon_url: ''
    },
    {
      asin: 'B00AKL36M8',
      title: 'Financial Intelligence: A Manager\'s Guide to Knowing What the Numbers Really Mean',
      author: 'Karen Berman',
      description: 'Understand financial statements and business metrics to make smarter acquisition decisions.',
      category: 'financial_analysis',
      relevance_score: 9,
      amazon_url: ''
    },
    {
      asin: 'B071HFNVMN',
      title: 'HBR Guide to Buying a Small Business',
      author: 'Harvard Business Review',
      description: 'Harvard Business Review\'s practical guide to small business acquisitions.',
      category: 'acquisition_strategy',
      relevance_score: 8,
      amazon_url: ''
    },
    {
      asin: 'B0058DRWRC',
      title: 'The Outsiders: Eight Unconventional CEOs and Their Radically Rational Blueprint for Success',
      author: 'William Thorndike',
      description: 'Learn from successful business operators and their acquisition strategies.',
      category: 'business_operations',
      relevance_score: 8,
      amazon_url: ''
    },
    {
      asin: 'B08FHBV4ZX',
      title: 'Valuation: Measuring and Managing the Value of Companies',
      author: 'McKinsey & Company',
      description: 'Professional-grade business valuation techniques from McKinsey consultants.',
      category: 'valuation',
      relevance_score: 7,
      amazon_url: ''
    },
    {
      asin: 'B004XNLU9Q',
      title: 'Mergers, Acquisitions, and Corporate Restructurings',
      author: 'Patrick Gaughan',
      description: 'Comprehensive guide to M&A strategies and corporate restructuring.',
      category: 'acquisition_strategy',
      relevance_score: 7,
      amazon_url: ''
    },
    {
      asin: 'B00JJ5QQ64',
      title: 'The SBA Loan Book: The Complete Guide to Getting Approved',
      author: 'Charles Green',
      description: 'Navigate SBA loans for business acquisitions with insider strategies.',
      category: 'financing',
      relevance_score: 6,
      amazon_url: ''
    },
    
    // Food & Beverage Industry Specific
    {
      asin: '1118336232',
      title: 'Restaurant Financial Basics',
      author: 'Raymond Goodman Jr.',
      description: 'Financial management essentials for restaurant owners and investors.',
      category: 'food_beverage',
      relevance_score: 9,
      amazon_url: ''
    },
    {
      asin: '0471213659',
      title: 'The Upstart Guide to Owning and Managing a Restaurant',
      author: 'Roy Alonzo',
      description: 'Complete guide to restaurant ownership, operations, and profitability.',
      category: 'food_beverage',
      relevance_score: 8,
      amazon_url: ''
    },
    
    // Technology Industry Specific
    {
      asin: '0062418203',
      title: 'The Technology Fallacy: How People Are the Real Key to Digital Transformation',
      author: 'Gerald Kane',
      description: 'Understanding the human side of technology business acquisitions.',
      category: 'technology',
      relevance_score: 8,
      amazon_url: ''
    },
    {
      asin: '0062560921',
      title: 'The Unicorn\'s Shadow: Combating the Dangerous Myths that Hold Back Startups',
      author: 'Ethan Mollick',
      description: 'Critical insights for evaluating technology companies and startups.',
      category: 'technology',
      relevance_score: 8,
      amazon_url: ''
    },
    
    // Healthcare Industry Specific
    {
      asin: '1449659799',
      title: 'Healthcare Finance and Financial Management: Essentials for Advanced Practice Nurses',
      author: 'Donna Torrisi',
      description: 'Financial management principles for healthcare business acquisitions.',
      category: 'healthcare',
      relevance_score: 8,
      amazon_url: ''
    },
    {
      asin: '1284102238',
      title: 'Medical Practice Management: Concepts and Applications',
      author: 'Marsha Hemby',
      description: 'Comprehensive guide to medical practice operations and valuation.',
      category: 'healthcare',
      relevance_score: 8,
      amazon_url: ''
    },
    
    // Retail Industry Specific
    {
      asin: '0470637692',
      title: 'Retail Management: A Strategic Approach',
      author: 'Barry Berman',
      description: 'Strategic retail management for business acquisition evaluation.',
      category: 'retail',
      relevance_score: 8,
      amazon_url: ''
    },
    {
      asin: '0137069618',
      title: 'Strategic Retail Management: Text and International Cases',
      author: 'Joachim Zentes',
      description: 'International perspective on retail business strategy and operations.',
      category: 'retail',
      relevance_score: 7,
      amazon_url: ''
    },
    
    // Manufacturing Industry Specific
    {
      asin: '0071756051',
      title: 'Lean Manufacturing Implementation Strategies That Work',
      author: 'Larry Fast',
      description: 'Operational excellence strategies for manufacturing businesses.',
      category: 'manufacturing',
      relevance_score: 8,
      amazon_url: ''
    },
    {
      asin: '0814415210',
      title: 'The Manufacturer\'s Guide to Implementing the Theory of Constraints',
      author: 'Mark Woeppel',
      description: 'Performance improvement strategies for manufacturing acquisitions.',
      category: 'manufacturing',
      relevance_score: 7,
      amazon_url: ''
    }
  ];

  static getRecommendationsByIndustry(industry: string, userTier: string = 'starter'): BookRecommendation[] {
    let recommendations = [...this.BUSINESS_BOOKS];
    
    // Create industry mapping for better categorization
    const industryMapping = {
      'Food & Beverage': ['food_beverage', 'acquisition_strategy', 'financial_analysis'],
      'Restaurant': ['food_beverage', 'acquisition_strategy', 'financial_analysis'],
      'Technology': ['technology', 'acquisition_strategy', 'valuation'],
      'Healthcare': ['healthcare', 'acquisition_strategy', 'financial_analysis'],
      'Retail': ['retail', 'acquisition_strategy', 'business_operations'],
      'Professional Services': ['business_operations', 'acquisition_strategy', 'financial_analysis'],
      'Manufacturing': ['manufacturing', 'acquisition_strategy', 'valuation'],
      'Automotive': ['manufacturing', 'acquisition_strategy', 'business_operations'],
      'Construction': ['business_operations', 'acquisition_strategy', 'financial_analysis']
    };
    
    // Add industry-specific relevance scoring
    recommendations = recommendations.map(book => {
      let adjustedScore = book.relevance_score;
      
      // Get relevant categories for this industry
      const relevantCategories = industryMapping[industry as keyof typeof industryMapping] || ['acquisition_strategy'];
      
      // Boost scores for industry-specific books
      if (relevantCategories.includes(book.category)) {
        adjustedScore += 3;
      }
      
      // Special boost for exact industry matches
      if (industry.toLowerCase().includes('food') || industry.toLowerCase().includes('restaurant')) {
        if (book.category === 'food_beverage') adjustedScore += 5;
      } else if (industry.toLowerCase().includes('tech')) {
        if (book.category === 'technology') adjustedScore += 5;
      } else if (industry.toLowerCase().includes('healthcare')) {
        if (book.category === 'healthcare') adjustedScore += 5;
      } else if (industry.toLowerCase().includes('retail')) {
        if (book.category === 'retail') adjustedScore += 5;
      } else if (industry.toLowerCase().includes('manufacturing')) {
        if (book.category === 'manufacturing') adjustedScore += 5;
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
    return `https://www.amazon.com/dp/${asin}?tag=${this.ASSOCIATE_TAG}`;
  }
  
  static trackAffiliateClick(userId: string, asin: string): void {
    // This would be implemented to track clicks for attribution
    console.log(`Tracking Amazon affiliate click: User ${userId} clicked ${asin}`);
  }
}

export default BookRecommendationService;