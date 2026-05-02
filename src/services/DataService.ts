import { OperationType } from '../lib/error-handler';

const STORAGE_PREFIX = 'mindcare_';

function handleDataServiceError(error: unknown, operationType: string, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    mode: 'localStorage'
  };
  console.error('DataService Error:', JSON.stringify(errInfo));
}

export class DataService {
  private static getStorageKey(path: string, uid: string): string {
    return `${STORAGE_PREFIX}${path}_${uid}`;
  }

  static subscribeToCollection(path: string, uid: string, callback: (data: any[]) => void, limitCount = 50) {
    try {
      const key = this.getStorageKey(path, uid);
      const stored = localStorage.getItem(key);
      let data: any[] = [];
      
      if (stored) {
        try {
          data = JSON.parse(stored);
        } catch {
          data = [];
        }
      }
      
      // Sort by createdAt descending
      data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      // Apply limit
      data = data.slice(0, limitCount);
      
      callback(data);
      
      // Return unsubscribe function (no-op for localStorage)
      return () => {};
    } catch (error) {
      handleDataServiceError(error, OperationType.LIST, path);
      callback([]);
    }
  }

  static async createDocument(path: string, data: any) {
    try {
      const key = this.getStorageKey(path, data.userId || 'default');
      const stored = localStorage.getItem(key);
      let existing: any[] = [];
      
      if (stored) {
        try {
          existing = JSON.parse(stored);
        } catch {
          existing = [];
        }
      }
      
      const newDoc = {
        ...data,
        id: Date.now().toString(),
        createdAt: { seconds: Date.now() / 1000 },
        updatedAt: { seconds: Date.now() / 1000 }
      };
      
      existing.unshift(newDoc);
      localStorage.setItem(key, JSON.stringify(existing));
      
      return { id: newDoc.id };
    } catch (error) {
      handleDataServiceError(error, OperationType.CREATE, path);
    }
  }

  static async updateDocument(path: string, id: string, data: any) {
    try {
      // Find and update in localStorage
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX + path));
      
      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          let existing: any[] = JSON.parse(stored);
          const idx = existing.findIndex(d => d.id === id);
          
          if (idx !== -1) {
            existing[idx] = {
              ...existing[idx],
              ...data,
              updatedAt: { seconds: Date.now() / 1000 }
            };
            localStorage.setItem(key, JSON.stringify(existing));
            return;
          }
        }
      }
      
      throw new Error('Document not found');
    } catch (error) {
      handleDataServiceError(error, OperationType.UPDATE, `${path}/${id}`);
    }
  }

  static async getDocument(path: string, id: string): Promise<any | null> {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX + path));
      
      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const existing: any[] = JSON.parse(stored);
          const doc = existing.find(d => d.id === id);
          
          if (doc) return doc;
        }
      }
      
      return null;
    } catch (error) {
      handleDataServiceError(error, OperationType.GET, `${path}/${id}`);
      return null;
    }
  }

  static async getCollection(path: string, uid: string): Promise<any[]> {
    try {
      const key = this.getStorageKey(path, uid);
      const stored = localStorage.getItem(key);
      
      if (stored) {
        return JSON.parse(stored);
      }
      
      return [];
    } catch (error) {
      handleDataServiceError(error, OperationType.LIST, path);
      return [];
    }
  }

  static async deleteDocument(path: string, id: string) {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX + path));
      
      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          let existing: any[] = JSON.parse(stored);
          existing = existing.filter(d => d.id !== id);
          localStorage.setItem(key, JSON.stringify(existing));
          return;
        }
      }
    } catch (error) {
      handleDataServiceError(error, OperationType.DELETE, `${path}/${id}`);
    }
  }
}
