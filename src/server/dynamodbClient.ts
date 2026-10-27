import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  Product,
  Category,
  CartItem,
  WishlistItem,
  Order,
  DynamoDBRecord,
  DbInspectSummary,
} from '../types/ecommerce';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './seedData';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'ApexMegastoreTable';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const HAS_AWS_CREDS = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_ACCESS_KEY_ID !== 'MY_AWS_ACCESS_KEY_ID'
);

let docClient: DynamoDBDocumentClient | null = null;

if (HAS_AWS_CREDS) {
  try {
    const rawClient = new DynamoDBClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    docClient = DynamoDBDocumentClient.from(rawClient);
    console.log(`[DynamoDB] Initialized AWS DocumentClient for table: ${TABLE_NAME} (${AWS_REGION})`);
  } catch (err) {
    console.warn('[DynamoDB] Failed to initialize live AWS client, falling back to embedded DocumentStore:', err);
    docClient = null;
  }
}

// In-Memory DocumentStore backing the DynamoDB Single-Table Design
const memoryStore = new Map<string, DynamoDBRecord>();

function getCompositeKey(pk: string, sk: string): string {
  return `${pk}###${sk}`;
}

export class MegastoreRepository {
  static getActiveMode(): 'live_aws' | 'document_client_embedded' {
    return docClient ? 'live_aws' : 'document_client_embedded';
  }

