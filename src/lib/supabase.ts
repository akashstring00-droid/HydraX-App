import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export let supabase: any;

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

class MockQueryBuilder {
  private table: string;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any;
  private filters: Array<{ type: 'eq' | 'gte'; column: string; value: any }> = [];
  private orderConfig: { column: string; ascending: boolean } | null = null;
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    this.operation = 'select';
    return this;
  }

  insert(values: any) {
    this.operation = 'insert';
    this.payload = values;
    return this;
  }

  update(values: any) {
    this.operation = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  upsert(values: any) {
    this.operation = 'upsert';
    this.payload = values;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = { column, ascending: options?.ascending !== false };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const result = await this.execute();
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  private async execute() {
    await new Promise(r => setTimeout(r, 200));
    if (typeof window === 'undefined') {
      return { data: null, error: { message: 'Window local storage unavailable' } };
    }

    const storageKey = `hydrax_mock_${this.table}`;
    let db: any[] = [];
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          db = parsed;
        } else {
          // If stored as record/dictionary, convert to list
          db = Object.values(parsed);
        }
      }
    } catch (e) {
      db = [];
    }

    if (this.operation === 'insert') {
      const dataToInsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const insertedRows = dataToInsert.map(row => {
        const newRow = {
          id: row.id || 'mock-id-' + Math.random().toString(36).substring(2, 11),
          timestamp: row.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString(),
          ...row
        };
        db.push(newRow);
        return newRow;
      });
      window.localStorage.setItem(storageKey, JSON.stringify(db));
      return { data: insertedRows, error: null };
    }

    if (this.operation === 'upsert') {
      const dataToUpsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const upsertedRows = dataToUpsert.map(row => {
        const id = row.id || row.user_id || row.uid || 'mock-id-upsert';
        const index = db.findIndex(r => (r.id === id || r.user_id === id || r.uid === id));
        const updatedRow = {
          id,
          timestamp: row.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString(),
          ...row
        };
        if (index > -1) {
          db[index] = { ...db[index], ...updatedRow };
        } else {
          db.push(updatedRow);
        }
        return updatedRow;
      });
      window.localStorage.setItem(storageKey, JSON.stringify(db));
      return { data: upsertedRows, error: null };
    }

    if (this.operation === 'update') {
      let updatedCount = 0;
      db = db.map(row => {
        let matches = true;
        for (const filter of this.filters) {
          const val = row[filter.column];
          if (filter.type === 'eq' && val !== filter.value) {
            matches = false;
          }
        }
        if (matches) {
          updatedCount++;
          return { ...row, ...this.payload };
        }
        return row;
      });
      window.localStorage.setItem(storageKey, JSON.stringify(db));
      return { data: db, error: null };
    }

    if (this.operation === 'delete') {
      db = db.filter(row => {
        let matches = true;
        for (const filter of this.filters) {
          const val = row[filter.column];
          if (filter.type === 'eq' && val !== filter.value) {
            matches = false;
          }
        }
        return !matches;
      });
      window.localStorage.setItem(storageKey, JSON.stringify(db));
      return { data: null, error: null };
    }

    // Default SELECT
    let filtered = [...db];
    for (const filter of this.filters) {
      filtered = filtered.filter(row => {
        const val = row[filter.column];
        if (filter.type === 'eq') {
          return val === filter.value;
        }
        if (filter.type === 'gte') {
          return new Date(val).getTime() >= new Date(filter.value).getTime();
        }
        return true;
      });
    }

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      filtered.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });
    }

    if (this.isSingle) {
      if (filtered.length > 0) {
        return { data: filtered[0], error: null };
      }
      return { data: null, error: { message: 'Row not found' } };
    }

    return { data: filtered, error: null };
  }
}

function setupMockClient() {
  supabase = {
    auth: {
      signUp: async ({ email }: any) => {
        await new Promise(r => setTimeout(r, 800));
        const mockUid = 'mock-uid-' + Math.random().toString(36).substring(2, 11);
        const mockUser = { id: mockUid, email };
        return { data: { user: mockUser }, error: null };
      },
      signInWithPassword: async ({ email }: any) => {
        await new Promise(r => setTimeout(r, 800));
        if (email === 'error@hydrax.com') {
          return { data: { user: null }, error: { message: 'Invalid credentials. User not found.' } };
        }
        const mockUser = { id: 'mock-uid-123', email };
        return { data: { user: mockUser }, error: null };
      },
      signInWithOAuth: async ({ provider }: any) => {
        await new Promise(r => setTimeout(r, 800));
        return { data: { provider }, error: null };
      },
      resetPasswordForEmail: async (email: string) => {
        await new Promise(r => setTimeout(r, 500));
        return { data: {}, error: null };
      },
      getUser: async () => {
        return { data: { user: { id: 'mock-uid-123', email: 'athlete.john@gmail.com' } }, error: null };
      },
      signOut: async () => {
        await new Promise(r => setTimeout(r, 300));
        return { error: null };
      }
    },
    from: (table: string) => {
      return new MockQueryBuilder(table);
    }
  };
}

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase Bio-Intelligence Database client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Supabase client. Running in Mock Database mode.", error);
    setupMockClient();
  }
} else {
  console.warn("Supabase URL and Anon Key are missing from environment. Running in persistent Client-Side Mock Database mode.");
  setupMockClient();
}
