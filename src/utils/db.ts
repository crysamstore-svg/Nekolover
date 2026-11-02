import { Book, BookType } from '../types';

const DB_NAME = 'NekoLoverReadDB';
const DB_VERSION = 2;
const FILES_STORE = 'files';
const BOOKS_STORE = 'books';

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE);
      }
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// File Storage (Blobs / ArrayBuffers for PDFs & EPUBs)
export async function saveFileToDB(id: string, fileData: Blob | ArrayBuffer): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, 'readwrite');
    const store = tx.objectStore(FILES_STORE);
    const request = store.put(fileData, id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFileFromDB(id: string): Promise<Blob | ArrayBuffer | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, 'readonly');
      const store = tx.objectStore(FILES_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB:', err);
    return null;
  }
}

export async function deleteFileFromDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, 'readwrite');
      const store = tx.objectStore(FILES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }
}

// High-Capacity Book Metadata Storage (Supports 2,000+ Books safely)
export async function saveBooksToDB(books: Book[]): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readwrite');
      const store = tx.objectStore(BOOKS_STORE);

      // Clear existing and rewrite in single atomic transaction
      store.clear();
      for (const book of books) {
        store.put(book);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error saving books to IndexedDB:', err);
  }
}

export async function getBooksFromDB(): Promise<Book[] | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readonly');
      const store = tx.objectStore(BOOKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result;
        if (result && Array.isArray(result) && result.length > 0) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error reading books from IndexedDB:', err);
    return null;
  }
}

export async function saveSingleBookToDB(book: Book): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readwrite');
      const store = tx.objectStore(BOOKS_STORE);
      const req = store.put(book);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error saving single book to IndexedDB:', err);
  }
}

export async function deleteBookFromDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readwrite');
      const store = tx.objectStore(BOOKS_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error deleting book from IndexedDB:', err);
  }
}

// Helper to assign cute gothic / kawaii emojis based on title keywords
export function getSmartEmojiForTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('gato') || lower.includes('neko') || lower.includes('cat')) return '🐈‍⬛';
  if (lower.includes('fantasma') || lower.includes('ghost') || lower.includes('muerte')) return '👻';
  if (lower.includes('vampir') || lower.includes('dracula') || lower.includes('sangre')) return '🦇';
  if (lower.includes('magia') || lower.includes('bruja') || lower.includes('witch') || lower.includes('hechizo')) return '🔮';
  if (lower.includes('amor') || lower.includes('love') || lower.includes('romance') || lower.includes('corazón')) return '🍓';
  if (lower.includes('noche') || lower.includes('luna') || lower.includes('moon') || lower.includes('sombra')) return '🌙';
  if (lower.includes('poesía') || lower.includes('poema') || lower.includes('carta')) return '🪶';
  if (lower.includes('misterio') || lower.includes('crimen') || lower.includes('detective') || lower.includes('enigma')) return '🗝️';
  if (lower.includes('ciencia') || lower.includes('química') || lower.includes('potion')) return '🧪';
  if (lower.includes('castillo') || lower.includes('reino') || lower.includes('corona')) return '👑';
  if (lower.includes('calavera') || lower.includes('hueso') || lower.includes('terror')) return '💀';
  if (lower.includes('dulce') || lower.includes('postre') || lower.includes('pastel')) return '🧁';
  return '📖';
}

// Generate aesthetic Dark Reborn gradient
export function getRandomGothicGradient(index: number): string {
  const gradients = [
    'linear-gradient(135deg, #2b112c 0%, #100b19 100%)',
    'linear-gradient(135deg, #18233c 0%, #0a0e19 100%)',
    'linear-gradient(135deg, #2e1624 0%, #150912 100%)',
    'linear-gradient(135deg, #1d1b38 0%, #0d0b1a 100%)',
    'linear-gradient(135deg, #29121d 0%, #11070e 100%)',
    'linear-gradient(135deg, #162424 0%, #091313 100%)',
    'linear-gradient(135deg, #2e1d0d 0%, #140b03 100%)'
  ];
  return gradients[index % gradients.length];
}
