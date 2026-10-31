export type BookCategory = 'all' | 'reading' | 'unread' | 'completed' | 'abandoned' | 'favorites';

export type BookType = 'demo' | 'pdf' | 'epub' | 'text';

export type ShelfStyle = 'wood-gothic' | 'wood-oak' | 'digital-neon' | 'digital-cyber' | 'minimal-oled';

export type ShelfViewMode = 'covers' | 'spines' | 'stacks';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: 'reading' | 'unread' | 'completed' | 'abandoned';
  favorite: boolean;
  emoji: string;
  type: BookType;
  content?: string[]; // Array of page texts for demo/text books
  coverGradient?: string;
  fileName?: string;
  fileSize?: string;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  addedAt: number;
  lastReadAt?: number;
}

export interface Quote {
  id: string;
  bookId: string;
  bookTitle: string;
  chapter: string;
  emotion: string;
  text: string;
  comment?: string;
  createdAt: number;
}

export interface PageSticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  isLocked?: boolean; // When placed, locked in place; click to unlock and move
}

export interface Bookmark {
  id: string;
  bookId: string;
  bookTitle: string;
  page: number;
  note?: string;
  createdAt: number;
}

export interface TextHighlight {
  id: string;
  bookId: string;
  page: number;
  text: string;
  color: 'pink' | 'purple' | 'gold' | 'emerald';
  createdAt: number;
}

export type ReaderModeId = 'dark-oled' | 'vanilla-fresa' | 'sepia-pergamino' | 'azul-abisal' | 'papel-dia';

export interface ReaderModeOption {
  id: ReaderModeId;
  name: string;
  bg: string;
  text: string;
  accent: string;
}

export type ThemeId = 'kawaii-dark' | 'vanilla-fresa' | 'nocturno' | 'brujita-lavanda' | 'carmesi-vampiro';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  icon: string;
  primary: string;
  card: string;
  accent: string;
}

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: string;
  preview: string;
}

export interface DailyReadingStat {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Lun", "Mar"
  formattedDate: string; // e.g. "20 Oct"
  minutes: number;
  pages: number;
  booksCount: number;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  bookTitle: string;
  minutes: number;
  pagesRead: number;
  timestamp: number;
}

export interface ReadingStatsData {
  dailyRecords: Record<string, { minutes: number; pages: number; bookIds: string[] }>;
  sessions: ReadingSession[];
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export interface ShelfBackgroundConfig {
  customImage: string | null;
  presetId?: string;
  overlayDarkness: number; // 10 to 95 (%)
  blur: number; // 0 to 12 (px)
  fit: 'cover' | 'pattern';
}

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  fileName?: string;
  fileSize?: string;
  duration?: number;
  isCustom: boolean;
  type?: 'soundscape-rain' | 'soundscape-purr' | 'file';
  addedAt: number;
}
