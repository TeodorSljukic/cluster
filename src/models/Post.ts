export interface Post {
  _id?: string;
  type: "news" | "event" | "resource";
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: "draft" | "published";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Event specific fields
  eventDate?: Date;
  eventLocation?: string;
  // Language/locale
  locale?: string;
  // Additional metadata (includes translations)
  metadata?: {
    titleTranslations?: Record<string, string>;
    contentTranslations?: Record<string, string>;
    excerptTranslations?: Record<string, string>;
    [key: string]: any;
  };
}
