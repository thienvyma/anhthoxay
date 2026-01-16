/**
 * Base Firestore Service
 * Provides generic CRUD operations, query builder, batch operations, and transaction support
 * 
 * @module services/firestore/base.firestore
 * @requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */

import * as admin from 'firebase-admin';
import { getFirestore } from '../firebase-admin.service';
import { logger } from '../../utils/logger';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Base document interface that all Firestore documents must extend
 */
export interface FirestoreDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Supported filter operators for queries
 */
export type FilterOperator = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains' | 'array-contains-any';

/**
 * Where clause for filtering documents
 */
export interface WhereClause<T> {
  field: keyof T | string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Order by clause for sorting
 */
export interface OrderByClause {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Query options for filtering, sorting, and pagination
 */
export interface QueryOptions<T> {
  where?: WhereClause<T>[];
  orderBy?: OrderByClause[];
  limit?: number;
  startAfter?: admin.firestore.DocumentSnapshot | unknown;
  startAt?: admin.firestore.DocumentSnapshot | unknown;
  endBefore?: admin.firestore.DocumentSnapshot | unknown;
  endAt?: admin.firestore.DocumentSnapshot | unknown;
}

/**
 * Paginated result with cursor-based navigation
 */
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: admin.firestore.DocumentSnapshot;
  total?: number;
}

/**
 * Batch update item
 */
export interface BatchUpdateItem<T> {
  id: string;
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @requirements 1.9
 */
export function timestampToDate(timestamp: admin.firestore.Timestamp | Date | undefined | null): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  return undefined;
}

/**
 * Convert JavaScript Date to Firestore Timestamp
 * @requirements 1.8
 */
export function dateToTimestamp(date: Date | undefined | null): admin.firestore.Timestamp | undefined {
  if (!date) return undefined;
  if (date instanceof Date) {
    return admin.firestore.Timestamp.fromDate(date);
  }
  return undefined;
}

/**
 * Convert document data from Firestore format to application format
 * Handles Timestamp → Date conversion recursively
 */
function convertFromFirestore<T>(data: admin.firestore.DocumentData): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (value instanceof admin.firestore.Timestamp) {
      result[key] = value.toDate();
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item instanceof admin.firestore.Timestamp) {
          return item.toDate();
        }
        if (typeof item === 'object' && item !== null) {
          return convertFromFirestore(item);
        }
        return item;
      });
    } else if (typeof value === 'object') {
      result[key] = convertFromFirestore(value);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Convert document data from application format to Firestore format
 * Handles Date → Timestamp conversion recursively
 */
function convertToFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (value instanceof Date) {
      result[key] = admin.firestore.Timestamp.fromDate(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item instanceof Date) {
          return admin.firestore.Timestamp.fromDate(item);
        }
        if (typeof item === 'object' && item !== null) {
          return convertToFirestore(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object') {
      result[key] = convertToFirestore(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// ============================================
// BASE FIRESTORE SERVICE CLASS
// ============================================

/**
 * Base Firestore Service providing generic CRUD operations
 * 
 * @template T - Document type extending FirestoreDocument
 * @requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
export class BaseFirestoreService<T extends FirestoreDocument> {
  protected collectionName: string;
  protected db: admin.firestore.Firestore | null = null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Get Firestore instance (lazy initialization)
   */
  protected async getDb(): Promise<admin.firestore.Firestore> {
    if (!this.db) {
      this.db = await getFirestore();
    }
    return this.db;
  }

  /**
   * Get collection reference
   */
  protected async getCollection(): Promise<admin.firestore.CollectionReference> {
    const db = await this.getDb();
    return db.collection(this.collectionName);
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new document with auto-generated ID
   * @requirements 1.2
   * 
   * @param data - Document data (without id, createdAt, updatedAt)
   * @returns Created document with all fields
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const docData = {
      ...convertToFirestore(data as Record<string, unknown>),
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };
    
    const docRef = await collection.add(docData);
    
    logger.debug(`Created document in ${this.collectionName}`, { id: docRef.id });
    
    return {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    } as T;
  }

  /**
   * Create a document with a specific ID
   * 
   * @param id - Document ID
   * @param data - Document data
   * @returns Created document
   */
  async createWithId(id: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const docData = {
      ...convertToFirestore(data as Record<string, unknown>),
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };
    
    await collection.doc(id).set(docData);
    
    logger.debug(`Created document with ID in ${this.collectionName}`, { id });
    
    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as T;
  }

  /**
   * Get a document by ID
   * @requirements 1.3
   * 
   * @param id - Document ID
   * @returns Document if found, null otherwise
   */
  async getById(id: string): Promise<T | null> {
    const collection = await this.getCollection();
    const doc = await collection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    if (!data) return null;
    
    return {
      ...convertFromFirestore<T>(data),
      id: doc.id,
    } as T;
  }

  /**
   * Update a document by ID (partial update)
   * @requirements 1.4
   * 
   * @param id - Document ID
   * @param data - Partial document data to update
   * @returns Updated document
   * @throws Error if document not found
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const collection = await this.getCollection();
    const docRef = collection.doc(id);
    
    // Check if document exists
    const existingDoc = await docRef.get();
    if (!existingDoc.exists) {
      throw new Error(`Document not found: ${this.collectionName}/${id}`);
    }
    
    const now = new Date();
    const updateData = {
      ...convertToFirestore(data as Record<string, unknown>),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };
    
    await docRef.update(updateData);
    
    // Fetch updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    
    if (!updatedData) {
      throw new Error(`Failed to fetch updated document: ${this.collectionName}/${id}`);
    }
    
    logger.debug(`Updated document in ${this.collectionName}`, { id });
    
    return {
      ...convertFromFirestore<T>(updatedData),
      id: updatedDoc.id,
    } as T;
  }

  /**
   * Delete a document by ID
   * @requirements 1.5
   * 
   * @param id - Document ID
   */
  async delete(id: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.doc(id).delete();
    
    logger.debug(`Deleted document from ${this.collectionName}`, { id });
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Query documents with filters, sorting, and pagination
   * @requirements 1.6
   * 
   * @param options - Query options
   * @returns Array of matching documents
   */
  async query(options: QueryOptions<T> = {}): Promise<T[]> {
    const collection = await this.getCollection();
    let query: admin.firestore.Query = collection;
    
    // Apply where clauses
    if (options.where) {
      for (const clause of options.where) {
        query = query.where(clause.field as string, clause.operator, clause.value);
      }
    }
    
    // Apply orderBy clauses
    if (options.orderBy) {
      for (const order of options.orderBy) {
        query = query.orderBy(order.field, order.direction);
      }
    }
    
    // Apply cursor-based pagination
    if (options.startAfter) {
      query = query.startAfter(options.startAfter);
    }
    if (options.startAt) {
      query = query.startAt(options.startAt);
    }
    if (options.endBefore) {
      query = query.endBefore(options.endBefore);
    }
    if (options.endAt) {
      query = query.endAt(options.endAt);
    }
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      ...convertFromFirestore<T>(doc.data()),
      id: doc.id,
    } as T));
  }

  /**
   * Query documents with pagination support
   * @requirements 1.7
   * 
   * @param options - Query options
   * @returns Paginated result with cursor
   */
  async queryPaginated(options: QueryOptions<T> = {}): Promise<PaginatedResult<T>> {
    const limit = options.limit || 20;
    
    // Fetch one extra to check if there are more results
    const results = await this.query({
      ...options,
      limit: limit + 1,
    });
    
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    
    // Get the last document for cursor
    let lastDoc: admin.firestore.DocumentSnapshot | undefined;
    if (data.length > 0) {
      const collection = await this.getCollection();
      const lastId = data[data.length - 1].id;
      lastDoc = await collection.doc(lastId).get();
    }
    
    return {
      data,
      hasMore,
      lastDoc,
    };
  }

  /**
   * Count documents matching query
   * 
   * @param options - Query options (where clauses only)
   * @returns Count of matching documents
   */
  async count(options: Pick<QueryOptions<T>, 'where'> = {}): Promise<number> {
    const collection = await this.getCollection();
    let query: admin.firestore.Query = collection;
    
    if (options.where) {
      for (const clause of options.where) {
        query = query.where(clause.field as string, clause.operator, clause.value);
      }
    }
    
    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  /**
   * Check if a document exists
   * 
   * @param id - Document ID
   * @returns True if document exists
   */
  async exists(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const doc = await collection.doc(id).get();
    return doc.exists;
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Create multiple documents in a batch
   * 
   * @param items - Array of document data
   * @returns Array of created documents
   */
  async batchCreate(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<T[]> {
    if (items.length === 0) return [];
    
    const db = await this.getDb();
    const collection = await this.getCollection();
    const batch = db.batch();
    const now = new Date();
    const results: T[] = [];
    
    for (const item of items) {
      const docRef = collection.doc();
      const docData = {
        ...convertToFirestore(item as Record<string, unknown>),
        createdAt: admin.firestore.Timestamp.fromDate(now),
        updatedAt: admin.firestore.Timestamp.fromDate(now),
      };
      
      batch.set(docRef, docData);
      
      results.push({
        ...item,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
      } as T);
    }
    
    await batch.commit();
    
    logger.debug(`Batch created ${items.length} documents in ${this.collectionName}`);
    
    return results;
  }

  /**
   * Update multiple documents in a batch
   * 
   * @param updates - Array of update items with id and data
   */
  async batchUpdate(updates: BatchUpdateItem<T>[]): Promise<void> {
    if (updates.length === 0) return;
    
    const db = await this.getDb();
    const collection = await this.getCollection();
    const batch = db.batch();
    const now = new Date();
    
    for (const update of updates) {
      const docRef = collection.doc(update.id);
      const updateData = {
        ...convertToFirestore(update.data as Record<string, unknown>),
        updatedAt: admin.firestore.Timestamp.fromDate(now),
      };
      
      batch.update(docRef, updateData);
    }
    
    await batch.commit();
    
    logger.debug(`Batch updated ${updates.length} documents in ${this.collectionName}`);
  }

  /**
   * Delete multiple documents in a batch
   * 
   * @param ids - Array of document IDs to delete
   */
  async batchDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    
    const db = await this.getDb();
    const collection = await this.getCollection();
    const batch = db.batch();
    
    for (const id of ids) {
      const docRef = collection.doc(id);
      batch.delete(docRef);
    }
    
    await batch.commit();
    
    logger.debug(`Batch deleted ${ids.length} documents from ${this.collectionName}`);
  }

  // ============================================
  // TRANSACTION SUPPORT
  // ============================================

  /**
   * Run operations in a transaction
   * 
   * @param fn - Transaction function
   * @returns Result of transaction function
   */
  async runTransaction<R>(
    fn: (transaction: admin.firestore.Transaction, collection: admin.firestore.CollectionReference) => Promise<R>
  ): Promise<R> {
    const db = await this.getDb();
    const collection = await this.getCollection();
    
    return db.runTransaction(async (transaction) => {
      return fn(transaction, collection);
    });
  }

  /**
   * Get a document within a transaction
   * 
   * @param transaction - Firestore transaction
   * @param id - Document ID
   * @returns Document if found, null otherwise
   */
  async getInTransaction(
    transaction: admin.firestore.Transaction,
    id: string
  ): Promise<T | null> {
    const collection = await this.getCollection();
    const docRef = collection.doc(id);
    const doc = await transaction.get(docRef);
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    if (!data) return null;
    
    return {
      ...convertFromFirestore<T>(data),
      id: doc.id,
    } as T;
  }

  /**
   * Create a document within a transaction
   * 
   * @param transaction - Firestore transaction
   * @param data - Document data
   * @returns Created document
   */
  createInTransaction(
    transaction: admin.firestore.Transaction,
    collection: admin.firestore.CollectionReference,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): T {
    const docRef = collection.doc();
    const now = new Date();
    
    const docData = {
      ...convertToFirestore(data as Record<string, unknown>),
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };
    
    transaction.set(docRef, docData);
    
    return {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    } as T;
  }

  /**
   * Update a document within a transaction
   * 
   * @param transaction - Firestore transaction
   * @param id - Document ID
   * @param data - Partial document data
   */
  async updateInTransaction(
    transaction: admin.firestore.Transaction,
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const collection = await this.getCollection();
    const docRef = collection.doc(id);
    const now = new Date();
    
    const updateData = {
      ...convertToFirestore(data as Record<string, unknown>),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };
    
    transaction.update(docRef, updateData);
  }

  /**
   * Delete a document within a transaction
   * 
   * @param transaction - Firestore transaction
   * @param id - Document ID
   */
  async deleteInTransaction(
    transaction: admin.firestore.Transaction,
    id: string
  ): Promise<void> {
    const collection = await this.getCollection();
    const docRef = collection.doc(id);
    transaction.delete(docRef);
  }
}

// ============================================
// SUBCOLLECTION SERVICE
// ============================================

/**
 * Service for handling subcollections within a parent document
 * 
 * @template T - Document type extending FirestoreDocument
 */
export class SubcollectionFirestoreService<T extends FirestoreDocument> {
  protected parentCollection: string;
  protected subcollectionName: string;
  protected db: admin.firestore.Firestore | null = null;

  constructor(parentCollection: string, subcollectionName: string) {
    this.parentCollection = parentCollection;
    this.subcollectionName = subcollectionName;
  }

  /**
   * Get Firestore instance
   */
  protected async getDb(): Promise<admin.firestore.Firestore> {
    if (!this.db) {
      this.db = await getFirestore();
    }
    return this.db;
  }

  /**
   * Get subcollection reference
   */
  protected async getSubcollection(parentId: string): Promise<admin.firestore.CollectionReference> {
    const db = await this.getDb();
    return db.collection(this.parentCollection).doc(parentId).collection(this.subcollectionName);
  }

  /**
   * Create a document in subcollection
   */
  async create(parentId: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const collection = await this.getSubcollection(parentId);
    const now = new Date();
    
    const docData = {
      ...convertToFirestore(data as Record<string, unknown>),
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };
    
    const docRef = await collection.add(docData);
    
    return {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    } as T;
  }

  /**
   * Get a document from subcollection
   */
  async getById(parentId: string, id: string): Promise<T | null> {
    const collection = await this.getSubcollection(parentId);
    const doc = await collection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    if (!data) return null;
    
    return {
      ...convertFromFirestore<T>(data),
      id: doc.id,
    } as T;
  }

  /**
   * Update a document in subcollection
   */
  async update(parentId: string, id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const collection = await this.getSubcollection(parentId);
    const docRef = collection.doc(id);
    const now = new Date();
    
    const updateData = {
      ...convertToFirestore(data as Record<string, unknown>),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };
    
    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    
    if (!updatedData) {
      throw new Error(`Failed to fetch updated document: ${this.parentCollection}/${parentId}/${this.subcollectionName}/${id}`);
    }
    
    return {
      ...convertFromFirestore<T>(updatedData),
      id: updatedDoc.id,
    } as T;
  }

  /**
   * Delete a document from subcollection
   */
  async delete(parentId: string, id: string): Promise<void> {
    const collection = await this.getSubcollection(parentId);
    await collection.doc(id).delete();
  }

  /**
   * Query documents in subcollection
   */
  async query(parentId: string, options: QueryOptions<T> = {}): Promise<T[]> {
    const collection = await this.getSubcollection(parentId);
    let query: admin.firestore.Query = collection;
    
    if (options.where) {
      for (const clause of options.where) {
        query = query.where(clause.field as string, clause.operator, clause.value);
      }
    }
    
    if (options.orderBy) {
      for (const order of options.orderBy) {
        query = query.orderBy(order.field, order.direction);
      }
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      ...convertFromFirestore<T>(doc.data()),
      id: doc.id,
    } as T));
  }

  /**
   * Get all documents in subcollection
   */
  async getAll(parentId: string): Promise<T[]> {
    return this.query(parentId);
  }

  /**
   * Delete all documents in subcollection
   */
  async deleteAll(parentId: string): Promise<void> {
    const collection = await this.getSubcollection(parentId);
    const snapshot = await collection.get();
    
    if (snapshot.empty) return;
    
    const db = await this.getDb();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
}

export default BaseFirestoreService;
