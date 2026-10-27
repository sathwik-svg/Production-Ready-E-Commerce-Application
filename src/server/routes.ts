import { Router, Request, Response } from 'express';
import { MegastoreRepository } from './dynamodbClient';
import { AmazonApiService } from './amazonApi';
import { CartItem, Order, OrderStatus, Product, ShippingAddress, WishlistItem } from '../types/ecommerce';

export const apiRouter = Router();

// Default demo session user ID
const DEFAULT_USER_ID = 'demo-user-101';

function getUserId(req: Request): string {
  return (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
}

// ----------------------------------------------------
// Products & Categories
// ----------------------------------------------------
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice, sortBy, inStock } = req.query;

    let products = await MegastoreRepository.getAllProducts();

    // 1. Filter by category
    if (category && category !== 'all') {
      products = products.filter((p) => p.category === category);
    }

    // 2. Filter by search term
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 3. Filter by price bounds
    if (minPrice && !isNaN(Number(minPrice))) {
      products = products.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      products = products.filter((p) => p.price <= Number(maxPrice));
    }

    // 4. In-stock only
    if (inStock === 'true') {
      products = products.filter((p) => p.stock > 0);
    }

    // 5. Sorting
    if (sortBy === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    } else {
      // Default: featured first, then name
      products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

apiRouter.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await MegastoreRepository.getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    // Related products in same category or sharing tags
    const allProducts = await MegastoreRepository.getAllProducts();
    const related = allProducts
      .filter((p) => p.id !== product.id && (p.category === product.category || p.tags.some((t) => product.tags.includes(t))))
      .slice(0, 3);

    res.json({
      success: true,
      product,
      related,
    });
  } catch (err: any) {
    console.error('Error fetching product details:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

apiRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await MegastoreRepository.getAllCategories();
    const products = await MegastoreRepository.getAllProducts();

    // Recalculate dynamic counts
    const categoriesWithCounts = categories.map((cat) => ({
      ...cat,
      itemCount: products.filter((p) => p.category === cat.slug).length,
    }));

    res.json({
      success: true,
      categories: categoriesWithCounts,
    });
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// ----------------------------------------------------
// Shopping Cart
// ----------------------------------------------------
apiRouter.get('/cart', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const items = await MegastoreRepository.getCart(userId);

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const freeShippingThreshold = 150.0;
    const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 15.0;

    res.json({
      success: true,
      userId,
      items,
      itemCount,
      subtotal,
      shippingFee,
      freeShippingThreshold,
      freeShippingProgress: Math.min(100, (subtotal / freeShippingThreshold) * 100),
    });
  } catch (err: any) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch cart' });
  }
});

apiRouter.post('/cart', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId, quantity = 1 } = req.body;

    if (!productId || typeof quantity !== 'number' || quantity < 1) {
      res.status(400).json({ success: false, error: 'Valid productId and positive quantity required' });
      return;
    }

    const product = await MegastoreRepository.getProductById(productId);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    if (product.stock < 1) {
      res.status(400).json({ success: false, error: 'Product is currently out of stock' });
      return;
    }

    // Check existing item in DynamoDB
    const existingCart = await MegastoreRepository.getCart(userId);
    const existingItem = existingCart.find((i) => i.productId === productId);

    const targetQuantity = existingItem ? Math.min(product.stock, existingItem.quantity + quantity) : Math.min(product.stock, quantity);

    const cartItem: CartItem = {
      productId: product.id,
      title: product.name,
      quantity: targetQuantity,
      unitPrice: product.price,
      image: product.images[0],
      category: product.category,
    };

    await MegastoreRepository.saveCartItem(userId, cartItem);

    const updatedCart = await MegastoreRepository.getCart(userId);
    const subtotal = updatedCart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    res.json({
      success: true,
      message: existingItem ? 'Cart item updated' : 'Product added to cart',
      item: cartItem,
      cart: updatedCart,
      subtotal,
    });
  } catch (err: any) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ success: false, error: 'Failed to update cart' });
  }
});

apiRouter.patch('/cart/:productId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number') {
      res.status(400).json({ success: false, error: 'Quantity must be a number' });
      return;
    }

    if (quantity <= 0) {
      await MegastoreRepository.removeCartItem(userId, productId);
    } else {
      const product = await MegastoreRepository.getProductById(productId);
      if (!product) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }
      const safeQuantity = Math.min(product.stock, quantity);

      await MegastoreRepository.saveCartItem(userId, {
        productId: product.id,
        title: product.name,
        quantity: safeQuantity,
        unitPrice: product.price,
        image: product.images[0],
        category: product.category,
      });
    }

    const updatedCart = await MegastoreRepository.getCart(userId);
    const subtotal = updatedCart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    res.json({
      success: true,
      cart: updatedCart,
      subtotal,
    });
  } catch (err: any) {
    console.error('Error modifying cart:', err);
    res.status(500).json({ success: false, error: 'Failed to update item quantity' });
  }
});

