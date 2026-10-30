import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  BookOpen, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Award, 
  BarChart3, 
  Sparkles, 
  Plus, 
  RotateCcw,
  BookMarked,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X,
  ArrowRight
} from 'lucide-react';
import { ReadingAreaChart, ReadingBarChart } from './CustomReadingCharts';
import { ReadingStatsData, Book } from '../types';
import { 
  getChartDataForDays, 
  formatMinutes, 
  generateDefaultStats, 
  saveReadingStats,
  logReadingSession,
  resetReadingStatsToZero 
} from '../utils/stats';

interface StatsPanelProps {
  stats: ReadingStatsData;
  books: Book[];
  onUpdateStats: (newStats: ReadingStatsData) => void;
  onNavigateToLibrary: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  books,
  onUpdateStats,
  onNavigateToLibrary
}) => {
  const [timeframe, setTimeframe] = useState<7 | 14 | 30>(14);
  const [activeChartTab, setActiveChartTab] = useState<'both' | 'time' | 'pages'>('both');
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showSampleModal, setShowSampleModal] = useState<boolean>(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Chart data for selected timeframe
  const chartData = useMemo(() => {
    return getChartDataForDays(stats, timeframe);
  }, [stats, timeframe]);

  // Aggregate metrics
  const totalMinutes = useMemo(() => {
    return Object.values(stats.dailyRecords || {}).reduce((acc, curr) => acc + (curr?.minutes || 0), 0);
  }, [stats]);

  const totalPages = useMemo(() => {
    return Object.values(stats.dailyRecords || {}).reduce((acc, curr) => acc + (curr?.pages || 0), 0);
  }, [stats]);

  const timeframeMinutes = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.minutes, 0);
  }, [chartData]);

  const timeframePages = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.pages, 0);
  }, [chartData]);

  const dailyAverageMinutes = Math.round(timeframeMinutes / timeframe);
  const dailyAveragePages = Math.round((timeframePages / timeframe) * 10) / 10;

  const completedBooksCount = books.filter((b) => b.category === 'completed').length;
  const readingBooksCount = books.filter((b) => b.category === 'reading').length;
  const hasHistory = (stats.sessions && stats.sessions.length > 0) || totalMinutes > 0;

  // Add a quick sample session
  const handleAddQuickSession = (mins: number, pgs: number) => {
    const targetBook = books[0] || { id: 'demo-neko-1', title: 'El Gato Negro' };
    const updated = logReadingSession(targetBook.id, targetBook.title, mins, pgs);
    onUpdateStats({ ...updated });
    setResetNotice(`Sesión registrada: +${mins} min y +${pgs} págs 📖`);
    setTimeout(() => setResetNotice(null), 3500);
  };

  // Reset all stats completely to zero (in-app modal confirmed)
  const handleConfirmResetStatsToZero = () => {
    const fresh = resetReadingStatsToZero();
    onUpdateStats(fresh);
    setShowResetModal(false);
    setResetNotice('✨ Todas las estadísticas se han borrado a cero. Se iniciarán automáticamente con tu primera lectura en la estantería.');
    setTimeout(() => setResetNotice(null), 6000);
  };

  // Reset to default sample history (in-app modal confirmed)
  const handleConfirmResetStatsDefault = () => {
    const def = generateDefaultStats();
    saveReadingStats(def);
    onUpdateStats(def);
    setShowSampleModal(false);
    setResetNotice('Historial de muestra de 14 días restaurado correctamente.');
    setTimeout(() => setResetNotice(null), 3500);
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--card-bg)] p-4 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl relative overflow-hidden">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-pink)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="cat-ears-badge w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--accent-pink)] to-[var(--accent-purple)] flex items-center justify-center text-sm shadow-md">
              📊
            </span>
            <h2 className="dark-reborn-title text-xl sm:text-2xl font-bold text-[var(--accent-pink)]">
              Estadísticas de Lectura
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Registro de tiempo total de lectura, páginas leídas por día y racha de hábitos literarios
          </p>
        </div>

        {/* Timeframe Selector & Quick Action */}
        <div className="flex flex-wrap items-center gap-2 z-10">
          <div className="flex bg-black/50 p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => setTimeframe(7)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timeframe === 7
                  ? 'bg-[var(--accent-pink)] text-black shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setTimeframe(14)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timeframe === 14
                  ? 'bg-[var(--accent-pink)] text-black shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              14 Días
            </button>
            <button
              onClick={() => setTimeframe(30)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timeframe === 30
                  ? 'bg-[var(--accent-pink)] text-black shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              30 Días
            </button>
          </div>

          <button
            onClick={() => handleAddQuickSession(20, 10)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-purple)]/20 border border-[var(--accent-purple)]/40 text-[var(--accent-purple)] hover:bg-[var(--accent-purple)] hover:text-black transition flex items-center gap-1.5"
            title="Registrar una sesión de lectura rápida de 20 min"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+20 min</span>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/60 hover:text-white transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Reiniciar a cero todas las estadísticas y registros de lectura"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar a Cero</span>
          </button>
        </div>
      </div>

      {/* Reset notification toast/banner */}
      {resetNotice && (
        <div className="bg-gradient-to-r from-pink-950/60 via-purple-950/60 to-pink-950/60 border border-[var(--accent-pink)]/40 text-pink-200 px-4 py-3 rounded-2xl flex items-center justify-between text-xs animate-popIn shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-pink)] shrink-0" />
            <span className="font-medium">{resetNotice}</span>
          </div>
          <button 
            onClick={() => setResetNotice(null)}
            className="text-pink-300 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Clean Install / Zero State Banner */}
      {!hasHistory && (
        <div className="bg-gradient-to-br from-[var(--card-bg)] via-black/60 to-[var(--card-bg)] border border-[var(--accent-pink)]/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--accent-pink)] to-[var(--accent-purple)] text-black flex items-center justify-center text-2xl shadow-lg shrink-0">
                ✨
              </div>
              <div>
                <h3 className="dark-reborn-font font-bold text-base text-[var(--accent-pink)]">
                  Estadísticas en Cero · Modo Instalación Limpia
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
                  Tus datos han sido reiniciados a cero. Tan pronto abras cualquier tomo de tu estantería y leas tus primeras páginas, se inaugurará tu registro diario, tiempo y racha literaria.
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToLibrary}
              className="px-4 py-2.5 rounded-xl bg-[var(--accent-pink)] text-black font-cute font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition flex items-center gap-2 shrink-0"
            >
              <span>Abrir Mi Estantería</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Reading Time */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-[var(--accent-pink)] transition group">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-cute">Tiempo Total</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-pink)]/15 border border-[var(--accent-pink)]/30 flex items-center justify-center text-[var(--accent-pink)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="dark-reborn-font text-xl sm:text-2xl font-bold text-white group-hover:text-[var(--accent-pink)] transition">
              {formatMinutes(totalMinutes)}
            </div>
            <p className="text-[11px] text-[var(--accent-purple)] mt-1 flex items-center gap-1">
              <span>Promedio:</span>
              <span className="font-mono font-bold">{dailyAverageMinutes} min/día</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Pages Read */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-[var(--accent-purple)] transition group">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-cute">Páginas Leídas</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-purple)]/15 border border-[var(--accent-purple)]/30 flex items-center justify-center text-[var(--accent-purple)]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="dark-reborn-font text-xl sm:text-2xl font-bold text-white group-hover:text-[var(--accent-purple)] transition">
              {totalPages} <span className="text-xs font-normal opacity-80">págs</span>
            </div>
            <p className="text-[11px] text-[var(--accent-pink)] mt-1 flex items-center gap-1">
              <span>Ritmo:</span>
              <span className="font-mono font-bold">{dailyAveragePages} págs/día</span>
            </p>
          </div>
        </div>

        {/* Card 3: Reading Streak */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-amber-400 transition group">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-cute">Racha de Lectura</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="dark-reborn-font text-xl sm:text-2xl font-bold text-amber-300 flex items-center gap-1.5">
              <span>{stats.currentStreak} días</span>
              <span className="text-base">🔥🐾</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Récord histórico: <strong className="text-white">{stats.longestStreak} días</strong>
            </p>
          </div>
        </div>

        {/* Card 4: Books Progress */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-emerald-400 transition group">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-cute">Progreso de Biblioteca</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="dark-reborn-font text-xl sm:text-2xl font-bold text-emerald-300">
              {completedBooksCount} <span className="text-xs font-normal text-[var(--text-muted)]">leídos</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              {readingBooksCount} en curso · {books.length} en estantería
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Reading Time (AreaChart) */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="dark-reborn-font text-sm sm:text-base font-bold text-[var(--accent-pink)] flex items-center gap-2">
                <span>⏱️</span> Tiempo de Lectura Diario
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Minutos invertidos por día en los últimos {timeframe} días
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--accent-pink)] bg-black/40 px-2.5 py-1 rounded-xl border border-[var(--border-color)]">
              Total: {formatMinutes(timeframeMinutes)}
            </span>
          </div>

          <div className="w-full pt-2">
            <ReadingAreaChart data={chartData} height={240} />
          </div>
        </div>

        {/* Chart 2: Pages Read per Day (BarChart) */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="dark-reborn-font text-sm sm:text-base font-bold text-[var(--accent-purple)] flex items-center gap-2">
                <span>📖</span> Páginas Leídas por Día
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Cantidad de páginas completadas cada jornada
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--accent-purple)] bg-black/40 px-2.5 py-1 rounded-xl border border-[var(--border-color)]">
              Total: {timeframePages} págs
            </span>
          </div>

          <div className="w-full pt-2">
            <ReadingBarChart data={chartData} height={240} />
          </div>
        </div>
      </div>

      {/* Recent Reading Sessions Log Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐾</span>
            <h3 className="dark-reborn-font font-bold text-sm sm:text-base text-[var(--accent-pink)]">
              Sesiones de Lectura Recientes
            </h3>
          </div>

          <button
            onClick={() => setShowSampleModal(true)}
            className="text-[11px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 transition"
            title="Restaurar historial de muestra de 14 días"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar muestra</span>
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {(!stats.sessions || stats.sessions.length === 0) ? (
            <div className="p-8 text-center bg-black/20 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
              <span className="text-3xl mb-2">🐾</span>
              <p className="font-cute font-bold text-sm text-[var(--accent-pink)]">
                Sin lecturas registradas aún
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                Las estadísticas están en cero. Abre cualquier libro de tu estantería y lee unas páginas: tu primera sesión se registrará aquí automáticamente.
              </p>
            </div>
          ) : (
            stats.sessions.slice(0, 10).map((sess) => {
              const dateStr = new Date(sess.timestamp).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={sess.id}
                  className="bg-black/35 border border-[var(--border-color)] hover:border-[var(--accent-pink)]/40 rounded-xl p-3 flex items-center justify-between gap-3 transition text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base">📖</span>
                    <div className="truncate">
                      <p className="font-bold text-white truncate max-w-xs sm:max-w-md">
                        {sess.bookTitle}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">{dateStr}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="bg-[var(--accent-purple)]/15 border border-[var(--accent-purple)]/30 text-[var(--accent-purple)] px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold">
                      {sess.pagesRead} págs
                    </span>
                    <span className="bg-[var(--accent-pink)]/15 border border-[var(--accent-pink)]/30 text-[var(--accent-pink)] px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold">
                      {sess.minutes} min
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL 1: In-App Confirmation to Reset Stats to Zero */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-red-500/40 rounded-3xl max-w-md w-full shadow-2xl p-6 animate-popIn">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="dark-reborn-font font-bold text-base sm:text-lg text-white">
                  ¿Reiniciar Estadísticas a Cero?
                </h3>
                <p className="text-xs text-red-300">
                  Borrado de datos e inicio limpio
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-main)] mb-3 leading-relaxed">
              Esta acción borrará <strong className="text-white">todos los minutos leídos, páginas acumuladas, rachas y sesiones previas</strong>.
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-6 bg-black/40 p-3 rounded-xl border border-white/5">
              ✨ <strong>Comportamiento como al instalar:</strong> Los datos quedarán en blanco y comenzarán a computarse automáticamente desde el <span className="text-[var(--accent-pink)]">Día 1</span> en cuanto abras un libro y comiences tu primera lectura.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-white bg-black/40 border border-[var(--border-color)] transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetStatsToZero}
                className="px-4 py-2 rounded-xl text-xs font-cute font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg active:scale-95 transition flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Borrar y Reiniciar a 0</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: In-App Confirmation to Restore Sample History */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--accent-purple)]/40 rounded-3xl max-w-md w-full shadow-2xl p-6 animate-popIn">
            <div className="flex items-center gap-3 text-[var(--accent-purple)] mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-purple)]/20 border border-[var(--accent-purple)]/40 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-[var(--accent-purple)]" />
              </div>
              <div>
                <h3 className="dark-reborn-font font-bold text-base sm:text-lg text-white">
                  Restaurar Muestra de 14 Días
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Carga datos de demostración
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-main)] mb-6 leading-relaxed">
              ¿Deseas restaurar las estadísticas con el historial de muestra de 14 días para visualizar gráficos y rachas completas?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-white bg-black/40 border border-[var(--border-color)] transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetStatsDefault}
                className="px-4 py-2 rounded-xl text-xs font-cute font-bold bg-[var(--accent-purple)] text-black shadow-lg hover:opacity-90 active:scale-95 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Restaurar Muestra</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
