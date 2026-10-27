# Apex Megastore: Production Full-Stack E-Commerce Application

A production-style full-stack e-commerce megastore engineered with **React 19 / TypeScript**, **Express.js API Layer**, **Tailwind CSS**, and **AWS DynamoDB DocumentClient** single-table architecture.

Built as a Software Engineer Intern Task Submission, demonstrating complete software engineering rigor:
**Requirements $\to$ Architecture $\to$ DynamoDB Modeling $\to$ Full-Stack API $\to$ Responsive Storefront $\to$ Testing $\to$ Documentation**.

---

## 🔗 Submission Links
- **GitHub Repository**: [https://github.com/sathwik-svg/Production-Ready-E-Commerce-Application](https://github.com/sathwik-svg/Production-Ready-E-Commerce-Application)
- **Live Application URL**: [https://ais-pre-jjzchxwicy22ruhu4vp27x-981864576343.asia-east1.run.app](https://ais-pre-jjzchxwicy22ruhu4vp27x-981864576343.asia-east1.run.app)

---

## 🌟 Key Features

### 1. Storefront & Catalog Discovery
- **Modern Responsive Layout**: High-density 1440px desktop baseline with mobile & tablet responsiveness.
- **Multi-Category Navigation**: Tech & Audio, Apparel & Carry, Home & Living.
- **Dynamic Search & Filtering**: Multi-facet querying by text, category, price range, and stock availability.
- **Tabular Pricing & Zero-Pill Typography**: Natural editorial layout avoiding AI cliches, with tabular numerals for aligned prices.
- **Contiguous Product Detail Page (PDP)**: Multi-angle image galleries, technical specs, inventory indicators, and related products.

### 2. Shopping Cart & Wishlist
- **Persistent Cart**: Synchronized through REST API to DynamoDB DocumentClient (`USER#<id>` $\to$ `CART#<productId>`).
- **Interactive Quantity Controls**: Real-time subtotal calculation, free delivery progress tracker ($150 threshold), and duplicate protection.
- **Duplicate-Safe Wishlist**: Instant toggle with "Move to Bag" capability.
- **Promotional Engine**: Live promo code validator (`SAVE10`, `APEX20`, `INTERN100`).

### 3. End-to-End Checkout & Order Tracking
- **Multi-Step Checkout**:
  - Step 1: Contact & Shipping Address validation
  - Step 2: Shipping method selection (Standard Insured vs. Air Priority)
  - Step 3: Payment simulation (Credit Card / Apple Pay / Cash on Delivery)
- **Live Order Tracking**: Interactive 5-stage progress timeline (Confirmed $\to$ Processing $\to$ Shipped $\to$ Out for Delivery $\to$ Delivered), carrier tracking numbers, and receipt breakdown.

### 4. Interactive DynamoDB Inspector (Internship Showcase)
- Built-in developer drawer (click the **Database icon** in the top navigation bar) allowing internship evaluators to inspect:
  - Active persistence mode (Live AWS Cloud vs. DocumentClient Embedded Engine)
  - Single-Table partition keys (`PK`) and sort keys (`SK`)
  - Live table items with expandable JSON DocumentClient payloads
  - Single-click database reset and re-seed

### 5. Amazon API & Prime Integration
- **Amazon Product Advertising API (PA-API v5)**: Search live Amazon marketplace items by keyword or ASIN, view Prime eligibility, review stats, and price comparisons.
- **1-Click DynamoDB Catalog Import**: Seamlessly import any Amazon product by ASIN directly into the single-table DynamoDB database with proper metadata mapping.
- **Real-Time Price Match**: Compares store pricing directly against Amazon live prices on product detail views.
- **Buy with Prime & Amazon Pay**: Integrated 1-click checkout option simulating Amazon Pay with A-to-z Guarantee and 1-Day Prime delivery fulfillment.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React 19 / TS)                   │
│                                                                        │
│   TopBar (3-Zone)      Storefront Hero       Product Catalog Grid      │
│   Product Detail PDP   Cart & Wishlist       Checkout & Order Tracking │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP /api/*
┌───────────────────────────────────▼────────────────────────────────────┐
│                       EXPRESS REST API SERVER                          │
│                                                                        │
│   /api/products        /api/categories       /api/cart                 │
│   /api/wishlist        /api/orders           /api/db-inspect           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ DocumentClient Commands
┌───────────────────────────────────▼────────────────────────────────────┐
│               DYNAMODB DOCUMENTCLIENT REPOSITORY                       │
│              (Single-Table Design: PK / SK / GSI1)                     │
│                                                                        │
│    ┌───────────────────────────┐     ┌────────────────────────────┐    │
│    │    AWS DynamoDB Cloud     │ OR  │   Embedded DocumentStore   │    │
│    │ (When AWS env vars active)│     │  (Zero-config out of box)  │    │
│    └───────────────────────────┘     └────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DynamoDB Single-Table Schema Design

The application utilizes AWS DynamoDB Single-Table Design best practices with composite keys:

| Entity | Partition Key (`PK`) | Sort Key (`SK`) | GSI1 Partition (`GSI1PK`) | GSI1 Sort (`GSI1SK`) | Attributes & Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Product** | `PRODUCT#<id>` | `METADATA` | `CATEGORY#<category>` | `<id>` | `name, price, stock, images, specs, features, rating` |
| **Category** | `CATEGORY#<slug>` | `METADATA` | `CATEGORY` | `<slug>` | `name, slug, description, image, itemCount` |
| **Cart Item** | `USER#<userId>` | `CART#<productId>` | `PRODUCT#<productId>` | `USER#<userId>` | `productId, title, unitPrice, quantity, image` |
| **Wishlist Item** | `USER#<userId>` | `WISH#<productId>` | `PRODUCT#<productId>` | `USER#<userId>` | `productId, title, unitPrice, addedAt` |
| **Order** | `USER#<userId>` | `ORDER#<orderId>` | `ORDER#<orderId>` | `<createdAt>` | `items, subtotal, shippingFee, discount, status, address` |

### AWS CLI Table Creation Script

```bash
aws dynamodb create-table \
  --table-name ApexMegastoreTable \
  --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
      AttributeName=GSI1PK,AttributeType=S \
      AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
      "[{\"IndexName\":\"GSI1\",\"KeySchema\":[{\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## 🔧 Environment Variables

Configure `.env` using `.env.example`:

```bash
# Optional AWS DynamoDB configuration
# If not provided, the application runs on the embedded DocumentClient engine
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
DYNAMODB_TABLE_NAME="ApexMegastoreTable"

# Server Port
PORT=3000
```

---

## 🚀 Installation & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server** (Full-stack Express + Vite):
   ```bash
   npm run dev
   ```
   Server opens at `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

4. **Verify TypeScript & Lint**:
   ```bash
   npm run lint
   ```
