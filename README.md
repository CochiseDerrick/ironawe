# IronAwe

A modern e-commerce platform built with Next.js, featuring a sleek design and powerful functionality for selling products online.

## 🚀 Features

- **Modern UI/UX**: Built with Next.js 15, React 18, and Tailwind CSS
- **Product Management**: Complete product catalog with categories and detailed views
- **Shopping Cart**: Persistent cart functionality with local storage
- **Stripe Payments**: Secure payment processing with Stripe Checkout
- **Admin Dashboard**: Comprehensive admin panel for managing products, orders, and customers
- **Responsive Design**: Fully responsive across all device sizes
- **Firebase Integration**: Real-time database and authentication
- **Image Upload**: Cloudinary integration for image management
- **Analytics**: Built-in analytics for tracking page views and user interactions

## 💳 Payment Integration

This project uses **Stripe** for secure payment processing:

- **Stripe Checkout**: Professional checkout experience
- **Webhook Integration**: Real-time payment status updates
- **Multiple Payment Methods**: Cards, Apple Pay, Google Pay, and more
- **Secure Processing**: PCI-compliant payment handling
- **Test Mode**: Safe testing with Stripe test cards

### Setting Up Payments

1. **Create a Stripe account** at [stripe.com](https://stripe.com)
2. **Get your API keys** from the Stripe Dashboard
3. **Configure environment variables** (see setup guide)
4. **Set up webhooks** for payment notifications

📖 **See the complete setup guide**: [docs/stripe-setup-guide.md](docs/stripe-setup-guide.md)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Image Storage**: Cloudinary
- **Form Handling**: React Hook Form + Zod
- **State Management**: React Context + Custom Hooks

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account
- Stripe account
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ironawe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your environment variables** in `.env.local`:
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Application Configuration
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 📦 Project Structure

```
src/
├── actions/           # Server actions for data mutations
├── app/              # Next.js app router pages
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and configurations
└── types/           # TypeScript type definitions
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checking

### Testing Payments

Use Stripe's test card numbers:

- **Successful payment**: `4242 4242 4242 4242`
- **Card declined**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

## 🚀 Deployment

This project is ready for deployment on platforms like:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Firebase Hosting**
- **AWS Amplify**

### Environment Variables for Production

Make sure to set these environment variables in your deployment platform:

1. All Firebase configuration variables
2. Stripe live API keys (replace `sk_test_` with `sk_live_`)
3. Cloudinary configuration
4. `NEXT_PUBLIC_BASE_URL` to your domain

### Stripe Webhooks for Production

1. Create a webhook endpoint in Stripe Dashboard
2. Point it to: `https://your-domain.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.expired`

## 📚 Documentation

- **[Stripe Setup Guide](docs/stripe-setup-guide.md)** - Complete payment integration setup
- **[Project Blueprint](docs/blueprint.md)** - Detailed project architecture

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
