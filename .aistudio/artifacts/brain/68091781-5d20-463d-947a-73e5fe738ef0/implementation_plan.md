# Apex Megastore: Production Full-Stack E-Commerce Architecture

An end-to-end, production-style e-commerce megastore engineered for seamless discovery across Tech, Apparel, and Home Goods. Backed by a clean Express API layer, AWS DynamoDB DocumentClient data modeling (with automatic local document persistence fallback), real-time cart and wishlist synchronization, and a complete simulated checkout and order tracking pipeline.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned during Phase 1 clarification:
> - **Product Catalog & Brand**: General Multi-category Megastore (*Apex Goods*) spanning Audio/Tech, Minimalist Apparel, and Contemporary Home Living.
> - **Backend & Persistence Engine**: Clean Express API server adhering to AWS DynamoDB DocumentClient patterns (Single-Table Design with `PK` and `SK`), backed by an in-memory/file-based persistent DocumentStore fallback engine when AWS credentials are not set, with instant live AWS DynamoDB connectivity when AWS keys are provided.
> - **Internship Evaluation Feature**: Full-lifecycle simulated checkout, multi-step address and payment validation, instant stock calculation, promo codes, and interactive Order Tracking & Order History.
> - **DynamoDB Schema Inspector**: An interactive "DynamoDB Live Inspector" drawer for review and internship submission grading, displaying real-time `PK`/`SK` queries, item payloads, and latency metrics.

---

## 1. Overview & Core Concept

- **What It Does**: Apex Megastore is a high-performance modern e-commerce platform offering cross-category product discovery, multi-facet filtering (category, price range, stock, search query, sorting), instantaneous cart management with subtotal calculations, duplicate-safe wishlist persistence, a contiguous product detail page (PDP), and an end-to-end checkout with order history tracking.
- **Target Audience / Persona**: Tech-savvy consumers looking for streamlined multi-category shopping, and hiring managers / evaluators inspecting clean architectural boundaries, RESTful API design, database modeling, and frontend performance.
- **Key Value**: Delivers the fidelity of an enterprise retail site (like Apple or Ssense) combined with clean software engineering practices: rigorous TypeScript types, robust error boundaries, structured REST routes, and AWS DynamoDB data modeling.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Storefront Discovery**: Users arrive at a curated hero and 3-category navigation (Tech, Apparel, Home). Live search and filter pills dynamically narrow the product grid.
2. **Product Detail View (PDP)**: Contiguous purchase module with multi-angle image gallery, inventory badge, tabular price, quantity selector, related items, and instantaneous Add-to-Cart / Wishlist toggles.
3. **Cart & Wishlist Management**: Slide-out cart drawer and dedicated cart view with quantity steppers, subtotal breakdown, free shipping progress bar, promo code engine, and duplicate prevention.
4. **Checkout & Order Tracking**: Multi-step checkout modal (Shipping Address $\to$ Delivery Option $\to$ Payment Simulation) with field validation, generating an order with unique ID stored in DynamoDB, and an interactive "Track Order" status timeline.
5. **DynamoDB Schema Inspector**: Floating developer inspector drawer enabling internship reviewers to inspect raw DynamoDB records (`PK=USER#101`, `SK=CART#ITEM#...`, `SK=ORDER#...`) in real-time.

### Visual Identity & Theme
- **Aesthetic Direction**: Neo-grotesque minimalist editorial retail. Muted slate and zinc canvas (`#09090b` dark, `#fafafa` light) with crisp borders (`border-zinc-200 dark:border-zinc-800`), deep charcoal typography, and electric cobalt accent (`#2563eb`).
- **Typography & Scale**: 
  - Display / Headings: `Plus Jakarta Sans` / `Outfit` (`clamp(2rem, 3.5vw, 3rem)` for hero, `18px-24px` for cards).
  - Body & UI: `Plus Jakarta Sans` (`15px`, `1.6` line-height).
  - Pricing & Telemetry: `JetBrains Mono` / `tabular-nums` for precise vertical alignment.