apiRouter.delete('/cart/:productId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    await MegastoreRepository.removeCartItem(userId, productId);
    const updatedCart = await MegastoreRepository.getCart(userId);
    const subtotal = updatedCart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: updatedCart,
      subtotal,
    });
  } catch (err: any) {
    console.error('Error removing cart item:', err);
    res.status(500).json({ success: false, error: 'Failed to remove cart item' });
  }
});

apiRouter.delete('/cart', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    await MegastoreRepository.clearCart(userId);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to clear cart' });
  }
});

// ----------------------------------------------------
// Wishlist
// ----------------------------------------------------
apiRouter.get('/wishlist', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const items = await MegastoreRepository.getWishlist(userId);
    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err: any) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch wishlist' });
  }
});

apiRouter.post('/wishlist', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, error: 'productId is required' });
      return;
    }

    const existingWishlist = await MegastoreRepository.getWishlist(userId);
    const alreadySaved = existingWishlist.some((w) => w.productId === productId);

    if (alreadySaved) {
      // Toggle off
      await MegastoreRepository.removeFromWishlist(userId, productId);
      const updated = await MegastoreRepository.getWishlist(userId);
      res.json({
        success: true,
        action: 'removed',
        message: 'Item removed from wishlist',
        items: updated,
      });
      return;
    }

    // Add to wishlist
    const product = await MegastoreRepository.getProductById(productId);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const wishlistItem: WishlistItem = {
      productId: product.id,
      title: product.name,
      unitPrice: product.price,
      image: product.images[0],
      category: product.category,
      addedAt: new Date().toISOString(),
    };

    await MegastoreRepository.addToWishlist(userId, wishlistItem);
    const updated = await MegastoreRepository.getWishlist(userId);

    res.json({
      success: true,
      action: 'added',
      message: 'Item added to wishlist',
      item: wishlistItem,
      items: updated,
    });
  } catch (err: any) {
    console.error('Error toggling wishlist:', err);
    res.status(500).json({ success: false, error: 'Failed to update wishlist' });
  }
});

apiRouter.delete('/wishlist/:productId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    await MegastoreRepository.removeFromWishlist(userId, productId);
    const updated = await MegastoreRepository.getWishlist(userId);

    res.json({
      success: true,
      message: 'Item removed from wishlist',
      items: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
  }
});

// ----------------------------------------------------
// Orders & Checkout Pipeline
// ----------------------------------------------------
const PROMO_CODES: Record<string, number> = {
  SAVE10: 0.1, // 10% off
  APEX20: 0.2, // 20% off
  INTERN100: 0.25, // 25% off internship showcase discount
};

