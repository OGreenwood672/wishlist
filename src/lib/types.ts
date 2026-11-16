import type { Theme } from "./theme/schema";

export type Status = "available" | "on_it" | "bought";
export type Priority = "must" | "love" | "nice";
export type Role = "admin" | "guest";

export const STATUSES: Status[] = ["available", "on_it", "bought"];
export const PRIORITIES: Priority[] = ["must", "love", "nice"];

export const STATUS_LABELS: Record<Status, string> = {
  available: "Available",
  on_it: "On it",
  bought: "Bought",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  must: "Must have",
  love: "Would love",
  nice: "Nice to have",
};

export interface Wishlist {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: Theme;
  is_archived: boolean;
  password_version: number;
  created_at: string;
}

export interface Category {
  id: string;
  wishlist_id: string;
  name: string;
  emoji: string;
  status: Status;
  status_by: string | null;
  status_at: string | null;
  priority: Priority;
  price_min: number | null;
  price_max: number | null;
  is_archived: boolean;
  created_at: string;
}

export interface WishLink {
  id: string;
  category_id: string;
  url: string;
  title: string;
  image_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
  price: number | null;
  currency: string | null;
  note: string;
  is_favourite: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  category_id: string;
  author_name: string;
  author_role: Role;
  body: string;
  created_at: string;
}

export type ActivityType =
  | "status"
  | "comment"
  | "category_added"
  | "link_added";

export interface Activity {
  id: string;
  wishlist_id: string;
  category_id: string | null;
  actor_name: string;
  actor_role: Role;
  type: ActivityType;
  payload: { category?: string; status?: Status; excerpt?: string; title?: string };
  created_at: string;
}

export interface ProfileSection {
  label: string;
  value: string;
}

export interface Profile {
  owner_name: string;
  sections: ProfileSection[];
}

/** Category with the bits the grid card needs. */
export interface CategorySummary extends Category {
  links: Pick<WishLink, "id" | "image_url" | "price" | "currency" | "is_favourite">[];
  comment_count: number;
}
