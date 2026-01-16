/**
 * Settings Firestore Service
 * 
 * Handles settings storage as key-value documents in Firestore.
 * Settings are stored in `settings/{key}` collection.
 * 
 * @module services/firestore/settings.firestore
 * @requirements 3.5
 */

import * as admin from 'firebase-admin';
import { getFirestore } from '../firebase-admin.service';
import { logger } from '../../utils/logger';
import type { FirestoreSettings, FirestoreBiddingSettings, FirestoreFurniturePdfSettings } from '../../types/firestore.types';

// ============================================
// CONSTANTS
// ============================================

const COLLECTION_NAME = 'settings';

// ============================================
// SETTINGS FIRESTORE SERVICE CLASS
// ============================================

/**
 * Firestore service for settings management
 * Settings are stored as key-value documents where the document ID is the key
 */
export class SettingsFirestoreService {
  private db: admin.firestore.Firestore | null = null;

  /**
   * Get Firestore instance (lazy initialization)
   */
  private async getDb(): Promise<admin.firestore.Firestore> {
    if (!this.db) {
      this.db = await getFirestore();
    }
    return this.db;
  }

  /**
   * Get collection reference
   */
  private async getCollection(): Promise<admin.firestore.CollectionReference> {
    const db = await this.getDb();
    return db.collection(COLLECTION_NAME);
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Get a setting by key
   * 
   * @param key - Setting key (document ID)
   * @returns Setting value or null if not found
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const collection = await this.getCollection();
    const doc = await collection.doc(key).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    // Return the value field directly
    return data.value as T;
  }

  /**
   * Get a setting document with metadata
   * 
   * @param key - Setting key (document ID)
   * @returns Full setting document or null if not found
   */
  async getDocument(key: string): Promise<FirestoreSettings | null> {
    const collection = await this.getCollection();
    const doc = await collection.doc(key).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    return {
      id: doc.id,
      key: doc.id,
      value: data.value,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Set a setting value (create or update)
   * 
   * @param key - Setting key (document ID)
   * @param value - Setting value (any JSON-serializable data)
   * @returns The saved value
   */
  async set<T = unknown>(key: string, value: T): Promise<T> {
    const collection = await this.getCollection();
    const docRef = collection.doc(key);
    const now = admin.firestore.Timestamp.now();

    const existingDoc = await docRef.get();
    
    if (existingDoc.exists) {
      // Update existing document
      await docRef.update({
        value,
        updatedAt: now,
      });
    } else {
      // Create new document
      await docRef.set({
        value,
        createdAt: now,
        updatedAt: now,
      });
    }

    logger.debug(`Setting saved: ${key}`);
    return value;
  }

  /**
   * Delete a setting
   * 
   * @param key - Setting key (document ID)
   */
  async delete(key: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.doc(key).delete();
    logger.debug(`Setting deleted: ${key}`);
  }

  /**
   * Get all settings as a key-value object
   * 
   * @returns Object with all settings { key: value }
   */
  async getAll(): Promise<Record<string, unknown>> {
    const collection = await this.getCollection();
    const snapshot = await collection.get();

    const settings: Record<string, unknown> = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      settings[doc.id] = data.value;
    });

    return settings;
  }

  /**
   * Check if a setting exists
   * 
   * @param key - Setting key
   * @returns True if setting exists
   */
  async exists(key: string): Promise<boolean> {
    const collection = await this.getCollection();
    const doc = await collection.doc(key).get();
    return doc.exists;
  }

  // ============================================
  // TYPED SETTINGS HELPERS
  // ============================================

  /**
   * Get bidding settings
   * 
   * @returns Bidding settings or null if not configured
   */
  async getBiddingSettings(): Promise<FirestoreBiddingSettings | null> {
    return this.get<FirestoreBiddingSettings>('bidding');
  }