  static async seed() {
    const existing = await this.getAllProducts();
    if (existing.length > 0) {
      return;
    }

    const timestamp = new Date().toISOString();

    // 1. Seed Categories
    for (const cat of INITIAL_CATEGORIES) {
      await this.putRecord({
        PK: `CATEGORY#${cat.slug}`,
        SK: 'METADATA',
        GSI1PK: 'CATEGORY',
        GSI1SK: cat.slug,
        entityType: 'CATEGORY',
        data: cat,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    // 2. Seed Products
    for (const prod of INITIAL_PRODUCTS) {
      await this.putRecord({
        PK: `PRODUCT#${prod.id}`,
        SK: 'METADATA',
        GSI1PK: `CATEGORY#${prod.category}`,
        GSI1SK: prod.id,
        entityType: 'PRODUCT',
        data: prod,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    console.log(`[DynamoDB] Successfully seeded ${INITIAL_CATEGORIES.length} categories and ${INITIAL_PRODUCTS.length} products.`);
  }

  // --- Low Level Document Operations ---
  static async putRecord(record: DynamoDBRecord): Promise<void> {
    if (docClient) {
      try {
        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: record,
          })
        );
        return;
      } catch (err) {
        console.warn('[DynamoDB Live Put Error, falling back to embedded store]', err);
      }
    }
    const key = getCompositeKey(record.PK, record.SK);
    memoryStore.set(key, { ...record });
  }

  static async getRecord(pk: string, sk: string): Promise<DynamoDBRecord | null> {
    if (docClient) {
      try {
        const res = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk, SK: sk },
          })
        );
        return (res.Item as DynamoDBRecord) || null;
      } catch (err) {
        console.warn('[DynamoDB Live Get Error, falling back to embedded store]', err);
      }
    }
    const key = getCompositeKey(pk, sk);
    const item = memoryStore.get(key);
    return item ? { ...item } : null;
  }

  static async deleteRecord(pk: string, sk: string): Promise<void> {
    if (docClient) {
      try {
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk, SK: sk },
          })
        );
        return;
      } catch (err) {
        console.warn('[DynamoDB Live Delete Error, falling back to memory store]', err);
      }
    }
    const key = getCompositeKey(pk, sk);
    memoryStore.delete(key);
  }

  static async queryByPK(pk: string, skPrefix?: string): Promise<DynamoDBRecord[]> {
    if (docClient) {
      try {
        let condition = 'PK = :pk';
        const attrValues: Record<string, any> = { ':pk': pk };
        if (skPrefix) {
          condition += ' AND begins_with(SK, :prefix)';
          attrValues[':prefix'] = skPrefix;
        }

        const res = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: condition,
            ExpressionAttributeValues: attrValues,
          })
        );
        return (res.Items as DynamoDBRecord[]) || [];
      } catch (err) {
        console.warn('[DynamoDB Live Query Error, falling back to memory store]', err);
      }
    }

    const results: DynamoDBRecord[] = [];
    for (const record of memoryStore.values()) {
      if (record.PK === pk) {
        if (!skPrefix || record.SK.startsWith(skPrefix)) {
          results.push({ ...record });
        }
      }
    }
    return results;
  }

  static async scanAll(): Promise<DynamoDBRecord[]> {
    if (docClient) {
      try {
        const res = await docClient.send(
          new ScanCommand({
            TableName: TABLE_NAME,
          })
        );
        return (res.Items as DynamoDBRecord[]) || [];
      } catch (err) {
        console.warn('[DynamoDB Live Scan Error, falling back to memory store]', err);
      }
    }
    return Array.from(memoryStore.values()).map((r) => ({ ...r }));
  }

  // --- Domain Repositories ---

  // Products
  static async getAllProducts(): Promise<Product[]> {
    const records = await this.scanAll();
    return records
      .filter((r) => r.entityType === 'PRODUCT')
      .map((r) => r.data as Product);
  }

  static async getProductById(id: string): Promise<Product | null> {
    const record = await this.getRecord(`PRODUCT#${id}`, 'METADATA');
    return record ? (record.data as Product) : null;
  }

  // Categories
  static async getAllCategories(): Promise<Category[]> {
    const records = await this.scanAll();
    const categories = records
      .filter((r) => r.entityType === 'CATEGORY')
      .map((r) => r.data as Category);

    if (categories.length === 0) {
      return INITIAL_CATEGORIES;
    }
    return categories;
  }

  // Cart
  static async getCart(userId: string): Promise<CartItem[]> {
    const records = await this.queryByPK(`USER#${userId}`, 'CART#');
    return records.map((r) => r.data as CartItem);
  }

  static async saveCartItem(userId: string, item: CartItem): Promise<void> {
    const timestamp = new Date().toISOString();
    await this.putRecord({
      PK: `USER#${userId}`,
      SK: `CART#${item.productId}`,
      GSI1PK: `PRODUCT#${item.productId}`,
      GSI1SK: `USER#${userId}`,
      entityType: 'CART_ITEM',
      data: item,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static async removeCartItem(userId: string, productId: string): Promise<void> {
    await this.deleteRecord(`USER#${userId}`, `CART#${productId}`);
  }

  static async clearCart(userId: string): Promise<void> {
    const items = await this.getCart(userId);
    for (const item of items) {
      await this.removeCartItem(userId, item.productId);
    }
  }

  // Wishlist
  static async getWishlist(userId: string): Promise<WishlistItem[]> {
    const records = await this.queryByPK(`USER#${userId}`, 'WISH#');
    return records.map((r) => r.data as WishlistItem);
  }

  static async addToWishlist(userId: string, item: WishlistItem): Promise<void> {
    const timestamp = new Date().toISOString();
    await this.putRecord({
      PK: `USER#${userId}`,
      SK: `WISH#${item.productId}`,
      GSI1PK: `PRODUCT#${item.productId}`,
      GSI1SK: `USER#${userId}`,
      entityType: 'WISHLIST_ITEM',
      data: item,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await this.deleteRecord(`USER#${userId}`, `WISH#${productId}`);
  }

  // Orders
  static async createOrder(order: Order): Promise<void> {
    const timestamp = new Date().toISOString();
    await this.putRecord({
      PK: `USER#${order.userId}`,
      SK: `ORDER#${order.id}`,
      GSI1PK: `ORDER#${order.id}`,
      GSI1SK: order.createdAt,
      entityType: 'ORDER',
      data: order,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static async getOrders(userId: string): Promise<Order[]> {
    const records = await this.queryByPK(`USER#${userId}`, 'ORDER#');
    const orders = records.map((r) => r.data as Order);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getOrderById(userId: string, orderId: string): Promise<Order | null> {
    const record = await this.getRecord(`USER#${userId}`, `ORDER#${orderId}`);
    return record ? (record.data as Order) : null;
  }

  // Live Inspector for Evaluation & Debugging
  static async getInspectorData(): Promise<DbInspectSummary> {
    const all = await this.scanAll();
    const entityCounts: Record<string, number> = {
      PRODUCT: 0,
      CATEGORY: 0,
      CART_ITEM: 0,
      WISHLIST_ITEM: 0,
      ORDER: 0,
    };

    all.forEach((rec) => {
      if (entityCounts[rec.entityType] !== undefined) {
        entityCounts[rec.entityType]++;
      }
    });

    const recentRecords = [...all]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 30);

    return {
      activeMode: this.getActiveMode(),
      tableName: TABLE_NAME,
      region: AWS_REGION,
      totalItems: all.length,
      entityCounts,
      recentRecords,
    };
  }

  static async resetAndSeed(): Promise<void> {
    memoryStore.clear();
    await this.seed();
  }
}
