import fs from "fs";
import path from "path";

// Simple self-contained MongoDB-like File Database for DevLaunch AI.
// This supports the Repository Pattern and works out-of-the-box in the
// container sandbox while being easily adaptable to MongoDB.

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db_store.json");

interface BaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export class Collection<T extends BaseDocument> {
  private name: string;
  private getDb: () => Record<string, any[]>;
  private saveDb: (db: Record<string, any[]>) => void;

  constructor(
    name: string,
    getDb: () => Record<string, any[]>,
    saveDb: (db: Record<string, any[]>) => void
  ) {
    this.name = name;
    this.getDb = getDb;
    this.saveDb = saveDb;
  }

  private getItems(): T[] {
    const db = this.getDb();
    if (!db[this.name]) {
      db[this.name] = [];
    }
    return db[this.name] as T[];
  }

  private saveItems(items: T[]) {
    const db = this.getDb();
    db[this.name] = items;
    this.saveDb(db);
  }

  async find(filter?: (item: T) => boolean): Promise<T[]> {
    const items = this.getItems();
    if (!filter) return items;
    return items.filter(filter);
  }

  async findOne(filter: (item: T) => boolean): Promise<T | null> {
    const items = this.getItems();
    const item = items.find(filter);
    return item || null;
  }

  async findById(id: string): Promise<T | null> {
    return this.findOne((item) => item.id === id);
  }

  async insertOne(doc: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<T> {
    const items = this.getItems();
    const now = new Date().toISOString();
    const newDoc = {
      ...(doc as any),
      id: doc.id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: now,
      updatedAt: now,
    } as T;

    items.push(newDoc);
    this.saveItems(items);
    return newDoc;
  }

  async updateOne(id: string, update: Partial<Omit<T, "id" | "createdAt">>): Promise<T | null> {
    const items = this.getItems();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const current = items[index];
    const updated = {
      ...current,
      ...update,
      updatedAt: new Date().toISOString(),
    } as T;

    items[index] = updated;
    this.saveItems(items);
    return updated;
  }

  async deleteOne(id: string): Promise<boolean> {
    const items = this.getItems();
    const initialLength = items.length;
    const filtered = items.filter((item) => item.id !== id);
    this.saveItems(filtered);
    return filtered.length < initialLength;
  }

  async count(filter?: (item: T) => boolean): Promise<number> {
    const items = this.getItems();
    if (!filter) return items.length;
    return items.filter(filter).length;
  }
}

class DatabaseEngine {
  private dbState: Record<string, any[]> = {};
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), "utf-8");
    }
    this.load();
  }

  private load() {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      this.dbState = JSON.parse(content || "{}");
      this.isLoaded = true;
    } catch (e) {
      console.error("Failed to load local DB state. Initializing empty DB.", e);
      this.dbState = {};
    }
  }

  private save(db: Record<string, any[]>) {
    try {
      this.dbState = db;
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write database file:", e);
    }
  }

  getCollection<T extends BaseDocument>(name: string): Collection<T> {
    return new Collection<T>(
      name,
      () => this.dbState,
      (db) => this.save(db)
    );
  }

  async ping(): Promise<boolean> {
    return this.isLoaded;
  }
}

export const db = new DatabaseEngine();