  /**
   * Set bidding settings
   * 
   * @param settings - Bidding settings to save
   * @returns Saved bidding settings
   */
  async setBiddingSettings(settings: Omit<FirestoreBiddingSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreBiddingSettings> {
    await this.set('bidding', settings);
    
    // Return with metadata
    const doc = await this.getDocument('bidding');
    if (!doc) {
      throw new Error('Failed to save bidding settings');
    }
    
    return {
      ...doc,
      ...(doc.value as Omit<FirestoreBiddingSettings, 'id' | 'createdAt' | 'updatedAt'>),
    } as FirestoreBiddingSettings;
  }

  /**
   * Get furniture PDF settings
   * 
   * @returns Furniture PDF settings or null if not configured
   */
  async getFurniturePdfSettings(): Promise<FirestoreFurniturePdfSettings | null> {
    const doc = await this.getDocument('furniturePdf');
    if (!doc) return null;
    
    return {
      ...doc,
      ...(doc.value as Omit<FirestoreFurniturePdfSettings, 'id' | 'key' | 'value' | 'createdAt' | 'updatedAt'>),
    } as FirestoreFurniturePdfSettings;
  }

  /**
   * Set furniture PDF settings
   * 
   * @param settings - Furniture PDF settings to save
   * @returns Saved settings
   */
  async setFurniturePdfSettings(
    settings: Partial<Omit<FirestoreFurniturePdfSettings, 'id' | 'key' | 'value' | 'createdAt' | 'updatedAt'>>
  ): Promise<FirestoreFurniturePdfSettings> {
    // Get existing settings to merge
    const existing = await this.get<Omit<FirestoreFurniturePdfSettings, 'id' | 'key' | 'value' | 'createdAt' | 'updatedAt'>>('furniturePdf');
    const merged = { ...existing, ...settings };
    
    await this.set('furniturePdf', merged);
    
    const doc = await this.getDocument('furniturePdf');
    if (!doc) {
      throw new Error('Failed to save furniture PDF settings');
    }
    
    return {
      ...doc,
      ...(doc.value as Omit<FirestoreFurniturePdfSettings, 'id' | 'key' | 'value' | 'createdAt' | 'updatedAt'>),
    } as FirestoreFurniturePdfSettings;
  }

  /**
   * Reset furniture PDF settings to defaults
   * 
   * @returns Default settings
   */
  async resetFurniturePdfSettings(): Promise<FirestoreFurniturePdfSettings> {
    const defaults: Omit<FirestoreFurniturePdfSettings, 'id' | 'key' | 'value' | 'createdAt' | 'updatedAt'> = {
      companyName: 'NỘI THẤT NHANH',
      companyTagline: 'Đối tác tin cậy cho ngôi nhà của bạn',
      documentTitle: 'BÁO GIÁ NỘI THẤT',
      primaryColor: '#F5D393',
      textColor: '#333333',
      mutedColor: '#666666',
      borderColor: '#E0E0E0',
      companyNameSize: 24,
      documentTitleSize: 18,
      sectionTitleSize: 12,
      bodyTextSize: 10,
      footerTextSize: 8,
      apartmentInfoTitle: 'THÔNG TIN CĂN HỘ',
      productsTitle: 'SẢN PHẨM ĐÃ CHỌN',
      priceDetailsTitle: 'CHI TIẾT GIÁ',
      contactInfoTitle: 'THÔNG TIN LIÊN HỆ',
      totalLabel: 'TỔNG CỘNG',
      footerNote: 'Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm và điều kiện cụ thể.',
      footerCopyright: '© NỘI THẤT NHANH - Đối tác tin cậy cho ngôi nhà của bạn',
    };
    
    await this.set('furniturePdf', defaults);
    
    const doc = await this.getDocument('furniturePdf');
    if (!doc) {
      throw new Error('Failed to reset furniture PDF settings');
    }
    
    return {
      ...doc,
      ...defaults,
    } as FirestoreFurniturePdfSettings;
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Set multiple settings at once
   * 
   * @param settings - Object with key-value pairs to set
   */
  async setMany(settings: Record<string, unknown>): Promise<void> {
    const db = await this.getDb();
    const collection = await this.getCollection();
    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();

    for (const [key, value] of Object.entries(settings)) {
      const docRef = collection.doc(key);
      batch.set(docRef, {
        value,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
    }

    await batch.commit();
    logger.debug(`Batch saved ${Object.keys(settings).length} settings`);
  }

  /**
   * Delete multiple settings at once
   * 
   * @param keys - Array of setting keys to delete
   */
  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const db = await this.getDb();
    const collection = await this.getCollection();
    const batch = db.batch();

    for (const key of keys) {
      const docRef = collection.doc(key);
      batch.delete(docRef);
    }

    await batch.commit();
    logger.debug(`Batch deleted ${keys.length} settings`);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let settingsServiceInstance: SettingsFirestoreService | null = null;

/**
 * Get singleton instance of SettingsFirestoreService
 */
export function getSettingsFirestoreService(): SettingsFirestoreService {
  if (!settingsServiceInstance) {
    settingsServiceInstance = new SettingsFirestoreService();
  }
  return settingsServiceInstance;
}

export default SettingsFirestoreService;
