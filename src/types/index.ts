export interface Category {
  id: number;
  name: string;
  name_ru: string | null;
  slug: string;
  icon: string | null;
  parent_id: number | null;
  level: number;
  keywords: string[];
  sort_order: number;
  children?: Category[];
}

export interface Listing {
  id: string;
  telegram_message_id: number;
  telegram_channel: string;
  telegram_sender_id: number | null;
  telegram_sender_name: string | null;
  telegram_sender_username: string | null;
  description_original: string | null;
  description_en: string | null;
  price: number | null;
  currency: string;
  location: string | null;
  category_id: number | null;
  categorization_method: string | null;
  content_hash: string | null;
  is_duplicate: boolean;
  duplicate_of: string | null;
  photos: string[];
  raw_date: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ListingsFilter {
  search?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  datePosted?: "today" | "week" | "month" | "all";
  sort?: "newest" | "oldest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
