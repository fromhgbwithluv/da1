import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppDatabase } from '../types/user';

const STORAGE_KEY_URL = 'topsivi_supabase_url';
const STORAGE_KEY_KEY = 'topsivi_supabase_anon_key';
const TABLE_NAME = 'topsivi_database';
const RECORD_ID = 'default';

export const DEFAULT_SUPABASE_URL = 'https://larymjpxnytoygbzmipp.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcnltanB4bnl0b3lnYnptaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDg4MzksImV4cCI6MjEwODMyNDgzOX0.5caQw4vxQYEY5iH2uzyAE0ebR1kK9aXwz-PExNz8LVM';

export function cleanSupabaseUrl(url: string): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

/**
 * Lấy cấu hình Supabase từ env (Astro build-time), localStorage hoặc mặc định
 */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  // 1. Kiểm tra Astro public env
  const envUrl = cleanSupabaseUrl(import.meta.env.PUBLIC_SUPABASE_URL || '');
  const envKey = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  // 2. Kiểm tra localStorage (nếu đang chạy trên client)
  if (typeof window !== 'undefined') {
    const localUrl = cleanSupabaseUrl(localStorage.getItem(STORAGE_KEY_URL) || '');
    const localKey = (localStorage.getItem(STORAGE_KEY_KEY) || '').trim();
    if (localUrl && localKey) {
      return { url: localUrl, anonKey: localKey };
    }
  }

  // 3. Fallback vào project Supabase mặc định
  return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };
}

/**
 * Kiểm tra xem Supabase đã được cấu hình hay chưa
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

/**
 * Lấy hoặc khởi tạo Supabase Client
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    cachedClient = null;
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } }
    });
    cachedUrl = url;
    cachedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('[Supabase] Init error:', err);
    return null;
  }
}

/**
 * Lưu cấu hình Supabase vào localStorage trên trình duyệt
 */
export async function saveSupabaseConfig(url: string, anonKey: string): Promise<{ success: boolean; error?: string }> {
  const cleanUrl = cleanSupabaseUrl(url);
  const cleanKey = anonKey.trim();

  if (!cleanUrl.startsWith('https://')) {
    return { success: false, error: 'URL dự án Supabase phải bắt đầu bằng https:// (Ví dụ: https://xyz.supabase.co)' };
  }
  if (!cleanKey || cleanKey.length < 20) {
    return { success: false, error: 'Anon Public Key không hợp lệ.' };
  }

  try {
    const testClient = createClient(cleanUrl, cleanKey, { auth: { persistSession: false } });
    // Thử truy vấn bảng topsivi_database
    const { error } = await testClient.from(TABLE_NAME).select('id').limit(1);
    if (error) {
      return {
        success: false,
        error: `Kết nối thành công nhưng chưa tìm thấy bảng "${TABLE_NAME}". Vui lòng chạy lệnh SQL tạo bảng trong Supabase SQL Editor. Chi tiết: ${error.message}`
      };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    }

    cachedClient = testClient;
    cachedUrl = cleanUrl;
    cachedKey = cleanKey;

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Không thể kết nối đến Supabase' };
  }
}

/**
 * Xóa cấu hình Supabase (quay về chế độ Offline / LocalStorage thuần)
 */
export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
}

/**
 * Tải toàn bộ Database từ Supabase Cloud
 */
export async function fetchCloudDatabase(): Promise<AppDatabase | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(TABLE_NAME)
      .select('data, updated_at')
      .eq('id', RECORD_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Chưa có bản ghi nào, trả về null để caller khởi tạo
        return null;
      }
      console.warn('[Supabase] Fetch error:', error.message);
      return null;
    }

    if (data && data.data) {
      return data.data as AppDatabase;
    }
  } catch (err) {
    console.error('[Supabase] Exception fetching cloud database:', err);
  }

  return null;
}

/**
 * Đẩy Database lên Supabase Cloud (Upsert)
 */
export async function pushCloudDatabase(db: AppDatabase): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: RECORD_ID,
      data: db,
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Push error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception pushing cloud database:', err);
    return false;
  }
}

/**
 * Lắng nghe thay đổi Realtime từ Supabase (Đồng bộ tức thì khi thiết bị khác đăng bài/đăng ký)
 */
export function subscribeToCloudDatabase(onRemoteUpdate: (db: AppDatabase) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('topsivi_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLE_NAME,
          filter: `id=eq.${RECORD_ID}`
        },
        (payload: any) => {
          if (payload.new && payload.new.data) {
            onRemoteUpdate(payload.new.data as AppDatabase);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error('[Supabase] Subscription error:', err);
    return () => {};
  }
}

/**
 * Đoạn mã SQL mẫu để người dùng copy-paste vào Supabase SQL Editor
 */
export const SUPABASE_SETUP_SQL = `-- 1. Tạo bảng topsivi_database để lưu trữ dữ liệu đồng bộ
CREATE TABLE IF NOT EXISTS public.topsivi_database (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kích hoạt Row Level Security (RLS) và cho phép đọc/ghi công khai
ALTER TABLE public.topsivi_database ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON public.topsivi_database;
CREATE POLICY "Allow public read" ON public.topsivi_database FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write" ON public.topsivi_database;
CREATE POLICY "Allow public write" ON public.topsivi_database FOR ALL USING (true) WITH CHECK (true);

-- 3. Kích hoạt tính năng Realtime để đồng bộ tức thì giữa các thiết bị
ALTER PUBLICATION supabase_realtime ADD TABLE public.topsivi_database;
`;
