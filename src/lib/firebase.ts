// Unified data layer: Firebase-compatibility layer over localStorage DataService
// This provides Firestore-like APIs using the working localStorage DataService
import { DataService } from '../services/DataService';
import { Collection, Query, DocumentData, DocumentReference } from '../types/firebase-types';

let isConfigured = true;

// Active subscriptions
const subscriptions: Map<string, NodeJS.Timeout> = new Map();
let subCounter = 0;

// Create a stub Firestore instance for type compatibility
class FirestoreStub {
  type = 'firestore-lite';
}

let dbStub: FirestoreStub | null = null;
const getStorageKey = (path: string, uid: string) => `mindcare_${path}_${uid}`;

// Collection reference wrapper for Firestore-like API compatibility
export function collection(db: any, path: string, ...queryConstraints: any[]): Collection {
  return {
    path,
    queryConstraints: queryConstraints || []
  } as Collection;
}

// Document reference (works with both 2-arg: db,path and 3-arg: db,collection,id)
export function doc(db: any, path: string, id?: string): DocumentReference {
  if (id) {
    // Called as doc(db, 'collection', 'id')
    return {
      path: `${path}/${id}`,
      collectionName: path,
      id: id
    } as DocumentReference;
  }
  // Called as doc(db, 'collection/id')
  const parts = path.split('/');
  const collectionName = parts[0];
  const docId = parts[1];
  return {
    path,
    collectionName,
    id: docId || 'new'
  } as DocumentReference;
}

// Query builder
export function query(collectionRef: Collection, ...constraints: any[]): Query {
  return {
    ...collectionRef,
    constraints: constraints || []
  } as Query;
}

// where clause
export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

// orderBy clause
export function orderBy(field: string, direction: 'asc' | 'desc' = 'desc') {
  return { type: 'orderBy', field, direction };
}

// limit clause
export function limit(count: number) {
  return { type: 'limit', count };
}

// Add document
export async function addDoc(collectionRef: Collection, data: any) {
  const result = await DataService.createDocument(collectionRef.path, data);
  return { id: result?.id || Date.now().toString() };
}

// Get documents
export async function getDocs(queryRef: Query) {
  const uid = queryRef.constraints?.find((c: any) => c?.type === 'where' && c?.field === 'userId')?.value || 'default';
  const data = await DataService.getCollection(queryRef.path, uid);
  
  let items = [...data];
  
  // Apply query constraints
  for (const constraint of queryRef.constraints || []) {
    if (!constraint) continue;
    if (constraint.type === 'where') {
      items = items.filter((item: any) => {
        const itemValue = item[constraint.field];
        if (constraint.op === '==') return itemValue === constraint.value;
        if (constraint.op === '>=') return itemValue >= constraint.value;
        if (constraint.op === '<=') return itemValue <= constraint.value;
        return true;
      });
    } else if (constraint.type === 'orderBy') {
      items.sort((a: any, b: any) => {
        const aVal = a[constraint.field];
        const bVal = b[constraint.field];
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        if (constraint.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    } else if (constraint.type === 'limit') {
      items = items.slice(0, constraint.count);
    }
  }
  
  return {
    docs: items.map((item: any) => ({
      id: item.id,
      ref: {
        collectionName: queryRef.path,
        id: item.id
      } as DocumentReference,
      data: () => ({ ...item })
    }))
  };
}

// Update document
export async function updateDoc(ref: any, data: any) {
  // ref can be a DocumentReference or result of doc() call
  const collectionName = ref.collectionName || (ref._key && ref._key.path && ref._key.path.split('/')[0]);
  const docId = ref.id || ref._key.id;
  
  // Get all documents in the collection
  const dataList = await DataService.getCollection(collectionName || 'users', 'default');
  const idx = dataList.findIndex(d => d.id === docId);
  if (idx !== -1) {
    // Handle increment operator
    const processedData = { ...data };
    for (const key in processedData) {
      if (processedData[key] && typeof processedData[key] === 'object' && (processedData[key] as any).__type === 'increment') {
        const currentVal = dataList[idx][key] || 0;
        processedData[key] = currentVal + (processedData[key] as any).__value;
      }
    }
    dataList[idx] = {
      ...dataList[idx],
      ...processedData,
      updatedAt: { seconds: Date.now() / 1000 }
    };
    // Save back to localStorage
    const key = getStorageKey(collectionName || 'users', 'default');
    localStorage.setItem(key, JSON.stringify(dataList));
  }
}

// Real-time snapshot subscription (polyfill using polling)
export function onSnapshot(
  queryRef: Query,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
) {
  const runQuery = async () => {
    try {
      const snap = await getDocs(queryRef);
      onNext(snap);
    } catch (err) {
      if (onError) onError(err);
    }
  };
  
  // Run immediately
  runQuery();
  
  // Poll every 2 seconds for updates
  const key = `${queryRef.path}_${subCounter++}`;
  const interval = setInterval(runQuery, 2000);
  subscriptions.set(key, interval);
  
  return () => {
    clearInterval(interval);
    subscriptions.delete(key);
  };
}

// Delete document
export async function deleteDoc(ref: DocumentReference) {
  const collectionName = ref.collectionName;
  const docId = ref.id;
  await DataService.deleteDocument(collectionName, docId);
}

// Get single document
export async function getDoc(ref: DocumentReference) {
  const collectionName = ref.collectionName;
  const docId = ref.id;
  const dataList = await DataService.getCollection(collectionName, 'default');
  const item = dataList.find(d => d.id === docId);
  return item ? { id: item.id, data: () => ({ ...item }) } : null;
}

// Write batch for deletions
export function writeBatch(db: any) {
  const operations: any[] = [];
  return {
    delete: (ref: DocumentReference) => {
      operations.push({ type: 'delete', ref });
      return { operations };
    },
    commit: async () => {
      for (const op of operations) {
        if (op.type === 'delete' && op.ref && op.ref.collectionName && op.ref.id) {
          await DataService.deleteDocument(op.ref.collectionName, op.ref.id);
        }
      }
    }
  };
}

// Server timestamp placeholder
export const serverTimestamp = () => ({ 
  seconds: Math.floor(Date.now() / 1000), 
  nanoseconds: 0 
});

// Increment operator for atomic updates
export function increment(n: number) {
  return { __type: 'increment', __value: n };
}

// Null-safe getters
export const getDb = () => {
  if (!dbStub) {
    dbStub = new FirestoreStub();
  }
  return dbStub as any;
};

export const getAuthInstance = () => null;
export const isFirebaseConfigured = (): boolean => isConfigured;

// Cleanup function
export const cleanupSubscriptions = () => {
  for (const [key, interval] of subscriptions) {
    clearInterval(interval);
  }
  subscriptions.clear();
};

// Compatibility exports
export { isConfigured as default };
