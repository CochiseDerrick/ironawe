#!/usr/bin/env node

/**
 * Stripe Webhook Testing Script
 * 
 * This script helps test your Stripe webhook endpoint locally
 * Usage: node test-stripe-webhook.js [event-type]
 */

const crypto = require('crypto');

// Test configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe/webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test123';

// Sample Stripe webhook payloads for different events
const samplePayloads = {
    'checkout.session.completed': {
        id: 'evt_test_webhook',
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'cs_test_123456789',
                object: 'checkout.session',
                amount_total: 2999,
                currency: 'gbp',
                customer_details: {
                    email: 'test@example.com',
                    name: 'Test Customer'
                },
                metadata: {
                    orderId: 'test-order-123'
                },
                payment_status: 'paid',
                status: 'complete'
            }
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
            id: 'req_test',
            idempotency_key: null
        },
        type: 'checkout.session.completed'
    },

    'payment_intent.succeeded': {
        id: 'evt_test_webhook',
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'pi_test_123456789',
                object: 'payment_intent',
                amount: 2999,
                currency: 'gbp',
                metadata: {
                    orderId: 'test-order-123'
                },
                status: 'succeeded'
            }
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
            id: 'req_test',
            idempotency_key: null
        },
        type: 'payment_intent.succeeded'
    },

    'payment_intent.payment_failed': {
        id: 'evt_test_webhook',
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'pi_test_123456789',
                object: 'payment_intent',
                amount: 2999,
                currency: 'gbp',
                metadata: {
                    orderId: 'test-order-123'
                },
                status: 'requires_payment_method',
                last_payment_error: {
                    code: 'card_declined',
                    decline_code: 'generic_decline',
                    message: 'Your card was declined.'
                }
            }
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
            id: 'req_test',
            idempotency_key: null
        },
        type: 'payment_intent.payment_failed'
    }
};

function generateStripeSignature(payload, secret, timestamp) {
    const elements = `${timestamp}.${payload}`;
    const signature = crypto
        .createHmac('sha256', secret)
        .update(elements, 'utf8')
        .digest('hex');

    return `t=${timestamp},v1=${signature}`;
}

async function testWebhook(eventType = 'checkout.session.completed') {
    const payload = samplePayloads[eventType];

    if (!payload) {
        console.error(`Unknown event type: ${eventType}`);
        console.log(`Available types: ${Object.keys(samplePayloads).join(', ')}`);
        process.exit(1);
    }

    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateStripeSignature(payloadString, WEBHOOK_SECRET, timestamp);

    console.log(`\n🧪 Testing Stripe webhook with event type: ${eventType}`);
    console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);
    console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));
    console.log(`🔐 Signature: ${signature}\n`);

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': signature
            },
            body: payloadString
        });

        const responseText = await response.text();

        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📄 Response Body:`, responseText);

        if (response.ok) {
            console.log('✅ Stripe webhook test successful!');
        } else {
            console.log('❌ Stripe webhook test failed!');
        }

    } catch (error) {
        console.error('🚨 Error testing webhook:', error.message);
    }
}

// Test connectivity first
async function testConnectivity() {
    try {
        console.log('🔍 Testing Stripe webhook endpoint connectivity...');
        const response = await fetch(WEBHOOK_URL, {method: 'GET'});
        const responseText = await response.text();

        console.log(`📊 GET Response Status: ${response.status}`);
        console.log(`📄 GET Response Body:`, responseText);

        if (response.ok) {
            console.log('✅ Stripe webhook endpoint is accessible!');
            return true;
        } else {
            console.log('⚠️  Stripe webhook endpoint returned an error');
            return false;
        }
    } catch (error) {
        console.error('🚨 Cannot reach Stripe webhook endpoint:', error.message);
        return false;
    }
}

// Main execution
async function main() {
    const eventType = process.argv[2] || 'checkout.session.completed';

    console.log('🎯 Stripe Webhook Test Suite');
    console.log('===============================');

    // Test connectivity first
    const isAccessible = await testConnectivity();

    if (isAccessible) {
        console.log('\n🚀 Running Stripe webhook test...');
        await testWebhook(eventType);
    } else {
        console.log('\n❌ Skipping webhook test due to connectivity issues');
        console.log('\n💡 Make sure your server is running:');
        console.log('   npm run dev');
        console.log('   or');
        console.log('   yarn dev');
    }

    console.log('\n🔧 Testing other event types:');
    console.log(`   node test-stripe-webhook.js payment_intent.succeeded`);
    console.log(`   node test-stripe-webhook.js payment_intent.payment_failed`);
}

// Handle fetch for older Node versions
if (!globalThis.fetch) {
    globalThis.fetch = require('node-fetch');
}

main().catch(console.error);