import React, { useState } from 'react';
import { 
  Search, 
  Copy, 
  Trash2, 
  Check, 
  Feather, 
  Download, 
  Plus, 
  Heart, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Quote } from '../types';

interface QuotesVaultProps {
  quotes: Quote[];
  onOpenAddQuote: () => void;
  onDeleteQuote: (id: string) => void;
}

export const QuotesVault: React.FC<QuotesVaultProps> = ({
  quotes,
  onOpenAddQuote,
  onDeleteQuote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const emotions = [
    'all',
    '🖤 Dark Reborn',
    '🍓 Vainilla Fresa',
    '💖 Favorito',
    '🦇 Oscuro',
    '🥀 Melancolía'
  ];

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.comment && q.comment.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedEmotion === 'all') return true;
    return q.emotion === selectedEmotion;
  });

  const handleCopy = (quote: Quote) => {
    const textToCopy = `"${quote.text}" — ${quote.bookTitle} (${quote.chapter})`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId(null), 2200);
    });
  };

  const handleExportMarkdown = () => {
    if (quotes.length === 0) return;
    const lines = [
      '# 🐾 NekoLover Read — Baúl de Citas Literarias',
      `*Exportado el ${new Date().toLocaleDateString('es-ES')}*\n`,
      ...quotes.map(
        (q, idx) =>
          `### ${idx + 1}. ${q.bookTitle} (${q.chapter})\n> "${q.text}"\n\n**Emoción:** ${q.emotion}\n${
            q.comment ? `**Reflexión:** ${q.comment}\n` : ''
          }\n---`
      )
    ];

    const blob = new Blob([lines.join('\n\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NekoLover_Citas_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto w-full flex-1 flex flex-col">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-[var(--card-bg)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] shadow-xl">
        <div>
          <h2 className="dark-reborn-title text-xl sm:text-2xl font-bold text-[var(--accent-pink)] flex items-center gap-2">
            <span>💬</span> Citas & Notas Dark Reborn
          </h2>
          <p className="text-xs text-[var(--accent-purple)]">
            Tus fragmentos literarios, pasajes y reflexiones poéticas guardadas con estilo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Add Quote Button */}
          <button
            onClick={onOpenAddQuote}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--accent-pink)] text-black hover:opacity-90 transition flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Cita</span>
          </button>

          {/* Export Markdown */}
          <button
            onClick={handleExportMarkdown}
            disabled={quotes.length === 0}
            className="px-3 py-2 bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-[var(--text-main)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
            title="Descargar citas en formato Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
            <span className="hidden sm:inline">Exportar (.md)</span>
          </button>
        </div>
      </div>

      {/* Search & Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {emotions.map((emo) => (
            <button
              key={emo}
              onClick={() => setSelectedEmotion(emo)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 ${
                selectedEmotion === emo
                  ? 'bg-[var(--accent-pink)] text-black shadow-md'
                  : 'bg-black/40 text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
              }`}
            >
              {emo === 'all' ? '✦ Todas' : emo}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por libro, cita o nota..."
            className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-pink)]"
          />
        </div>
      </div>

      {/* Quotes Cards Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center bg-[var(--card-bg)]/40 border border-[var(--border-color)] rounded-3xl p-6">
          <p className="text-4xl mb-2">💬🖤</p>
          <h4 className="font-cute text-sm text-[var(--accent-pink)] font-bold">
            No hay citas registradas en este filtro
          </h4>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1 mb-4">
            Subraya texto mientras lees un libro o agrega una cita manualmente para coleccionar tus líneas favoritas.
          </p>
          <button
            onClick={onOpenAddQuote}
            className="px-4 py-2 bg-[var(--accent-pink)] text-black rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition"
          >
            Añadir Primera Cita ✍️
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotes.map((q) => {
            const isJustCopied = copiedId === q.id;
            return (
              <div
                key={q.id}
                className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-[var(--accent-pink)] transition group"
              >
                <div>
                  {/* Card Header: Book title & Emotion pill */}
                  <div className="flex items-center justify-between text-xs text-[var(--accent-pink)] mb-2.5">
                    <span className="dark-reborn-font font-bold truncate max-w-[180px] flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--accent-purple)] shrink-0" />
                      <span className="truncate">{q.bookTitle}</span>
                    </span>
                    <span className="bg-black/50 px-2 py-0.5 rounded-full text-[10px] text-[var(--accent-purple)] border border-[var(--border-color)] font-cute shrink-0">
                      {q.emotion}
                    </span>
                  </div>

                  {/* Quote Body */}
                  <div className="bg-black/50 p-3.5 rounded-xl border-l-2 border-[var(--accent-pink)] mb-2.5 text-xs italic text-white/90 leading-relaxed font-lora">
                    "{q.text}"
                  </div>

                  {/* Personal Comment */}
                  {q.comment && (
                    <div className="bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/20 p-2.5 rounded-xl mb-1">
                      <p className="text-[11px] text-[var(--accent-pink)] font-cute flex items-start gap-1">
                        <span>💭</span>
                        <span className="italic">{q.comment}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer: Chapter reference & Action buttons */}
                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)]">
                  <span className="font-mono">{q.chapter}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleCopy(q)}
                      className={`p-1.5 rounded-lg border transition ${
                        isJustCopied
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-black/40 border-[var(--border-color)] hover:text-[var(--accent-pink)] hover:border-[var(--accent-pink)]'
                      }`}
                      title="Copiar cita formateada al portapapeles"
                    >
                      {isJustCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDeleteQuote(q.id)}
                      className="p-1.5 bg-black/40 border border-[var(--border-color)] text-red-400/80 hover:text-red-400 hover:border-red-400/50 rounded-lg transition"
                      title="Eliminar cita"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
