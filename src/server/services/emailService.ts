import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export class EmailService {
  private fromEmail: string;
  private isEnabled: boolean;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'Cash Flow Finder <noreply@cashflowfinder.com>';
    this.isEnabled = !!process.env.SENDGRID_API_KEY;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isEnabled) {
      console.log('Email service is disabled. Email that would have been sent:', {
        to: options.to,
        subject: options.subject,
        from: this.fromEmail
      });
      return;
    }

    try {
      const msg: any = {
        to: options.to,
        from: this.fromEmail,
        subject: options.subject,
      };

      if (options.templateId && options.dynamicTemplateData) {
        msg.templateId = options.templateId;
        msg.dynamicTemplateData = options.dynamicTemplateData;
      } else if (options.html) {
        msg.html = options.html;
      } else if (options.text) {
        msg.text = options.text;
      } else {
        // Default text if none provided
        msg.text = 'This is an email from Cash Flow Finder.';
      }

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Welcome email for new users
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Cash Flow Finder!',
      html: `
        <h1>Welcome to Cash Flow Finder, ${name}!</h1>
        <p>Thank you for signing up. We're excited to help you find and analyze profitable businesses.</p>
        <p>Here are some things you can do to get started:</p>
        <ul>
          <li>Search for businesses in your target market</li>
          <li>Use our AI-powered due diligence tools</li>
          <li>Save businesses to your watchlist</li>
          <li>Export data for deeper analysis</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Cash Flow Finder Team</p>
      `
    });
  }

  // Password reset email
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Cash Flow Finder',
      html: `
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p><a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>The Cash Flow Finder Team</p>
      `
    });
  }

  // Subscription confirmation email
  async sendSubscriptionConfirmationEmail(email: string, tier: string): Promise<void> {
    const tierDetails: Record<string, string> = {
      starter: 'Starter ($49/month) - 100 searches/month',
      professional: 'Professional ($149/month) - 500 searches/month',
      enterprise: 'Enterprise ($399/month) - Unlimited searches'
    };

    await this.sendEmail({
      to: email,
      subject: 'Subscription Confirmed - Cash Flow Finder',
      html: `
        <h1>Your Subscription is Active!</h1>
        <p>Thank you for subscribing to Cash Flow Finder.</p>
        <p><strong>Your plan:</strong> ${tierDetails[tier] || tier}</p>
        <p>You now have access to all the features included in your plan. Login to your dashboard to start finding profitable businesses.</p>
        <p>If you have any questions about your subscription, please contact our support team.</p>
        <p>Best regards,<br>The Cash Flow Finder Team</p>
      `
    });
  }

  // Test email
  async sendTestEmail(email: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Test Email from Cash Flow Finder',
      text: 'This is a test email to verify that the email service is working correctly.',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Cash Flow Finder.</p>
        <p>If you're seeing this, the email service is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();