apiRouter.post('/orders/checkout', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { shippingAddress, paymentMethod, promoCode } = req.body;

    // 1. Validation
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      res.status(400).json({
        success: false,
        error: 'Incomplete shipping address: Name, Street, City, and Postal Code are required.',
      });
      return;
    }

    const cartItems = await MegastoreRepository.getCart(userId);
    if (cartItems.length === 0) {
      res.status(400).json({ success: false, error: 'Cannot checkout with an empty cart.' });
      return;
    }

    // 2. Calculations
    const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingFee = subtotal >= 150 ? 0 : 15.0;

    let discountAmount = 0;
    const cleanPromo = promoCode ? String(promoCode).toUpperCase().trim() : '';
    if (cleanPromo && PROMO_CODES[cleanPromo]) {
      discountAmount = Math.round(subtotal * PROMO_CODES[cleanPromo] * 100) / 100;
    }

    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

    // 3. Generate Order Record
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const trackingNumber = `APX-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    const order: Order = {
      id: orderId,
      userId,
      items: cartItems,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      promoCode: cleanPromo || undefined,
      status: 'confirmed',
      shippingAddress: shippingAddress as ShippingAddress,
      paymentMethod: paymentMethod || { type: 'credit_card', lastFour: '4242' },
      trackingNumber,
      carrier: 'Apex Express Logistics',
      createdAt: new Date().toISOString(),
      estimatedDelivery: deliveryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    };

    // 4. Save to DynamoDB
    await MegastoreRepository.createOrder(order);

    // 5. Clear cart after successful checkout
    await MegastoreRepository.clearCart(userId);

    res.json({
      success: true,
      message: 'Order created successfully and stored in DynamoDB',
      order,
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    res.status(500).json({ success: false, error: 'Checkout processing failed' });
  }
});

apiRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const orders = await MegastoreRepository.getOrders(userId);
    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch order history' });
  }
});

apiRouter.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const order = await MegastoreRepository.getOrderById(userId, req.params.id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    res.json({
      success: true,
      order,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve order' });
  }
});

// ----------------------------------------------------
// DynamoDB Schema & Live Inspector (For Evaluation)
// ----------------------------------------------------
apiRouter.get('/db-inspect', async (_req: Request, res: Response) => {
  try {
    const data = await MegastoreRepository.getInspectorData();
    res.json({
      success: true,
      inspector: data,
    });
  } catch (err: any) {
    console.error('Error fetching DB inspection data:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch DynamoDB inspection data' });
  }
});

apiRouter.post('/db-reset', async (_req: Request, res: Response) => {
  try {
    await MegastoreRepository.resetAndSeed();
    const data = await MegastoreRepository.getInspectorData();
    res.json({
      success: true,
      message: 'DynamoDB table reset and re-seeded with initial catalog',
      inspector: data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to reset DynamoDB table' });
  }
});

// ----------------------------------------------------
// Amazon Product Advertising API (PA-API v5) & Prime
// ----------------------------------------------------
apiRouter.get('/amazon/search', async (req: Request, res: Response) => {
  try {
    const { keywords = '', category = 'all' } = req.query;
    const data = await AmazonApiService.search(String(keywords), String(category));
    res.json(data);
  } catch (err: any) {
    console.error('Amazon search error:', err);
    res.status(500).json({ success: false, error: err.message || 'Amazon API search failed' });
  }
});

apiRouter.get('/amazon/item/:asin', async (req: Request, res: Response) => {
  try {
    const item = await AmazonApiService.getItemByAsin(req.params.asin);
    if (!item) {
      res.status(404).json({ success: false, error: 'Amazon ASIN not found' });
      return;
    }
    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/amazon/price-match/:productId', async (req: Request, res: Response) => {
  try {
    const product = await MegastoreRepository.getProductById(req.params.productId);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    const comparison = AmazonApiService.getPriceComparisonForProduct(product);
    res.json({ success: true, comparison });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/amazon/import', async (req: Request, res: Response) => {
  try {
    const { asin, category } = req.body;
    if (!asin) {
      res.status(400).json({ success: false, error: 'ASIN is required' });
      return;
    }
    const importedProduct = await AmazonApiService.importToDynamoDb(asin, category);
    res.json({
      success: true,
      message: `ASIN ${asin} successfully imported into DynamoDB table`,
      product: importedProduct,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to import Amazon item' });
  }
});

apiRouter.post('/amazon/buy-with-prime', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { asin, shippingAddress } = req.body;

    const amzItem = await AmazonApiService.getItemByAsin(asin);
    if (!amzItem) {
      res.status(404).json({ success: false, error: 'Amazon ASIN not found' });
      return;
    }

    const orderId = `PRIME-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const trackingNumber = `TBA-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const primeDeliveryDate = new Date();
    primeDeliveryDate.setDate(primeDeliveryDate.getDate() + 1); // 1-day Prime delivery

    const order: Order = {
      id: orderId,
      userId,
      items: [
        {
          productId: `amz-${amzItem.asin.toLowerCase()}`,
          quantity: 1,
          unitPrice: amzItem.price,
          title: amzItem.title,
          image: amzItem.imageUrl,
          category: amzItem.category,
        },
      ],
      subtotal: amzItem.price,
      shippingFee: 0, // Free 1-day Prime shipping
      discountAmount: 0,
      totalAmount: amzItem.price,
      status: 'confirmed',
      shippingAddress: shippingAddress || {
        fullName: 'Amazon Prime Member',
        email: 'prime.member@amazon.com',
        phone: '+1 (800) 280-4331',
        street: '410 Terry Ave N',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98109',
        country: 'United States',
      },
      paymentMethod: {
        type: 'apple_pay',
        lastFour: 'PRIME',
      },
      trackingNumber,
      carrier: 'Amazon Logistics (AMZL)',
      createdAt: new Date().toISOString(),
      estimatedDelivery: primeDeliveryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) + ' (1-Day Prime)',
    };

    await MegastoreRepository.createOrder(order);

    res.json({
      success: true,
      message: 'Buy with Prime order processed successfully via Amazon Logistics',
      order,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Buy with Prime failed' });
  }
});