- **Anti-Slop & Zero-Pill Restraint**:
  - No candy pill enclosures around static categories or dates; clean inline text with subtle `·` separators.
  - Strict Top Bar Contract: Brand Wordmark $\to$ 4 concise nav links $\to$ Search, Wishlist, and Cart actions with badges.
  - No decorative pulsing dots or synthetic "innovation scores".

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: DynamoDB DocumentClient Architecture with Fallback Engine**
  - *Chosen Approach*: Implement an official `@aws-sdk/lib-dynamodb` compatible repository layer with Single-Table Design (`PK`, `SK`, `GSI1PK`, `GSI1SK`). If AWS environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DYNAMODB_TABLE_NAME`) are present, it performs real AWS DynamoDB calls; otherwise, it seamlessly uses an internal embedded DocumentStore that mirrors DynamoDB queries (`QueryCommand`, `PutCommand`, `UpdateCommand`, `DeleteCommand`) with 100% fidelity.
  - *Why*: Ensures zero-setup out-of-the-box operation in the preview sandbox while providing production-ready AWS DynamoDB code, documentation, and schema definitions for the internship submission.
- **Decision 2: Integrated Express Full-Stack Server & Vite Dev Server**
  - *Chosen Approach*: Express server providing clean RESTful endpoints (`/api/products`, `/api/categories`, `/api/cart`, `/api/wishlist`, `/api/orders`, `/api/db-inspect`), served in harmony with the Vite React application.
  - *Why*: Clear separation of concerns between client and server layers as requested in the internship requirements, with unified port 3000 execution.
- **Decision 3: Complete Simulated Checkout & Order Lifecycle**
  - *Chosen Approach*: End-to-end checkout with field-level validation, promo code logic (`SAVE10`, `APEX20`), realistic processing delay, order creation with order items written to DynamoDB, and order status tracking.
  - *Why*: Fulfills the user's primary selected internship feature and tests full transactional data handling.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER CLIENT (React 19)                            │
│                                                                                  │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  │
│  │   TopBar (3-Zone)     │  │   Storefront Hero     │  │ Product Catalog Grid │  │
│  └───────────────────────┘  └───────────────────────┘  └──────────────────────┘  │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  │
│  │   Product Detail View │  │ Cart & Wishlist Drawers│  │ Checkout & Tracking  │ │
│  └───────────────────────┘  └───────────────────────┘  └──────────────────────┘  │
│                                      │                                           │
│                     REST Client State / API Fetch Services                       │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │ HTTP /api/*
┌──────────────────────────────────────▼───────────────────────────────────────────┐
│                             EXPRESS BACKEND SERVER                               │
│                                                                                  │
│  ┌─────────────────────────┐ ┌─────────────────────────┐ ┌────────────────────┐  │
│  │  /api/products          │ │  /api/cart              │ │  /api/orders       │  │
│  │  /api/categories        │ │  /api/wishlist          │ │  /api/db-inspect   │  │
│  └───────────┬─────────────┘ └───────────┬─────────────┘ └─────────┬──────────┘  │
│              │                           │                         │             │
│              └───────────────────────────┼─────────────────────────┘             │
│                                          │                                       │
│                       DYNAMODB DOCUMENTCLIENT SERVICE                            │
│                     (Single-Table Design: PK / SK / GSI)                         │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐             ┌──────────────────────────────────┐
│     AWS DynamoDB Cloud        │   [OR]      │    Embedded DocumentStore        │
│ (Active when AWS env vars set)│             │ (Active out-of-the-box fallback) │
└───────────────────────────────┘             └──────────────────────────────────┘
```

### DynamoDB Single-Table Schema Design

| Entity | Partition Key (`PK`) | Sort Key (`SK`) | Attributes & Payloads |
| :--- | :--- | :--- | :--- |
| **Product** | `PRODUCT#<id>` | `METADATA` | `name`, `category`, `price`, `rating`, `stock`, `images`, `specs`, `description` |
| **Category** | `CATEGORY#<slug>` | `METADATA` | `name`, `slug`, `description`, `icon`, `itemCount` |
| **Cart Item** | `USER#<userId>` | `CART#<productId>` | `productId`, `quantity`, `unitPrice`, `title`, `image`, `updatedAt` |
| **Wishlist Item**| `USER#<userId>` | `WISH#<productId>` | `productId`, `title`, `unitPrice`, `image`, `addedAt` |
| **Order** | `USER#<userId>` | `ORDER#<orderId>` | `orderId`, `items`, `subtotal`, `shipping`, `total`, `status`, `shippingAddress`, `createdAt` |
| **User Profile** | `USER#<userId>` | `PROFILE` | `userId`, `name`, `email`, `defaultAddress` |

### Key API Routes & Controllers
- `GET /api/products`: Filter by `category`, `search`, `minPrice`, `maxPrice`, `sortBy`, `inStock`.
- `GET /api/products/:id`: Fetch single product + related products.
- `GET /api/categories`: List all categories with product counts.
- `GET /api/cart` & `POST /api/cart`: Fetch user's cart, add item, update quantity, remove item.
- `GET /api/wishlist` & `POST /api/wishlist`: Toggle items in wishlist with duplicate protection.
- `POST /api/orders/checkout`: Validate cart, calculate taxes/discounts, reserve stock, generate order.
- `GET /api/orders`: Fetch user order history & status tracking.
- `GET /api/db-inspect`: Live DynamoDB table scan/query inspector for evaluation and debugging.

---

## 5. Verification & Submission Deliverables
- Fully working responsive store on desktop (1440px), tablet, and mobile.
- Zero broken images with high-fidelity studio product photography.
- Zero dead buttons: every interactive control has complete event handlers.
- Comprehensive `README.md` containing Architecture diagram, DynamoDB setup commands (AWS CLI & CloudFormation/SAM), Environment Variables, and API documentation ready for internship grading.
