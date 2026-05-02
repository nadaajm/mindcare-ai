// Firebase compatibility types for localStorage DataService layer
export interface Collection {
  path: string;
  queryConstraints?: any[];
}

export interface Query extends Collection {
  constraints?: any[];
}

export interface DocumentData {
  [key: string]: any;
}

export interface DocumentReference {
  path: string;
  collectionName: string;
  id: string;
}

export interface QuerySnapshot {
  docs: Array<{
    id: string;
    data: () => DocumentData;
  }>;
}

// Firebase App stub type (avoids type conflicts with firebase package)
export interface FirebaseApp {
  type: string;
}

// Firestore stub type (avoids type conflicts with firebase package)
export interface FirestoreStub {
  type: string;
}

// Auth stub type (avoids type conflicts with firebase package)  
export interface AuthStub {
  type: string;
}

// Document snapshot
export interface DocumentSnapshot {
  id: string;
  exists: () => boolean;
  data: () => DocumentData | undefined;
}
