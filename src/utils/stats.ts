import { ReadingStatsData, DailyReadingStat, ReadingSession } from '../types';

export const STATS_STORAGE_KEY = 'nl_reading_stats';

// Helper to format Date as YYYY-MM-DD in local time
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate realistic default history for the past 14 days
export function generateDefaultStats(): ReadingStatsData {
  const records: Record<string, { minutes: number; pages: number; bookIds: string[] }> = {};
  const sessions: ReadingSession[] = [];
  const now = new Date();

  // Preset reading numbers for past 14 days
  const sampleData = [
    { daysAgo: 13, mins: 25, pages: 12, title: 'El Gato Negro & Las Sombras Kawaii' },
    { daysAgo: 12, mins: 40, pages: 18, title: 'Carmilla (Edición Rosa Oscura)' },
    { daysAgo: 11, mins: 15, pages: 8, title: 'Alicia en el Laberinto de Sombras' },
    { daysAgo: 10, mins: 35, pages: 16, title: 'El Gato Negro & Las Sombras Kawaii' },
    { daysAgo: 9, mins: 50, pages: 24, title: 'Carmilla (Edición Rosa Oscura)' },
    { daysAgo: 8, mins: 20, pages: 9, title: 'Poemas de la Noche & Cuervos Dulces' },
    { daysAgo: 7, mins: 45, pages: 22, title: 'El Gato Negro & Las Sombras Kawaii' },
    { daysAgo: 6, mins: 30, pages: 14, title: 'Carmilla (Edición Rosa Oscura)' },
    { daysAgo: 5, mins: 60, pages: 28, title: 'Carmilla (Edición Rosa Oscura)' },
    { daysAgo: 4, mins: 25, pages: 11, title: 'Alicia en el Laberinto de Sombras' },
    { daysAgo: 3, mins: 40, pages: 19, title: 'El Gato Negro & Las Sombras Kawaii' },
    { daysAgo: 2, mins: 55, pages: 26, title: 'Poemas de la Noche & Cuervos Dulces' },
    { daysAgo: 1, mins: 45, pages: 20, title: 'Carmilla (Edición Rosa Oscura)' },
    { daysAgo: 0, mins: 30, pages: 15, title: 'El Gato Negro & Las Sombras Kawaii' }
  ];

  sampleData.forEach((item, index) => {
    const d = new Date(now);
    d.setDate(d.getDate() - item.daysAgo);
    const key = formatDateKey(d);

    records[key] = {
      minutes: item.mins,
      pages: item.pages,
      bookIds: ['demo-neko-1']
    };

    sessions.push({
      id: `sess-${index}-${Date.now()}`,
      bookId: 'demo-neko-1',
      bookTitle: item.title,
      minutes: item.mins,
      pagesRead: item.pages,
      timestamp: d.getTime()
    });
  });

  return {
    dailyRecords: records,
    sessions,
    currentStreak: 14,
    longestStreak: 14,
    lastActiveDate: formatDateKey(now)
  };
}

export function loadReadingStats(): ReadingStatsData {
  try {
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('Could not load reading stats from localStorage:', err);
  }
  const defaultData = generateDefaultStats();
  saveReadingStats(defaultData);
  return defaultData;
}

export function saveReadingStats(stats: ReadingStatsData) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Could not save reading stats:', err);
  }
}

// Log a reading session into stats
export function logReadingSession(
  bookId: string,
  bookTitle: string,
  minutes: number,
  pagesRead: number
): ReadingStatsData {
  const stats = loadReadingStats();
  const today = formatDateKey(new Date());

  if (!stats.dailyRecords[today]) {
    stats.dailyRecords[today] = { minutes: 0, pages: 0, bookIds: [] };
  }

  stats.dailyRecords[today].minutes += Math.max(1, Math.round(minutes));
  stats.dailyRecords[today].pages += Math.max(0, pagesRead);
  if (!stats.dailyRecords[today].bookIds.includes(bookId)) {
    stats.dailyRecords[today].bookIds.push(bookId);
  }

  stats.sessions.unshift({
    id: `sess-${Date.now()}`,
    bookId,
    bookTitle,
    minutes: Math.max(1, Math.round(minutes)),
    pagesRead: Math.max(0, pagesRead),
    timestamp: Date.now()
  });

  // Keep last 40 sessions
  if (stats.sessions.length > 40) {
    stats.sessions = stats.sessions.slice(0, 40);
  }

  // Update streak
  calculateStreaks(stats);

  saveReadingStats(stats);
  return stats;
}

function calculateStreaks(stats: ReadingStatsData) {
  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);

  // Check today first; if no reading today yet, check yesterday
  const todayKey = formatDateKey(checkDate);
  if (!stats.dailyRecords[todayKey] || stats.dailyRecords[todayKey].minutes === 0) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = formatDateKey(checkDate);
    const rec = stats.dailyRecords[key];
    if (rec && rec.minutes > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  stats.currentStreak = streak;
  if (streak > stats.longestStreak) {
    stats.longestStreak = streak;
  }
  stats.lastActiveDate = formatDateKey(today);
}

// Get array of chart data points for the last N days
export function getChartDataForDays(
  stats: ReadingStatsData,
  numDays: number
): DailyReadingStat[] {
  const result: DailyReadingStat[] = [];
  const now = new Date();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    const rec = stats.dailyRecords[key] || { minutes: 0, pages: 0, bookIds: [] };

    result.push({
      date: key,
      dayLabel: dayNames[d.getDay()],
      formattedDate: `${d.getDate()} ${monthNames[d.getMonth()]}`,
      minutes: rec.minutes,
      pages: rec.pages,
      booksCount: rec.bookIds.length
    });
  }

  return result;
}

// Format minutes into "X h Y min"
export function formatMinutes(totalMins: number): string {
  if (totalMins < 60) {
    return `${totalMins} min`;
  }
  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  if (remainingMins === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remainingMins} min`;
}

// Check if user has any recorded reading history
export function hasReadingStats(stats: ReadingStatsData): boolean {
  if (!stats) return false;
  const hasSessions = Array.isArray(stats.sessions) && stats.sessions.length > 0;
  const hasRecords = stats.dailyRecords && Object.keys(stats.dailyRecords).length > 0;
  return hasSessions || hasRecords;
}

// Reset stats to zero / clean state
export function resetReadingStatsToZero(): ReadingStatsData {
  const emptyStats: ReadingStatsData = {
    dailyRecords: {},
    sessions: [],
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: formatDateKey(new Date())
  };
  saveReadingStats(emptyStats);
  return emptyStats;
}

