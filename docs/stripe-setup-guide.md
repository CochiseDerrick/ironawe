# Stripe Payment Integration Setup Guide

## 🎯 **Quick Setup Checklist**

- [ ] Create Stripe account
- [ ] Get API keys from Stripe Dashboard
- [ ] Set up environment variables
- [ ] Configure webhook endpoint
- [ ] Test the integration

## 1. Create Stripe Account

1. **Go to [Stripe.com](https://stripe.com)**
2. **Click "Start now" or "Sign up"**
3. **Create your account** with business details
4. **Complete account verification** (required for live payments)

## 2. Get Your API Keys

1. **Log into Stripe Dashboard**: https://dashboard.stripe.com
2. **Go to**: Developers → API keys
3. **Copy your keys**:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

## 3. Environment Variables Setup

Update your `.env.local` file:

```bash
# Stripe API Credentials
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret (get this in step 4)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 4. Configure Webhook Endpoint

### **Development (Local Testing)**

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login to Stripe**: `stripe login`
3. **Forward events to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. **Copy the webhook secret** from the CLI output
5. **Add to `.env.local`**: `STRIPE_WEBHOOK_SECRET=whsec_...`

### **Production**

1. **In Stripe Dashboard**: Developers → Webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
4. **Select events**:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `checkout.session.expired`
5. **Copy webhook secret** and add to production environment

## 5. Test Your Integration

### **Test the Payment Flow**

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Go to checkout**: http://localhost:3000/checkout

3. **Use Stripe test cards**:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires authentication**: `4000 0025 0000 3155`

4. **Use any future date for expiry** and any 3-digit CVC

### **Test Webhooks**

1. **Start Stripe CLI forwarding**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Make a test payment** and watch webhook events in CLI

3. **Check your database** to see order status updates

## 6. Production Deployment

### **Environment Variables**

Set these in your production environment:

```bash
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### **Switch to Live Mode**

1. **In Stripe Dashboard**: Toggle "View test data" OFF
2. **Get your live API keys**: Developers → API keys
3. **Update production environment** with live keys
4. **Create production webhook endpoint**

## 7. Stripe Features Included

### **✅ What's Implemented**

- **Secure checkout sessions** with customer details
- **Automatic tax calculation** (configurable)
- **Shipping address collection**
- **Order tracking** with Stripe session IDs
- **Webhook payment verification**
- **Multiple payment methods** (cards, digital wallets)
- **3D Secure authentication** support
- **Failed payment handling**

### **🎨 Checkout Features**

- **Line items** with product details and images
- **Shipping costs** as separate line items
- **Customer email** pre-filled
- **Order metadata** for tracking
- **Success/cancel URLs** configured

### **🔒 Security Features**

- **Webhook signature verification**
- **Server-side payment processing**
- **No sensitive card data** touches your servers
- **PCI compliance** handled by Stripe

## 8. Monitoring & Analytics

### **Stripe Dashboard**

- **Payments**: View all transactions
- **Customers**: Customer management
- **Disputes**: Handle chargebacks
- **Analytics**: Revenue reports
- **Logs**: API request logs

### **Your Database**

- **Orders**: Linked to Stripe sessions
- **Payment status**: Real-time updates via webhooks
- **Customer data**: Synchronized with Stripe

## 9. Common Issues & Solutions

### **"Invalid API Key"**
- Check you're using the correct key for test/live mode
- Ensure no extra spaces in environment variables

### **"Webhook Signature Verification Failed"**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check webhook endpoint URL matches exactly

### **"Order Not Found"**
- Ensure order is created before Stripe checkout
- Check Stripe session ID is stored correctly

### **Payment Succeeds but Order Not Updated**
- Check webhook is receiving events
- Verify webhook handler is processing correctly
- Check database connection in webhook

## 10. Going Live

### **Checklist**

- [ ] Account verification complete
- [ ] Live API keys configured
- [ ] Production webhook endpoint active
- [ ] SSL certificate valid
- [ ] Test live payment with real card
- [ ] Monitor initial transactions

### **Test Cards for Live Mode**

⚠️ **Only use real cards in live mode!**

Use Stripe's test cards only in test mode. In live mode, real transactions will be charged.

## 🎉 **You're All Set!**

Your IronAwe e-commerce site now has:
- ✅ Professional payment processing with Stripe
- ✅ Secure webhook-based order updates
- ✅ Comprehensive error handling
- ✅ Real-time payment verification
- ✅ Production-ready configuration

**Need Help?**
- **Stripe Docs**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Stripe Discord**: https://stripe.com/go/developer-chat