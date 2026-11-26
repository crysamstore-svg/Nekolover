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
  coverImage?: string; // Public HTTPS URL or compressed local Data URL cover
  genres?: string[];
  description?: string;
  publisher?: string;
  publishedYear?: string;
  language?: string;
  isbn?: string;
  metadataSource?: 'epub' | 'pdf' | 'text' | 'public_api' | 'manual' | 'default';
  metadataFetchedAt?: number;
  fileName?: string;
  fileSize?: string;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  collectionIds?: string[];
  addedAt: number;
  lastReadAt?: number;
}

export interface BookCollection {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

export interface Quote {
  id: string;
  bookId: string;
  bookTitle: string;
  chapter: string;
  page?: number;
  emotion: string;
  text: string;
  comment?: string;
  createdAt: number;
}

export interface PageNote {
  id: string;
  bookId: string;
  page: number;
  lineText: string;
  note: string;
  createdAt: number;
  updatedAt?: number;
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

export type HighlightColor = 
  | 'pink' 
  | 'purple' 
  | 'gold' 
  | 'emerald' 
  | 'lila' 
  | 'gris' 
  | 'rosa-pastel' 
  | 'rojo';

export interface TextHighlight {
  id: string;
  bookId: string;
  page: number;
  text: string;
  color: HighlightColor;
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

export type ShelfDecorTheme = 'none' | 'kawaii' | 'dark' | 'fantasy';

export type ShelfBookendId =
  | 'none'
  | 'readers-silhouette'
  | 'fairy-wings'
  | 'crimson-hands'
  | 'gothic-raven-skull'
  | 'dark-rose-sword'
  | 'dark-dynamic';

export type ShelfDecorPropId =
  // Kawaii Cozy props
  | 'kawaii-cloud-lamp'
  | 'kawaii-tulips-vase'
  | 'kawaii-retro-radio'
  | 'kawaii-bunny-bear'
  | 'kawaii-quote-frame'
  | 'kawaii-moon-lamp'
  | 'kawaii-sunshine-cafe'
  // Fantasía Celestial props
  | 'fantasy-cat-lamp'
  | 'fantasy-lantern'
  | 'fantasy-cottage'
  | 'fantasy-ghost-frame'
  | 'fantasy-black-cat'
  | 'fantasy-moon-potion'
  | 'fantasy-arch-nook'
  | 'fantasy-reading-knight'
  | 'fantasy-reading-dragon'
  // Dark Romance & Gótico props
  | 'dark-masquerade-mask'
  | 'dark-crimson-roses'
  | 'dark-skull-coffin'
  | 'dark-crescent-moon'
  | 'dark-noir-frame'
  | 'dark-candles'
  | 'dark-skull-portal'
  | 'dark-dagger-roses'
  | 'dark-manor-nook';

export interface ShelfDecorConfig {
  theme: ShelfDecorTheme;
  enabledProps: ShelfDecorPropId[];
  bookend?: ShelfBookendId;
  ledGlow: boolean;
  hangingVines: boolean;
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

