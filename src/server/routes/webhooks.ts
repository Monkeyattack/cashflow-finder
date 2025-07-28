import { Router } from 'express';
import Stripe from 'stripe';
import { subscriptionService } from '../services/subscriptionService';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// POST /api/webhooks/stripe
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await subscriptionService.handleWebhook(event);
    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_HANDLER_FAILED',
        message: 'Failed to process webhook'
      }
    });
  }
});

export { router as webhookRoutes };