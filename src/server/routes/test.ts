import { Router } from 'express';
import { emailService } from '../services/emailService';

const router = Router();

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    await emailService.sendTestEmail(email);
    
    res.json({
      success: true,
      message: `Test email sent to ${email}`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email'
    });
  }
});

export const testRoutes = router;