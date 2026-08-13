export function formatSom(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + " so'm";
}

export const MENU_CATEGORIES = [
  "Starters",
  "Main Courses",
  "Pizza",
  "Pasta",
  "Desserts",
  "Beverages",
] as const;

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  available: boolean;
  featured: boolean;
  sort_order: number;
};

export type Reservation = {
  id: string;
  full_name: string;
  phone: string;
  guests: number;
  reserved_date: string;
  reserved_time: string;
  notes: string;
  status: string;
  created_at: string;
};

export type SiteSettings = {
  id: number;
  hero_title: string;
  phone: string;
  address: string;
  hours: string;
  instagram: string;
};
