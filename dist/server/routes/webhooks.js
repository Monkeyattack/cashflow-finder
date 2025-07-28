"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = void 0;
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const subscriptionService_1 = require("../services/subscriptionService");
const router = (0, express_1.Router)();
exports.webhookRoutes = router;
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
// POST /api/webhooks/stripe
router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        await subscriptionService_1.subscriptionService.handleWebhook(event);
        res.json({ received: true });
    }
    catch (error) {
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
