import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Smile, 
  Feather, 
  Bookmark as BookmarkIcon, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  X,
  Trash2,
  RotateCw,
  Sparkles,
  Headphones,
  Highlighter,
  Copy,
  Check,
  Pin,
  Unlock,
  Lightbulb,
  Plus,
  Minus
} from 'lucide-react';
import { Book, PageSticker, TextHighlight, HighlightColor, ReaderModeId } from '../types';
import { KAWAII_STICKERS, FREE_CAT_STICKERS, READER_MODES } from '../data/defaultBooks';
import { getFileFromDB } from '../utils/db';
import { parseEpubFile } from '../utils/epubParser';
import { ReadingSettingsModal } from './ReadingSettingsModal';
import { MusicShelfModal } from './MusicShelfModal';
import { musicPlayer } from '../utils/musicManager';

interface PdfTextItem {
  str: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
}

const extractPdfText = (textContent: any): string => {
  if (!textContent || !textContent.items || textContent.items.length === 0) return '';
  const items = textContent.items as any[];

  let result = '';
  let lastY: number | null = null;
  let lastX = 0;
  let lastWidth = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const str = item.str || '';
    if (!str && !item.hasEOL) continue;

    const transform = item.transform || [];
    const currentY = transform[5] !== undefined ? Math.round(transform[5]) : null;
    const currentX = transform[4] !== undefined ? transform[4] : 0;

    if (lastY !== null && currentY !== null) {
      const yDiff = Math.abs(currentY - lastY);
      if (yDiff > 6) {
        if (yDiff > 16) {
          result += '\n\n';
        } else {
          result += '\n';
        }
      } else {
        const xGap = currentX - (lastX + lastWidth);
        if (xGap > 3 && !result.endsWith(' ') && !str.startsWith(' ')) {
          result += ' ';
        }
      }
    }

    result += str;
    lastY = currentY;
    lastX = currentX;
    lastWidth = item.width || 0;
  }

  return result.trim();
};

interface ReaderProps {
  book: Book;
  onBackToLibrary: () => void;
  onOpenFontModal?: () => void;
  onOpenThemeModal?: () => void;
  onOpenAddQuote: (selectedText?: string) => void;
  onToggleBookmark: (page: number) => void;
  isBookmarked: boolean;
  stickers: Record<string, PageSticker[]>;
  onSaveStickers: (pageKey: string, stickers: PageSticker[]) => void;
  highlights: Record<string, TextHighlight[]>;
  onSaveHighlights: (pageKey: string, highlights: TextHighlight[]) => void;
  onUpdateBookProgress: (bookId: string, currentPage: number, totalPages: number) => void;
  currentFont: string;
  onSelectFont?: (font: string) => void;
  onOpenAudioModal: () => void;
  onOpenMusicShelf?: () => void;
  onRecordReadingSession?: (minutes: number, pagesRead: number) => void;
  readerMode?: ReaderModeId;
  onSelectReaderMode?: (mode: ReaderModeId) => void;
  containerWidth?: 'normal' | 'wide' | 'narrow';
  onSelectContainerWidth?: (w: 'normal' | 'wide' | 'narrow') => void;
  lineHeight?: number;
  onSelectLineHeight?: (lh: number) => void;
  fontSize?: number;
  onSelectFontSize?: (fs: number) => void;
  isVip?: boolean;
  onOpenVipModal?: (reason?: 'music' | 'fonts' | 'shelf_bg' | 'stickers' | 'highlights' | 'notes') => void;
  quotesCount?: number;
}

export const Reader: React.FC<ReaderProps> = ({
  book,
  onBackToLibrary,
  onOpenFontModal,
  onOpenThemeModal,
  onOpenAddQuote,
  onToggleBookmark,
  isBookmarked,
  stickers,
  onSaveStickers,
  highlights,
  onSaveHighlights,
  onUpdateBookProgress,
  currentFont,
  onSelectFont,
  onOpenAudioModal,
  onOpenMusicShelf,
  onRecordReadingSession,
  readerMode: propReaderMode,
  onSelectReaderMode,
  containerWidth: propContainerWidth,
  onSelectContainerWidth,
  lineHeight: propLineHeight,
  onSelectLineHeight,
  fontSize: propFontSize,
  onSelectFontSize,
  isVip,
  onOpenVipModal,
  quotesCount
}) => {
  const [currentPage, setCurrentPage] = useState<number>(book.currentPage || 1);
  const [totalPages, setTotalPages] = useState<number>(book.totalPages || 1);

  // Modals for Unified Kawaii Reading Settings & Music Shelf
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(() => musicPlayer.isPlaying);

  useEffect(() => {
    const unsub = musicPlayer.subscribe(() => {
      setIsMusicPlaying(musicPlayer.isPlaying);
    });
    return () => unsub();
  }, []);

  // Synchronized font size
  const [internalFontSize, setInternalFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('nl_font_size');
    return saved ? Number(saved) : 18;
  });
  const fontSize = propFontSize ?? internalFontSize;
  const setFontSize = (sizeOrUpdater: any) => {
    const next = typeof sizeOrUpdater === 'function' ? sizeOrUpdater(fontSize) : sizeOrUpdater;
    setInternalFontSize(next);
    onSelectFontSize?.(next);
    localStorage.setItem('nl_font_size', String(next));
  };

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [epubPages, setEpubPages] = useState<string[]>(book.content || []);

  const sessionStartRef = useRef<number>(Date.now());
  const pagesVisitedRef = useRef<Set<number>>(new Set([book.currentPage || 1]));
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState<boolean>(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [defaultStickerScale, setDefaultStickerScale] = useState<number>(() => {
    const saved = localStorage.getItem('nl_default_sticker_scale');
    return saved ? Number(saved) : 1.0;
  });
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // PDF Text Reflow (acomodar letras al ampliar) & Text Layer para selección y marcado directo
  const [pdfReflowMode, setPdfReflowMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('nl_pdf_reflow_mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [pdfPageText, setPdfPageText] = useState<string>('');
  const [pdfTextItems, setPdfTextItems] = useState<PdfTextItem[]>([]);
  const [pdfViewportDim, setPdfViewportDim] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Synchronized contrast reading mode
  const [internalReaderMode, setInternalReaderMode] = useState<ReaderModeId>(() => {
    return (localStorage.getItem('nl_reader_mode') as ReaderModeId) || 'dark-oled';
  });
  const readerMode = propReaderMode ?? internalReaderMode;
  const setReaderMode = (mode: ReaderModeId) => {
    setInternalReaderMode(mode);
    onSelectReaderMode?.(mode);
    localStorage.setItem('nl_reader_mode', mode);
  };

  // Synchronized line height
  const [internalLineHeight, setInternalLineHeight] = useState<number>(() => {
    const saved = localStorage.getItem('nl_line_height');
    return saved ? Number(saved) : 1.8;
  });
  const lineHeight = propLineHeight ?? internalLineHeight;
  const setLineHeight = (lh: number) => {
    setInternalLineHeight(lh);
    onSelectLineHeight?.(lh);
    localStorage.setItem('nl_line_height', String(lh));
  };

  // Synchronized container width / margins
  const [internalContainerWidth, setInternalContainerWidth] = useState<'normal' | 'wide' | 'narrow'>(() => {
    return (localStorage.getItem('nl_container_width') as any) || 'normal';
  });
  const containerWidth = propContainerWidth ?? internalContainerWidth;
  const setContainerWidth = (w: 'normal' | 'wide' | 'narrow') => {
    setInternalContainerWidth(w);
    onSelectContainerWidth?.(w);
    localStorage.setItem('nl_container_width', w);
  };

  // Floating text selection toolbar
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [toastHighlight, setToastHighlight] = useState<string | null>(null);
  const [isPdfQuoteInputOpen, setIsPdfQuoteInputOpen] = useState(false);
  const [pdfQuoteDraft, setPdfQuoteDraft] = useState('');

  // Real book page flip animation direction
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward' | null>(null);

  // Screen WakeLock illumination
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const epubContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const epubRenditionRef = useRef<any>(null);
  const epubBookRef = useRef<any>(null);

  const pageKey = `${book.id}-p${currentPage}`;
  const currentPageStickers = stickers[pageKey] || [];
  const currentPageHighlights = highlights[pageKey] || [];
  const currentReaderModeConfig = READER_MODES.find(m => m.id === readerMode) || READER_MODES[0];

  // Text selection handler
  const handleTextSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const text = sel.toString().trim();
      setSelectedText(text);
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPos({
          x: Math.max(12, Math.min(window.innerWidth - 240, rect.left + rect.width / 2 - 110)),
          y: Math.max(68, rect.top - 52)
        });
      } catch {
        setSelectionPos(null);
      }
    } else {
      setTimeout(() => {
        const active = window.getSelection();
        if (!active || active.toString().trim().length === 0) {
          setSelectionPos(null);
          setShowColorPicker(false);
        }
      }, 300);
    }
  };

  const handleAddHighlight = (color: HighlightColor) => {
    const isFreeColor = color === 'gold' || color === 'gris';
    if (!isFreeColor && !isVip) {
      onOpenVipModal?.('highlights');
      setToastHighlight('👑 Este color es exclusivo VIP ($2/mes). En el plan gratuito tienes amarillo y gris.');
      return;
    }
    if (!selectedText) return;
    const cleanText = selectedText.trim();
    if (!cleanText) return;

    const newHl: TextHighlight = {
      id: `hl-${Date.now()}`,
      bookId: book.id,
      page: currentPage,
      text: cleanText,
      color,
      createdAt: Date.now()
    };
    const nextList = [...(highlights[pageKey] || []), newHl];
    onSaveHighlights(pageKey, nextList);
    setSelectionPos(null);
    setShowColorPicker(false);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
    setToastHighlight('Frase subrayada directamente en el texto 🖍️');
    setTimeout(() => setToastHighlight(null), 2500);
  };

  const handleDeleteHighlight = (id: string) => {
    const nextList = (highlights[pageKey] || []).filter(h => h.id !== id);
    onSaveHighlights(pageKey, nextList);
  };

  // Subrayar citas y frases directamente en el cuerpo del texto
  const renderHighlightedContent = (rawText: string, pageHighlights: TextHighlight[]) => {
    if (!pageHighlights || pageHighlights.length === 0 || !rawText) {
      return rawText;
    }

    interface MatchRange {
      start: number;
      end: number;
      color: HighlightColor;
      id: string;
      text: string;
    }

    const matches: MatchRange[] = [];
    const lowerRaw = rawText.toLowerCase();

    pageHighlights.forEach((hl) => {
      if (!hl.text || hl.text.trim().length === 0) return;
      const cleanSearch = hl.text.trim();
      const lowerSearch = cleanSearch.toLowerCase();

      let idx = lowerRaw.indexOf(lowerSearch);
      while (idx !== -1) {
        matches.push({
          start: idx,
          end: idx + cleanSearch.length,
          color: hl.color,
          id: hl.id,
          text: rawText.slice(idx, idx + cleanSearch.length)
        });
        idx = lowerRaw.indexOf(lowerSearch, idx + 1);
      }
    });

    if (matches.length === 0) return rawText;

    // Ordenar de menor a mayor inicio
    matches.sort((a, b) => a.start - b.start);

    // Filtrar intervalos solapados
    const nonOverlapping: MatchRange[] = [];
    let currentEnd = 0;
    for (const m of matches) {
      if (m.start >= currentEnd) {
        nonOverlapping.push(m);
        currentEnd = m.end;
      }
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    const colorClasses: Record<HighlightColor, string> = {
      pink: 'bg-pink-500/40 border-b-2 border-pink-400 text-pink-100 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(255,105,180,0.4)] font-medium',
      purple: 'bg-purple-500/40 border-b-2 border-purple-400 text-purple-100 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(168,85,247,0.4)] font-medium',
      lila: 'bg-purple-300/40 border-b-2 border-purple-300 text-purple-100 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(216,180,254,0.4)] font-medium',
      gris: 'bg-slate-400/40 border-b-2 border-slate-300 text-slate-100 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(148,163,184,0.4)] font-medium',
      'rosa-pastel': 'bg-pink-300/40 border-b-2 border-pink-300 text-pink-50 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(244,114,182,0.4)] font-medium',
      rojo: 'bg-red-500/40 border-b-2 border-red-500 text-red-100 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.4)] font-medium',
      gold: 'bg-amber-500/40 border-b-2 border-amber-400 text-amber-100 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(245,158,11,0.4)] font-medium',
      emerald: 'bg-emerald-500/40 border-b-2 border-emerald-400 text-emerald-100 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.4)] font-medium'
    };

    nonOverlapping.forEach((range, i) => {
      if (range.start > lastIndex) {
        elements.push(rawText.slice(lastIndex, range.start));
      }
      elements.push(
        <mark
          key={`hl-${range.id}-${i}`}
          className={`${colorClasses[range.color] || colorClasses.pink} cursor-pointer transition-all inline mx-0.5 select-text hover:brightness-125`}
          title={`Frase subrayada en ${range.color}. Clic para guardar en Baúl de Citas.`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenAddQuote(range.text);
          }}
        >
          {rawText.slice(range.start, range.end)}
        </mark>
      );
      lastIndex = range.end;
    });

    if (lastIndex < rawText.length) {
      elements.push(rawText.slice(lastIndex));
    }

    return elements;
  };

  // Subrayar citas directamente en el HTML de páginas EPUB
  const highlightHtmlContent = (html: string, pageHighlights: TextHighlight[]) => {
    if (!pageHighlights || pageHighlights.length === 0 || !html) return html;
    let result = html;
    const colorStyles: Record<HighlightColor, string> = {
      pink: 'background-color: rgba(244, 63, 94, 0.4); border-bottom: 2px solid #f43f5e; color: inherit; padding: 1px 4px; border-radius: 4px; font-weight: 600;',
      purple: 'background-color: rgba(168, 85, 247, 0.4); border-bottom: 2px solid #a855f7; color: inherit; padding: 1px 4px; border-radius: 4px; font-weight: 600;',
      lila: 'background-color: rgba(192, 132, 252, 0.4); border-bottom: 2px solid #c084fc; color: inherit; padding: 1px 4px; border-radius: 4px; font-weight: 600;',
      gris: 'background-color: rgba(148, 163, 184, 0.4); border-bottom: 2px solid #94a3b8; color: inherit; padding: 1px 4px; border-radius: 4px; font-weight: 600;',
      'rosa-pastel': 'background-color: rgba(244, 114, 182, 0.4); border-bottom: 2px solid #f472b6; color: inherit; padding: 1px 4px; border-radius: 4px; font-weight: 600;',
      rojo: 'background-color: rgba(239, 68, 68, 0.4); border-bottom: 2px solid #ef4444; color: inherit; padding: 1px 4px; border-radius: 4px; font-weight: 600;',
      gold: 'background-color: rgba(245, 158, 11, 0.4); border-bottom: 2px solid #f59e0b; color: inherit; padding: 1px 4px; border-radius: 4px; font-weight: 600;',
      emerald: 'background-color: rgba(16, 185, 129, 0.4); border-bottom: 2px solid #10b981; color: inherit; padding: 1px 4px; border-radius: 4px; font-weight: 600;'
    };

    pageHighlights.forEach((hl) => {
      if (!hl.text || hl.text.trim().length === 0) return;
      const escaped = hl.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        const reg = new RegExp(`(?![^<]*>)(${escaped})`, 'gi');
        const style = colorStyles[hl.color] || colorStyles.pink;
        result = result.replace(reg, `<mark style="${style}" data-hl-id="${hl.id}">$1</mark>`);
      } catch {}
    });

    return result;
  };

  // Update progress to parent & reset scroll to top
  const handlePageChange = useCallback((newPage: number, total?: number) => {
    const finalTotal = total || totalPages;
    const clampedPage = Math.max(1, Math.min(newPage, finalTotal));
    setCurrentPage(clampedPage);
    pagesVisitedRef.current.add(clampedPage);
    onUpdateBookProgress(book.id, clampedPage, finalTotal);

    // Al pasar las páginas debe iniciar en la parte superior todo el tiempo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const viewport = document.getElementById('reader-viewport');
    if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
    const pageCard = document.getElementById('page-container');
    if (pageCard) pageCard.scrollTo({ top: 0, behavior: 'smooth' });
  }, [book.id, totalPages, onUpdateBookProgress]);

  // Track session reading time on mount/unmount
  useEffect(() => {
    sessionStartRef.current = Date.now();
    pagesVisitedRef.current = new Set([book.currentPage || 1]);

    return () => {
      const elapsedSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      if (elapsedSeconds >= 2 && onRecordReadingSession) {
        const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
        const pagesRead = Math.max(1, pagesVisitedRef.current.size);
        onRecordReadingSession(elapsedMinutes, pagesRead);
      }
    };
  }, [book.id, onRecordReadingSession]);

  // Load book based on type (demo, pdf, epub)
  useEffect(() => {
    let isCancelled = false;

    const loadContent = async () => {
      setFileError(null);

      if (book.type === 'demo' || book.type === 'text') {
        const pages = book.content?.length || 1;
        setTotalPages(pages);
        if (currentPage > pages) setCurrentPage(1);
        return;
      }

      setLoadingFile(true);
      try {
        const fileData = await getFileFromDB(book.id);
        if (!fileData) {
          throw new Error('No se encontró el archivo en el almacenamiento local.');
        }

        const arrayBuffer = fileData instanceof ArrayBuffer 
          ? fileData 
          : await (fileData as Blob).arrayBuffer();

        if (isCancelled) return;

        if (book.type === 'pdf') {
          let pdfjs = (window as any).pdfjsLib;
          if (!pdfjs) {
            for (let i = 0; i < 15; i++) {
              await new Promise((r) => setTimeout(r, 100));
              if (isCancelled) return;
              pdfjs = (window as any).pdfjsLib;
              if (pdfjs) break;
            }
          }
          if (!pdfjs) throw new Error('Librería PDF.js no disponible. Por favor recarga la página.');

          if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }

          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          if (isCancelled) return;
          pdfDocRef.current = pdf;
          setTotalPages(pdf.numPages);
          renderPdfPage(currentPage, pdf);
        } else if (book.type === 'epub') {
          if (book.content && book.content.length > 0) {
            setEpubPages(book.content);
            setTotalPages(book.content.length);
            return;
          }

          const parsed = await parseEpubFile(arrayBuffer);
          if (isCancelled) return;

          setEpubPages(parsed.pages);
          const totalPgs = Math.max(1, parsed.pages.length);
          setTotalPages(totalPgs);
          onUpdateBookProgress(book.id, currentPage, totalPgs);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error(err);
          setFileError(err.message || 'Error al abrir el libro.');
        }
      } finally {
        if (!isCancelled) setLoadingFile(false);
      }
    };

    loadContent();

    return () => {
      isCancelled = true;
      if (epubRenditionRef.current) {
        try { epubRenditionRef.current.destroy(); } catch {}
      }
    };
  }, [book.id, book.type]);

  // Render PDF page onto canvas with High-DPI HD Retina resolution & extract selectable text
  const renderPdfPage = async (pageNum: number, pdfInstance?: any) => {
    const pdf = pdfInstance || pdfDocRef.current;
    if (!pdf) return;

    try {
      const page = await pdf.getPage(pageNum);

      // 1. Extraer texto para modo lectura acomodada y citas directas
      const textContent = await page.getTextContent();
      const extracted = extractPdfText(textContent);
      setPdfPageText(extracted);

      // 2. Renderizar Canvas y capa de texto interactiva si el canvas está disponible
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const viewportWidth = containerRef.current?.clientWidth || 750;
          const unscaledViewport = page.getViewport({ scale: 1.0 });

          // Base scale fits viewport nicely with padding
          const fitScale = (viewportWidth - 52) / unscaledViewport.width;
          const baseScale = Math.max(0.65, fitScale);
          const finalScale = baseScale * zoomLevel;

          const pixelRatio = Math.max(window.devicePixelRatio || 1, 2.0);
          const viewport = page.getViewport({ scale: finalScale });

          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);

          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          const transform = pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null;

          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
            transform: transform
          };

          await page.render(renderContext).promise;

          setPdfViewportDim({
            width: Math.floor(viewport.width),
            height: Math.floor(viewport.height)
          });

          // Calcular items de texto exactos para selección directa sobre el PDF
          const items: any[] = textContent.items || [];
          const overlayItems: PdfTextItem[] = items.map((item: any) => {
            const tx = item.transform[4] || 0;
            const ty = item.transform[5] || 0;
            const [vx, vy] = viewport.convertToViewportPoint(tx, ty);
            const fontSizeVal = Math.hypot(item.transform[0] || 0, item.transform[1] || 0);
            const scaledWidth = (item.width || 0) * (viewport.width / unscaledViewport.width);
            const scaledHeight = (item.height || fontSizeVal) * (viewport.height / unscaledViewport.height);
            return {
              str: item.str,
              left: Math.round(vx),
              top: Math.round(vy - scaledHeight),
              width: Math.max(2, Math.ceil(scaledWidth)),
              height: Math.max(8, Math.ceil(scaledHeight)),
              fontSize: Math.max(8, Math.round(fontSizeVal * (viewport.height / unscaledViewport.height)))
            };
          }).filter(it => it.str && it.str.trim().length > 0);

          setPdfTextItems(overlayItems);
        }
      }
    } catch (err) {
      console.warn('PDF page rendering error:', err);
    }
  };

  // Re-render PDF if page or zoom or mode changes
  useEffect(() => {
    if (book.type === 'pdf' && pdfDocRef.current) {
      renderPdfPage(currentPage);
    }
  }, [currentPage, zoomLevel, book.type, pdfReflowMode]);

  // Update EPUB font when currentFont changes
  useEffect(() => {
    if (epubRenditionRef.current && currentFont) {
      epubRenditionRef.current.themes.font(currentFont);
    }
  }, [currentFont]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        changePage(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        changePage(-1);
      } else if (e.key === 'Escape') {
        if (isFullscreen) toggleFullscreen();
      } else if (e.key === '+' || e.key === '=') {
        if (book.type === 'pdf') {
          e.preventDefault();
          setZoomLevel((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))));
        }
      } else if (e.key === '-' || e.key === '_') {
        if (book.type === 'pdf') {
          e.preventDefault();
          setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
        }
      } else if (e.key === '0') {
        if (book.type === 'pdf') {
          e.preventDefault();
          setZoomLevel(1.0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const changePage = (delta: number) => {
    const next = currentPage + delta;
    if (next >= 1 && next <= totalPages) {
      setFlipDirection(delta > 0 ? 'forward' : 'backward');
      setTimeout(() => setFlipDirection(null), 360);
      handlePageChange(next);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Movable Stickers logic with stick / unstick (pegar y volver a mover)
  const handleAddSticker = (emoji: string, _stickerIndex?: number) => {
    // Restricción VIP: solo los stickers de gatitos son gratuitos, los demás requieren VIP
    const isCatSticker = FREE_CAT_STICKERS.includes(emoji);
    if (!isVip && !isCatSticker) {
      onOpenVipModal?.('stickers');
      setToastHighlight('👑 Este sticker es exclusivo para miembros VIP ($2/mes). ¡Los stickers de gatitos son gratis!');
      return;
    }

    const newSticker: PageSticker = {
      id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emoji,
      x: 60 + Math.random() * 80,
      y: 60 + Math.random() * 80,
      scale: defaultStickerScale || 1.0,
      rotation: (Math.random() - 0.5) * 20,
      isLocked: false // Starts unlocked so user can position it
    };

    const updated = [...currentPageStickers, newSticker];
    onSaveStickers(pageKey, updated);
    setSelectedStickerId(newSticker.id);
    setToastHighlight('🖐️ Sticker colocado. Puedes cambiar su tamaño con los botones o la esquina.');
  };

  const handleToggleLockSticker = (stkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = currentPageStickers.map((s) => {
      if (s.id === stkId) {
        const next = !s.isLocked;
        setToastHighlight(next ? '📌 Sticker pegado fijo' : '🔓 Sticker desbloqueado para mover');
        return { ...s, isLocked: next };
      }
      return s;
    });
    onSaveStickers(pageKey, updated);
  };

  const handleDeleteSticker = (stkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = currentPageStickers.filter((s) => s.id !== stkId);
    onSaveStickers(pageKey, updated);
    if (selectedStickerId === stkId) setSelectedStickerId(null);
  };

  const handleRotateSticker = (stkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = currentPageStickers.map((s) => {
      if (s.id === stkId) {
        return { ...s, rotation: ((s.rotation || 0) + 15) % 360 };
      }
      return s;
    });
    onSaveStickers(pageKey, updated);
  };

  // Sticker size controls (hacer pequeño o grande)
  const handleResizeSticker = (stkId: string, delta: number, e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const updated = currentPageStickers.map((s) => {
      if (s.id === stkId) {
        const currentScale = s.scale ?? 1.0;
        const nextScale = Math.max(0.4, Math.min(3.5, Number((currentScale + delta).toFixed(2))));
        setToastHighlight(`Tamaño: ${Math.round(nextScale * 100)}% 📏`);
        return { ...s, scale: nextScale };
      }
      return s;
    });
    onSaveStickers(pageKey, updated);
  };

  const handleSetStickerScale = (stkId: string, scale: number, e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const updated = currentPageStickers.map((s) => {
      if (s.id === stkId) {
        setToastHighlight(`Tamaño: ${Math.round(scale * 100)}% 📏`);
        return { ...s, scale };
      }
      return s;
    });
    onSaveStickers(pageKey, updated);
  };

  // Dragging logic for stickers
  const activeDragRef = useRef<{
    stickerId: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  // Resizing logic via corner drag handle
  const activeResizeRef = useRef<{
    stickerId: string;
    startX: number;
    startY: number;
    initScale: number;
  } | null>(null);

  const startDrag = (
    stickerId: string,
    clientX: number,
    clientY: number
  ) => {
    const current = currentPageStickers.find((s) => s.id === stickerId);
    if (!current) return;
    setSelectedStickerId(stickerId);
    activeDragRef.current = {
      stickerId,
      startX: clientX,
      startY: clientY,
      initX: current.x,
      initY: current.y
    };
  };

  const onPointerDownSticker = (stickerId: string, e: React.PointerEvent) => {
    // Si se hizo click en los controles internos (toolbar o handle), no iniciar drag del cuerpo
    if ((e.target as HTMLElement).closest('.sticker-toolbar') || (e.target as HTMLElement).closest('.sticker-resize-handle')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const current = currentPageStickers.find((s) => s.id === stickerId);
    if (!current) return;

    // Si estaba pegado fijo, tocarlo lo desbloquea para poder moverlo
    if (current.isLocked) {
      const updated = currentPageStickers.map((s) => s.id === stickerId ? { ...s, isLocked: false } : s);
      onSaveStickers(pageKey, updated);
      setSelectedStickerId(stickerId);
      setToastHighlight('🔓 Sticker desbloqueado: Muévelo o cambia su tamaño.');
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startDrag(stickerId, e.clientX, e.clientY);
  };

  const onPointerDownResizeHandle = (stickerId: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = currentPageStickers.find((s) => s.id === stickerId);
    if (!current) return;
    setSelectedStickerId(stickerId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activeResizeRef.current = {
      stickerId,
      startX: e.clientX,
      startY: e.clientY,
      initScale: current.scale ?? 1.0
    };
  };

  const onPointerMoveContainer = (e: React.PointerEvent) => {
    // 1. Redimensionado mediante arrastre de esquina
    if (activeResizeRef.current) {
      const { stickerId, startX, startY, initScale } = activeResizeRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // Arrastrar hacia afuera agranda, hacia adentro reduce
      const deltaScale = (dx + dy) / 120;
      const nextScale = Math.max(0.4, Math.min(3.5, Number((initScale + deltaScale).toFixed(2))));

      const nextStickers = currentPageStickers.map((s) => {
        if (s.id === stickerId) {
          return { ...s, scale: nextScale };
        }
        return s;
      });
      onSaveStickers(pageKey, nextStickers);
      return;
    }

    // 2. Movimiento de posición del sticker
    if (!activeDragRef.current) return;
    const { stickerId, startX, startY, initX, initY } = activeDragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const nextStickers = currentPageStickers.map((s) => {
      if (s.id === stickerId) {
        return {
          ...s,
          x: Math.max(0, initX + dx),
          y: Math.max(0, initY + dy)
        };
      }
      return s;
    });
    onSaveStickers(pageKey, nextStickers);
  };

  const onPointerUpContainer = (e: React.PointerEvent) => {
    // Finalizar redimensionado
    if (activeResizeRef.current) {
      const resizedId = activeResizeRef.current.stickerId;
      activeResizeRef.current = null;
      const cur = currentPageStickers.find((s) => s.id === resizedId);
      if (cur) {
        setToastHighlight(`Tamaño fijado: ${Math.round((cur.scale ?? 1) * 100)}% 📏`);
      }
      return;
    }

    // Finalizar arrastre de posición
    if (activeDragRef.current) {
      const draggedId = activeDragRef.current.stickerId;
      activeDragRef.current = null;
      // Queda pegado fijo al soltarlo ("se podrán quedar pegado")
      const updated = currentPageStickers.map((s) => {
        if (s.id === draggedId) {
          return { ...s, isLocked: true };
        }
        return s;
      });
      onSaveStickers(pageKey, updated);
      setToastHighlight('📌 Sticker pegado fijo. Toca para volver a mover o redimensionar.');
    }
  };

  // Screen WakeLock illumination permission
  useEffect(() => {
    let active = true;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (active) {
            wakeLockRef.current = lock;
            setIsWakeLockActive(true);
            lock.addEventListener('release', () => {
              if (active) setIsWakeLockActive(false);
            });
          }
        }
      } catch (err) {
        console.warn('WakeLock not granted or supported:', err);
      }
    };
    requestWakeLock();

    return () => {
      active = false;
      if (wakeLockRef.current) {
        try { wakeLockRef.current.release(); } catch {}
        wakeLockRef.current = null;
      }
    };
  }, []);

  const toggleWakeLock = async () => {
    try {
      if (isWakeLockActive && wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
        setToastHighlight('🌙 Iluminación fija desactivada');
      } else if ('wakeLock' in navigator) {
        const lock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = lock;
        setIsWakeLockActive(true);
        setToastHighlight('💡 Iluminación fija activa: Pantalla encendida');
      }
    } catch {
      setToastHighlight('Iluminación fija no disponible en este navegador');
    }
  };

  // Get selected text for quoting
  const handleCaptureSelection = () => {
    if (!isVip && quotesCount !== undefined && quotesCount >= 3) {
      onOpenVipModal?.('notes');
      setToastHighlight('👑 Límite de 3 notas alcanzado. Pásate a VIP ($2/mes) para notas y citas infinitas.');
      return;
    }
    const sel = window.getSelection()?.toString().trim();
    onOpenAddQuote(sel || undefined);
  };

  return (
    <div 
      className="flex-1 flex flex-col h-[calc(100vh-62px)] bg-black/95 relative overflow-hidden select-none"
      onPointerMove={onPointerMoveContainer}
      onPointerUp={onPointerUpContainer}
    >
      {/* Top Reader Navbar */}
      <div className="bg-[var(--card-bg)] border-b border-[var(--border-color)] px-3 sm:px-6 py-2 flex items-center justify-between z-30 shadow-lg">
        {/* Left: Back button & Title */}
        <div className="flex items-center space-x-2.5 truncate pr-2">
          <button
            onClick={onBackToLibrary}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-cute font-bold bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-[var(--accent-pink)]/60 text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black transition flex items-center gap-1.5 shadow-md active:scale-95 group shrink-0"
            title="Regresar a la Estantería (Esc)"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5] transform group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Estantería</span>
          </button>
          <div className="truncate">
            <span className="dark-reborn-font font-bold text-xs sm:text-sm text-[var(--accent-pink)] truncate block max-w-[140px] sm:max-w-xs md:max-w-md">
              {book.title}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] truncate block">
              {book.author}
            </span>
          </div>
        </div>

        {/* Right: Tools & Actions */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {/* Unico Icono Kawaii de Configuración de Lectura */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-cute font-bold bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/10 border border-[var(--accent-pink)] text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black transition flex items-center gap-1.5 shadow-md active:scale-95"
            title="Ajustes Kawaii de Lectura: Fuente, tamaño, márgenes, contraste, iluminación y modo PDF"
          >
            <span className="text-sm">🌸</span>
            <span className="hidden sm:inline">Ajustes</span>
          </button>

          {/* Estantería de Música (Función VIP) */}
          <button
            type="button"
            onClick={() => {
              if (!isVip) {
                onOpenVipModal?.('music');
                return;
              }
              if (onOpenMusicShelf) {
                onOpenMusicShelf();
              } else {
                setIsMusicModalOpen(true);
              }
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-cute font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 ${
              isMusicPlaying
                ? 'bg-[var(--accent-purple)] text-black border border-[var(--accent-purple)] shadow-[0_0_12px_rgba(189,147,249,0.5)] animate-pulse'
                : 'bg-black/40 border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent-purple)] hover:border-[var(--accent-purple)]'
            }`}
            title={isVip ? "Estantería de Música: Escuchar de fondo y subir canciones" : "Reproductor de Música: Exclusivo VIP ($2/mes) 👑"}
          >
            <span className="text-sm">{isMusicPlaying ? '🎶' : '🎵'}</span>
            <span className="hidden sm:inline">Música</span>
            {!isVip && <span className="text-[10px] text-amber-300 font-bold ml-0.5">👑</span>}
            {isMusicPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Sticker Drawer Button */}
          <button
            onClick={() => setIsStickerDrawerOpen(!isStickerDrawerOpen)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
              isStickerDrawerOpen
                ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
                : 'bg-[var(--accent-pink)]/20 border border-[var(--accent-pink)]/40 text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black'
            }`}
            title="Pegar stickers kawaii"
          >
            <span>🎀</span>
            <span className="hidden sm:inline">Stickers</span>
            {currentPageStickers.length > 0 && (
              <span className="text-[10px] ml-0.5 opacity-80">
                ({currentPageStickers.length})
              </span>
            )}
          </button>

          {/* Add Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(currentPage)}
            className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-xs transition border ${
              isBookmarked
                ? 'bg-[var(--accent-pink)] text-black border-[var(--accent-pink)]'
                : 'bg-black/40 border-[var(--border-color)] text-[var(--text-muted)] hover:text-white'
            }`}
            title={isBookmarked ? 'Página guardada en marcadores' : 'Guardar marcador en esta página'}
          >
            <BookmarkIcon className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Add Quote Button */}
          <button
            onClick={handleCaptureSelection}
            className="px-2.5 py-1.5 bg-purple-500/20 border border-purple-500/40 text-[var(--accent-purple)] rounded-xl text-xs font-semibold hover:bg-purple-500 hover:text-black transition flex items-center space-x-1"
            title="Guardar cita o nota literaria"
          >
            <Feather className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cita</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-black/40 border border-[var(--border-color)] hover:border-white/30 rounded-xl text-xs text-[var(--text-muted)] hover:text-white transition"
            title="Pantalla completa"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Movable Sticker Floating Palette Drawer */}
      {isStickerDrawerOpen && (
        <div className="sticker-drawer absolute top-14 right-2 sm:right-6 z-40 bg-[var(--card-bg)] border border-[var(--border-color)] p-3 rounded-2xl shadow-2xl w-72 sm:w-80 modal-animate backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🐾</span>
              <span className="font-cute text-xs text-[var(--accent-pink)] font-bold">
                Stickers Movibles
              </span>
            </div>
            <button
              onClick={() => setIsStickerDrawerOpen(false)}
              className="text-xs text-[var(--text-muted)] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de tamaño para nuevos stickers */}
          <div className="mb-2.5 bg-black/50 border border-white/10 p-2 rounded-xl flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-[var(--accent-pink)]">
              Tamaño:
            </span>
            <div className="flex items-center gap-1">
              {[
                { label: 'Pqño', scale: 0.65, title: 'Pequeño (65%)' },
                { label: 'Med', scale: 1.0, title: 'Mediano (100%)' },
                { label: 'Gde', scale: 1.6, title: 'Grande (160%)' },
                { label: 'XL', scale: 2.3, title: 'Extra Grande (230%)' }
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setDefaultStickerScale(preset.scale);
                    localStorage.setItem('nl_default_sticker_scale', String(preset.scale));
                    setToastHighlight(`Tamaño por defecto: ${preset.title} 📏`);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition active:scale-95 ${
                    Math.abs(defaultStickerScale - preset.scale) < 0.1
                      ? 'bg-[var(--accent-pink)] text-black shadow'
                      : 'bg-black/40 text-[var(--text-muted)] hover:text-white border border-white/5'
                  }`}
                  title={preset.title}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {!isVip && (
            <p className="text-[10px] text-amber-300 font-semibold mb-2 flex items-center justify-between bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20">
              <span>Gratis: Stickers de gatitos 😸</span>
              <button
                type="button"
                onClick={() => onOpenVipModal?.('stickers')}
                className="underline hover:text-white flex items-center gap-1"
              >
                <span>VIP: Todos los stickers</span>
                <span>👑</span>
              </button>
            </p>
          )}

          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-none">
            {KAWAII_STICKERS.map((emoji, idx) => {
              const isCat = FREE_CAT_STICKERS.includes(emoji);
              const isLocked = !isVip && !isCat;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (isLocked) {
                      onOpenVipModal?.('stickers');
                      return;
                    }
                    handleAddSticker(emoji, idx);
                  }}
                  className={`text-2xl p-1.5 rounded-xl transition transform hover:scale-125 flex items-center justify-center border relative active:scale-95 ${
                    isLocked
                      ? 'bg-black/50 border-amber-400/30 opacity-75 hover:border-amber-400'
                      : 'bg-black/40 hover:bg-white/15 border-transparent hover:border-[var(--accent-pink)]'
                  }`}
                  title={isLocked ? 'Sticker Exclusivo VIP ($2/mes) 👑 (Solo gatitos son gratis)' : 'Pegar sticker'}
                >
                  <span>{emoji}</span>
                  {isLocked && (
                    <span className="absolute -top-1 -right-1 text-[9px] leading-none">
                      👑
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {currentPageStickers.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-[var(--border-color)] flex justify-between items-center text-[10px]">
              <span className="text-[var(--text-muted)]">
                {currentPageStickers.length} sticker{currentPageStickers.length > 1 ? 's' : ''} en esta pág.
              </span>
              <button
                onClick={() => onSaveStickers(pageKey, [])}
                className="text-red-400 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Limpiar página
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Text Selection Menu */}
      {selectionPos && selectedText && (
        <div
          className="fixed z-50 bg-[var(--card-bg)] border border-[var(--accent-pink)] rounded-2xl p-1.5 shadow-2xl flex items-center gap-1 modal-animate backdrop-blur-md"
          style={{ left: `${selectionPos.x}px`, top: `${selectionPos.y}px` }}
        >
          {showColorPicker ? (
            <div className="flex items-center gap-1.5 px-1 py-0.5">
              {/* Gratis: Amarillo */}
              <button
                onClick={() => handleAddHighlight('gold')}
                className="w-5 h-5 rounded-full bg-amber-400 hover:scale-125 transition border border-white/40 shadow-sm"
                title="Amarillo / Dorado Sepia (Gratis)"
              />
              {/* Gratis: Gris */}
              <button
                onClick={() => handleAddHighlight('gris')}
                className="w-5 h-5 rounded-full bg-[#94a3b8] hover:scale-125 transition border border-white/40 shadow-sm"
                title="Gris Plata (Gratis)"
              />

              {/* Separador */}
              <div className="h-3.5 w-px bg-white/20 mx-0.5" />

              {/* VIP: Rosa Neón */}
              <button
                onClick={() => handleAddHighlight('pink')}
                className={`w-5 h-5 rounded-full bg-pink-400 hover:scale-125 transition border border-white/20 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Rosa Neón (👑 Exclusivo VIP $2/mes)' : 'Rosa Neón'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Rosa Pastel */}
              <button
                onClick={() => handleAddHighlight('rosa-pastel')}
                className={`w-5 h-5 rounded-full bg-[#fbcfe8] hover:scale-125 transition border border-pink-300 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Rosa Pastel (👑 Exclusivo VIP $2/mes)' : 'Rosa Pastel'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Púrpura */}
              <button
                onClick={() => handleAddHighlight('purple')}
                className={`w-5 h-5 rounded-full bg-purple-400 hover:scale-125 transition border border-white/20 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Púrpura Amatista (👑 Exclusivo VIP $2/mes)' : 'Púrpura Amatista'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Lila */}
              <button
                onClick={() => handleAddHighlight('lila')}
                className={`w-5 h-5 rounded-full bg-[#d8b4fe] hover:scale-125 transition border border-purple-300 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Lila Mágico (👑 Exclusivo VIP $2/mes)' : 'Lila Mágico'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Rojo */}
              <button
                onClick={() => handleAddHighlight('rojo')}
                className={`w-5 h-5 rounded-full bg-red-500 hover:scale-125 transition border border-white/20 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Rojo Carmesí (👑 Exclusivo VIP $2/mes)' : 'Rojo Carmesí'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Esmeralda */}
              <button
                onClick={() => handleAddHighlight('emerald')}
                className={`w-5 h-5 rounded-full bg-emerald-400 hover:scale-125 transition border border-white/20 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Esmeralda Místico (👑 Exclusivo VIP $2/mes)' : 'Esmeralda'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>
              <button
                onClick={() => setShowColorPicker(false)}
                className="p-1 text-xs text-[var(--text-muted)] hover:text-white"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowColorPicker(true)}
                className="px-2 py-1 rounded-xl bg-pink-500/20 text-[var(--accent-pink)] hover:bg-pink-500 hover:text-black transition text-xs font-semibold flex items-center gap-1"
                title="Subrayar texto (Amarillo y Gris gratis, 6 colores VIP 👑)"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>Subrayar</span>
              </button>
              <button
                onClick={() => {
                  if (!isVip && quotesCount !== undefined && quotesCount >= 3) {
                    onOpenVipModal?.('notes');
                    setToastHighlight('👑 Límite de 3 notas alcanzado. Pásate a VIP ($2/mes) para notas infinitas.');
                    return;
                  }
                  onOpenAddQuote(selectedText);
                  setSelectionPos(null);
                }}
                className="px-2 py-1 rounded-xl bg-purple-500/20 text-[var(--accent-purple)] hover:bg-purple-500 hover:text-black transition text-xs font-semibold flex items-center gap-1"
                title="Guardar como Cita"
              >
                <Feather className="w-3.5 h-3.5" />
                <span>Cita</span>
                {!isVip && quotesCount !== undefined && quotesCount >= 3 && (
                  <span className="text-[9px] text-amber-300 font-bold">👑</span>
                )}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedText);
                  setSelectionPos(null);
                  setToastHighlight('Copiado al portapapeles 📋');
                  setTimeout(() => setToastHighlight(null), 2000);
                }}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--text-main)] transition text-xs"
                title="Copiar texto"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Menú de Copiar del Móvil y Acciones Rápidas Literarias */}
      {selectedText && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-[var(--card-bg)]/95 backdrop-blur-xl border-2 border-[var(--accent-pink)] rounded-2xl p-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex flex-col gap-2 modal-animate">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] pb-1.5">
            <span className="text-[11px] font-bold text-[var(--accent-pink)] flex items-center gap-1.5 truncate">
              <span>✍️</span> Menú de Copiar & Subrayar ({selectedText.length} carácteres)
            </span>
            <button
              onClick={() => {
                setSelectedText('');
                setSelectionPos(null);
                window.getSelection()?.removeAllRanges();
              }}
              className="p-1 rounded-lg text-xs text-[var(--text-muted)] hover:text-white hover:bg-white/10"
              title="Cerrar selección"
            >
              ✕
            </button>
          </div>

          <div className="text-xs italic text-[var(--text-main)] bg-black/50 p-2 rounded-xl border border-white/5 line-clamp-2 select-text">
            "{selectedText}"
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            {/* Botón Copiar al Portapapeles (Estilo Móvil) */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedText);
                setToastHighlight('Copiado al portapapeles 📋');
                setTimeout(() => setToastHighlight(null), 2500);
              }}
              className="px-3 py-1.5 bg-black/60 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-xl text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 transition shrink-0 active:scale-95"
              title="Copiar texto al portapapeles"
            >
              <Copy className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
              <span>Copiar 📋</span>
            </button>

            {/* Subrayadores de Colores */}
            <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10">
              {/* Gratis: Amarillo */}
              <button
                onClick={() => handleAddHighlight('gold')}
                className="w-5 h-5 rounded-full bg-amber-400 hover:scale-125 active:scale-95 transition border border-white/40 shadow-sm"
                title="Amarillo / Dorado Sepia (Gratis)"
              />
              {/* Gratis: Gris */}
              <button
                onClick={() => handleAddHighlight('gris')}
                className="w-5 h-5 rounded-full bg-[#94a3b8] hover:scale-125 active:scale-95 transition border border-white/40 shadow-sm"
                title="Gris Plata (Gratis)"
              />

              {/* Separador */}
              <div className="h-3.5 w-px bg-white/20 mx-0.5" />

              {/* VIP: Rosa Neón */}
              <button
                onClick={() => handleAddHighlight('pink')}
                className={`w-5 h-5 rounded-full bg-pink-400 hover:scale-125 active:scale-95 transition border border-white/30 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Rosa Neón (👑 Exclusivo VIP $2/mes)' : 'Rosa Neón'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Rosa Pastel */}
              <button
                onClick={() => handleAddHighlight('rosa-pastel')}
                className={`w-5 h-5 rounded-full bg-[#fbcfe8] hover:scale-125 active:scale-95 transition border border-pink-300 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Rosa Pastel (👑 Exclusivo VIP $2/mes)' : 'Rosa Pastel'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Púrpura */}
              <button
                onClick={() => handleAddHighlight('purple')}
                className={`w-5 h-5 rounded-full bg-purple-400 hover:scale-125 active:scale-95 transition border border-white/30 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Púrpura Amatista (👑 Exclusivo VIP $2/mes)' : 'Púrpura Amatista'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Lila */}
              <button
                onClick={() => handleAddHighlight('lila')}
                className={`w-5 h-5 rounded-full bg-[#d8b4fe] hover:scale-125 active:scale-95 transition border border-purple-300 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Lila Mágico (👑 Exclusivo VIP $2/mes)' : 'Lila Mágico'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Rojo */}
              <button
                onClick={() => handleAddHighlight('rojo')}
                className={`w-5 h-5 rounded-full bg-red-500 hover:scale-125 active:scale-95 transition border border-white/30 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Rojo Carmesí (👑 Exclusivo VIP $2/mes)' : 'Rojo Carmesí'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>

              {/* VIP: Esmeralda */}
              <button
                onClick={() => handleAddHighlight('emerald')}
                className={`w-5 h-5 rounded-full bg-emerald-400 hover:scale-125 active:scale-95 transition border border-white/30 relative flex items-center justify-center ${!isVip ? 'opacity-80' : ''}`}
                title={!isVip ? 'Esmeralda Místico (👑 Exclusivo VIP $2/mes)' : 'Esmeralda'}
              >
                {!isVip && <span className="text-[8px] leading-none">👑</span>}
              </button>
            </div>

            {/* Crear Cita */}
            <button
              onClick={() => {
                if (!isVip && quotesCount !== undefined && quotesCount >= 3) {
                  onOpenVipModal?.('notes');
                  setToastHighlight('👑 Límite de 3 notas alcanzado. Pásate a VIP ($2/mes) para notas infinitas.');
                  return;
                }
                onOpenAddQuote(selectedText);
                setSelectedText('');
                setSelectionPos(null);
              }}
              className="px-2.5 py-1.5 bg-purple-500/30 border border-purple-500/50 hover:bg-purple-500 hover:text-black rounded-xl text-xs font-bold text-[var(--accent-purple)] flex items-center gap-1 transition shrink-0 active:scale-95"
              title="Guardar como Cita en el Baúl"
            >
              <Feather className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Cita</span>
              {!isVip && quotesCount !== undefined && quotesCount >= 3 && (
                <span className="text-[9px] text-amber-300 font-bold">👑</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div 
        ref={containerRef}
        id="reader-viewport"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.movable-sticker') || (e.target as HTMLElement).closest('.sticker-drawer')) return;
          if (selectedStickerId) setSelectedStickerId(null);
        }}
        className="flex-1 relative overflow-auto flex justify-center items-start p-2 sm:p-5"
      >
        {loadingFile ? (
          <div className="my-auto text-center py-20">
            <div className="text-4xl animate-bounce mb-3">🐾</div>
            <p className="font-cute text-sm text-[var(--accent-pink)]">
              Cargando tomo literario...
            </p>
          </div>
        ) : fileError ? (
          <div className="my-auto max-w-md bg-red-950/40 border border-red-500/50 rounded-2xl p-6 text-center">
            <p className="text-3xl mb-2">🦇</p>
            <h4 className="font-bold text-sm text-red-300 mb-1">
              No se pudo abrir el libro
            </h4>
            <p className="text-xs text-red-200/80 mb-4">{fileError}</p>
            <button
              onClick={onBackToLibrary}
              className="px-4 py-2 bg-red-500 text-black font-bold text-xs rounded-xl"
            >
              Volver a la Biblioteca
            </button>
          </div>
        ) : (
          /* Book Page Card with Readers & Movable Stickers Layer */
          <div
            id="page-container"
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
            className={`relative shadow-2xl min-h-[540px] ${
              book.type === 'pdf'
                ? zoomLevel > 1.0 && !pdfReflowMode
                  ? 'w-auto max-w-none'
                  : containerWidth === 'narrow'
                  ? 'w-full max-w-xl'
                  : containerWidth === 'wide'
                  ? 'w-full max-w-4xl'
                  : 'w-full max-w-3xl'
                : containerWidth === 'narrow'
                ? 'w-full max-w-xl'
                : containerWidth === 'wide'
                ? 'w-full max-w-4xl'
                : 'w-full max-w-3xl'
            } rounded-2xl overflow-hidden transition-all my-auto p-2 sm:p-6 border border-[var(--border-color)] ${
              flipDirection === 'forward' ? 'page-flip-forward' : flipDirection === 'backward' ? 'page-flip-backward' : ''
            }`}
            style={{
              backgroundColor: currentReaderModeConfig.bg,
              color: currentReaderModeConfig.text,
              fontFamily: currentFont
            }}
          >
            {/* LADO IZQUIERDO: Pasar página anterior encima del lector */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (currentPage > 1) changePage(-1);
              }}
              disabled={currentPage <= 1}
              className={`absolute left-0 top-0 bottom-0 w-10 sm:w-16 z-30 flex items-center justify-start pl-1 sm:pl-2 group/prev transition-all cursor-pointer select-none ${
                currentPage <= 1 ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-100'
              }`}
              title="Página Anterior (Lado izquierdo) [←]"
              aria-label="Página anterior"
            >
              <div className="w-7 sm:w-9 h-16 sm:h-20 rounded-r-2xl bg-black/70 backdrop-blur-md border border-l-0 border-[var(--border-color)] group-hover/prev:border-[var(--accent-pink)] group-hover/prev:bg-[var(--accent-pink)]/25 flex items-center justify-center text-[var(--text-muted)] group-hover/prev:text-[var(--accent-pink)] transition shadow-2xl transform group-hover/prev:-translate-x-0.5">
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
            </button>

            {/* LADO DERECHO: Pasar página adelante encima del lector */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (currentPage < totalPages) changePage(1);
              }}
              disabled={currentPage >= totalPages}
              className={`absolute right-0 top-0 bottom-0 w-10 sm:w-16 z-30 flex items-center justify-end pr-1 sm:pr-2 group/next transition-all cursor-pointer select-none ${
                currentPage >= totalPages ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-100'
              }`}
              title="Página Siguiente (Lado derecho) [→]"
              aria-label="Página siguiente"
            >
              <div className="w-7 sm:w-9 h-16 sm:h-20 rounded-l-2xl bg-black/70 backdrop-blur-md border border-r-0 border-[var(--border-color)] group-hover/next:border-[var(--accent-pink)] group-hover/next:bg-[var(--accent-pink)]/25 flex items-center justify-center text-[var(--text-muted)] group-hover/next:text-[var(--accent-pink)] transition shadow-2xl transform group-hover/next:translate-x-0.5">
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
            </button>

            {/* 1. PDF Canvas & Reflow Adaptable (Sin barras estorbosas en la página) */}
            {book.type === 'pdf' && (
              <div className="w-full flex flex-col items-center">
                {/* VISTA 1: Modo Acomodar Letras (Reflow Adaptable sin desbordamiento horizontal) */}
                {pdfReflowMode ? (
                  <div className="w-full">
                    {pdfPageText ? (
                      <div 
                        className="prose max-w-none transition-all whitespace-pre-line select-text break-words px-1 sm:px-4 py-2"
                        style={{ 
                          fontSize: `${fontSize}px`, 
                          lineHeight: lineHeight,
                          color: currentReaderModeConfig.text,
                          fontFamily: currentFont 
                        }}
                      >
                        {renderHighlightedContent(pdfPageText, currentPageHighlights)}
                      </div>
                    ) : (
                      <div className="text-center py-12 px-4 space-y-3 bg-black/30 rounded-2xl border border-white/5">
                        <div className="text-3xl animate-bounce">📜</div>
                        <h4 className="font-bold text-sm text-[var(--accent-pink)]">
                          Modo Lectura Adaptable
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                          Si esta página contiene texto, se extraerá automáticamente. Si es un documento escaneado como imagen, cambia al modo "Página Fija".
                        </p>
                        <button
                          type="button"
                          onClick={() => setPdfReflowMode(false)}
                          className="px-3 py-1.5 bg-[var(--accent-pink)] text-black font-bold text-xs rounded-xl"
                        >
                          Ver en Página Fija
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* VISTA 2: Vista Página Fija (Canvas con Capa de Selección Directa y Subrayados Visuales) */
                  <div className="w-full flex justify-center items-center overflow-x-auto overflow-y-visible p-1">
                    <div 
                      className="relative mx-auto shadow-2xl rounded-lg overflow-hidden select-text"
                      style={{
                        width: pdfViewportDim.width > 0 ? `${pdfViewportDim.width}px` : 'auto',
                        height: pdfViewportDim.height > 0 ? `${pdfViewportDim.height}px` : 'auto'
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        className="block mx-auto rounded-lg transition-all duration-150"
                        style={{
                          width: pdfViewportDim.width > 0 ? `${pdfViewportDim.width}px` : '100%',
                          height: pdfViewportDim.height > 0 ? `${pdfViewportDim.height}px` : 'auto'
                        }}
                      />

                      {/* Capa de subrayados y citas marcadas directamente sobre el lienzo del PDF */}
                      {currentPageHighlights.map((hl) => {
                        const cleanQuote = hl.text.toLowerCase().trim();
                        const matchingItems = pdfTextItems.filter((item) => {
                          const itemStr = item.str.toLowerCase();
                          return cleanQuote.includes(itemStr) || itemStr.includes(cleanQuote);
                        });

                        const highlightColors: Record<HighlightColor, string> = {
                          pink: 'bg-pink-500/35 border-b-2 border-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
                          purple: 'bg-purple-500/35 border-b-2 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]',
                          lila: 'bg-purple-300/35 border-b-2 border-purple-300 shadow-[0_0_8px_rgba(216,180,254,0.5)]',
                          gris: 'bg-slate-400/35 border-b-2 border-slate-300 shadow-[0_0_8px_rgba(148,163,184,0.5)]',
                          'rosa-pastel': 'bg-pink-300/35 border-b-2 border-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.5)]',
                          rojo: 'bg-red-500/35 border-b-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
                          gold: 'bg-amber-500/35 border-b-2 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
                          emerald: 'bg-emerald-500/35 border-b-2 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        };

                        return matchingItems.map((item, idx) => (
                          <div
                            key={`pdf-hl-${hl.id}-${idx}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddQuote(hl.text);
                            }}
                            className={`absolute rounded cursor-pointer transition-all hover:brightness-125 z-10 ${highlightColors[hl.color] || highlightColors.pink}`}
                            style={{
                              left: `${item.left}px`,
                              top: `${item.top}px`,
                              width: `${item.width}px`,
                              height: `${item.height}px`
                            }}
                            title={`Cita marcada: "${hl.text}". Clic para abrir en el Baúl.`}
                          />
                        ));
                      })}

                      {/* Capa de texto seleccionable directamente sobre el lienzo del PDF */}
                      <div 
                        className="pdf-text-layer absolute inset-0 select-text pointer-events-auto z-20"
                        style={{
                          width: pdfViewportDim.width > 0 ? `${pdfViewportDim.width}px` : '100%',
                          height: pdfViewportDim.height > 0 ? `${pdfViewportDim.height}px` : 'auto'
                        }}
                      >
                        {pdfTextItems.map((item, idx) => (
                          <span
                            key={`txt-${idx}`}
                            style={{
                              position: 'absolute',
                              left: `${item.left}px`,
                              top: `${item.top}px`,
                              width: `${item.width}px`,
                              height: `${item.height}px`,
                              fontSize: `${item.fontSize}px`,
                              lineHeight: `${item.height}px`,
                              color: 'transparent',
                              backgroundColor: 'transparent',
                              userSelect: 'text',
                              cursor: 'text',
                              whiteSpace: 'pre'
                            }}
                          >
                            {item.str}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. EPUB Render Div con Subrayado Directo */}
            {book.type === 'epub' && (
              <div
                className="prose max-w-none transition-all select-text leading-relaxed epub-rendered-content"
                style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                dangerouslySetInnerHTML={{
                  __html: highlightHtmlContent(
                    epubPages[currentPage - 1] || (book.content && book.content[currentPage - 1]) || '<p class="text-center py-12 opacity-60">Cargando página de lectura...</p>',
                    currentPageHighlights
                  )
                }}
              />
            )}

            {/* 3. Demo or Text Book Page con Subrayado Directo en la Frase */}
            {(book.type === 'demo' || book.type === 'text') && (
              <div 
                className="prose max-w-none transition-all whitespace-pre-line select-text"
                style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
              >
                {book.content && book.content[currentPage - 1] ? (
                  renderHighlightedContent(book.content[currentPage - 1], currentPageHighlights)
                ) : (
                  <p className="text-center italic text-sm opacity-60 py-10">
                    Fin de la lectura de este capítulo. 🐾
                  </p>
                )}
              </div>
            )}

            {/* Subrayados y Citas de Color Guardados en esta Página (Válido para PDF, EPUB y Libros) */}
            {currentPageHighlights.length > 0 && (
              <div className="mt-8 pt-4 border-t border-white/10 space-y-2 select-text">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-pink)]">
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Subrayados guardados ({currentPageHighlights.length}):</span>
                </div>
                <div className="space-y-1.5">
                  {currentPageHighlights.map((hl) => {
                    const bgColors: Record<HighlightColor, string> = {
                      pink: 'bg-pink-500/20 border-pink-500/50 text-pink-200',
                      purple: 'bg-purple-500/20 border-purple-500/50 text-purple-200',
                      lila: 'bg-purple-400/20 border-purple-400/50 text-purple-200',
                      gris: 'bg-slate-400/20 border-slate-400/50 text-slate-200',
                      'rosa-pastel': 'bg-pink-300/20 border-pink-300/50 text-pink-200',
                      rojo: 'bg-red-500/20 border-red-500/50 text-red-200',
                      gold: 'bg-amber-500/20 border-amber-500/50 text-amber-200',
                      emerald: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                    };
                    return (
                      <div
                        key={hl.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 italic leading-relaxed ${bgColors[hl.color]}`}
                      >
                        <span className="line-clamp-2">"{hl.text}"</span>
                        <div className="flex items-center gap-1 shrink-0 not-italic">
                          <button
                            onClick={() => onOpenAddQuote(hl.text)}
                            className="p-1 hover:text-white rounded bg-black/30"
                            title="Guardar como Cita en el Baúl"
                          >
                            <Feather className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteHighlight(hl.id)}
                            className="p-1 text-red-400 hover:text-red-300 rounded bg-black/30"
                            title="Eliminar subrayado"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Movable Sticker Layer (Con tamaño pequeño/grande, fijado y desbloqueo) */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {currentPageStickers.map((stk) => {
                const isSelected = selectedStickerId === stk.id;
                const scale = stk.scale ?? 1.0;
                const toolbarAbove = (stk.y || 0) >= 55;
                return (
                  <div
                    key={stk.id}
                    onPointerDown={(e) => onPointerDownSticker(stk.id, e)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      const cur = stk.scale ?? 1.0;
                      let next = 1.0;
                      if (cur < 0.85) next = 1.0;
                      else if (cur < 1.3) next = 1.6;
                      else if (cur < 2.0) next = 2.3;
                      else next = 0.65;
                      handleSetStickerScale(stk.id, next);
                    }}
                    className={`movable-sticker absolute text-3xl select-none pointer-events-auto cursor-grab active:cursor-grabbing transition-transform ${
                      isSelected ? 'ring-2 ring-[var(--accent-pink)] rounded-xl bg-black/40 p-1 shadow-lg' : ''
                    } ${stk.isLocked ? 'drop-shadow-[0_2px_10px_rgba(255,105,180,0.5)]' : 'hover:scale-105'}`}
                    style={{
                      left: `${stk.x}px`,
                      top: `${stk.y}px`,
                      transform: `rotate(${stk.rotation || 0}deg) scale(${scale})`,
                      transformOrigin: 'center center'
                    }}
                    title={
                      stk.isLocked
                        ? 'Sticker pegado fijo 📌. Toca para moverlo o cambiar su tamaño.'
                        : 'Sticker desbloqueado 🔓. Arrastra a donde gustes o usa los botones para hacerlo pequeño/grande.'
                    }
                  >
                    <span className="relative inline-block">
                      {stk.emoji}
                      <span className="absolute -top-1.5 -right-1.5 text-[10px] pointer-events-none bg-black/80 rounded-full px-0.5">
                        {stk.isLocked ? '📌' : '🔓'}
                      </span>
                    </span>

                    {/* Manilla interactiva de redimensión en la esquina inferior derecha */}
                    {isSelected && (
                      <div
                        onPointerDown={(e) => onPointerDownResizeHandle(stk.id, e)}
                        className="sticker-resize-handle absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform select-none z-30 font-bold text-[10px]"
                        title="Arrastra para agrandar o achicar el sticker"
                      >
                        ⤡
                      </div>
                    )}

                    {/* Sticker mini-toolbar on selection con controles de tamaño */}
                    {isSelected && (
                      <div
                        className={`sticker-toolbar absolute ${
                          toolbarAbove ? '-top-12' : '-bottom-12'
                        } left-1/2 -translate-x-1/2 bg-black/95 border border-[var(--border-color)] rounded-2xl px-2 py-1 flex items-center gap-1 shadow-2xl pointer-events-auto z-40 backdrop-blur-md whitespace-nowrap`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Controles para poner pequeño y grande */}
                        <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10 gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => handleResizeSticker(stk.id, -0.25, e)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-white hover:bg-[var(--accent-pink)] hover:text-black transition"
                            title="Hacer más pequeño (-)"
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleSetStickerScale(stk.id, 0.65, e)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                              Math.abs(scale - 0.65) < 0.15
                                ? 'bg-[var(--accent-pink)] text-black'
                                : 'text-[var(--text-muted)] hover:text-white'
                            }`}
                            title="Tamaño Pequeño (P)"
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSetStickerScale(stk.id, 1.0, e)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                              Math.abs(scale - 1.0) < 0.15
                                ? 'bg-[var(--accent-pink)] text-black'
                                : 'text-[var(--text-muted)] hover:text-white'
                            }`}
                            title="Tamaño Mediano (M)"
                          >
                            M
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSetStickerScale(stk.id, 1.6, e)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                              Math.abs(scale - 1.6) < 0.15
                                ? 'bg-[var(--accent-pink)] text-black'
                                : 'text-[var(--text-muted)] hover:text-white'
                            }`}
                            title="Tamaño Grande (G)"
                          >
                            G
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSetStickerScale(stk.id, 2.3, e)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                              Math.abs(scale - 2.3) < 0.2
                                ? 'bg-[var(--accent-pink)] text-black'
                                : 'text-[var(--text-muted)] hover:text-white'
                            }`}
                            title="Tamaño Extra Grande (XL)"
                          >
                            XL
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleResizeSticker(stk.id, 0.25, e)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-white hover:bg-[var(--accent-pink)] hover:text-black transition"
                            title="Hacer más grande (+)"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>

                        <div className="h-4 w-px bg-white/20 mx-0.5" />

                        {/* Fijar o desbloquear para mover */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleLockSticker(stk.id, e)}
                          className="p-1 rounded-lg text-amber-300 hover:bg-white/10 hover:scale-110 transition"
                          title={stk.isLocked ? 'Despegar sticker para moverlo' : 'Pegar fijo en la página'}
                        >
                          {stk.isLocked ? <Pin className="w-3.5 h-3.5 fill-amber-300" /> : <Unlock className="w-3.5 h-3.5 text-amber-300" />}
                        </button>

                        {/* Rotar */}
                        <button
                          type="button"
                          onClick={(e) => handleRotateSticker(stk.id, e)}
                          className="p-1 text-[var(--accent-pink)] hover:bg-white/10 hover:scale-110 transition"
                          title="Rotar sticker"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSticker(stk.id, e)}
                          className="p-1 text-red-400 hover:bg-white/10 hover:scale-110 transition"
                          title="Eliminar sticker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Reading Controls Bar (Atrás, Barra de Navegación, Conteo Pequeño y Adelante) */}
      <div className="bg-[var(--card-bg)]/90 backdrop-blur-md border-t border-[var(--border-color)] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3 z-30">
        {/* Left: Previous page button (Atrás) */}
        <button
          onClick={() => changePage(-1)}
          disabled={currentPage <= 1}
          className="px-2.5 sm:px-3.5 py-1.5 bg-black/40 border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-main)] hover:border-[var(--accent-pink)] disabled:opacity-30 disabled:hover:border-transparent transition flex items-center gap-1 shrink-0"
          title="Página anterior (Atrás)"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Center: Conteo de página más pequeño y barra de adelante/atrás (deslizador) */}
        <div className="flex items-center space-x-2 sm:space-x-3 max-w-sm sm:max-w-md w-full mx-1">
          {/* Conteo de página más pequeño junto a la barra */}
          <span 
            className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 whitespace-nowrap bg-black/50 px-2 py-0.5 rounded-md border border-white/5 select-none"
            title="Página actual y total"
          >
            <span className="text-[var(--accent-pink)] font-bold">{currentPage}</span> / {totalPages}
          </span>

          {/* Barra de adelante y atrás (deslizador de páginas) */}
          <input
            type="range"
            min="1"
            max={totalPages || 1}
            value={currentPage}
            onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
            className="w-full accent-[var(--accent-pink)] cursor-pointer h-1.5 bg-black/60 rounded-lg"
            title={`Deslizar entre páginas (Pág. ${currentPage} de ${totalPages})`}
          />

          {/* Controles de Zoom para PDF */}
          {book.type === 'pdf' && (
            <div className="hidden xs:flex items-center space-x-1 border-l border-[var(--border-color)] pl-2 shrink-0">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                className="p-1 bg-black/40 border border-[var(--border-color)] rounded-md text-[11px] hover:border-[var(--accent-pink)] text-[var(--text-main)] transition flex items-center justify-center"
                title="Reducir zoom (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                className="text-[10px] font-mono text-[var(--accent-pink)] font-bold min-w-8 text-center hover:underline cursor-pointer"
                title="Restablecer a 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))))}
                className="p-1 bg-black/40 border border-[var(--border-color)] rounded-md text-[11px] hover:border-[var(--accent-pink)] text-[var(--text-main)] transition flex items-center justify-center"
                title="Ampliar zoom (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Next page button (Adelante) */}
        <button
          onClick={() => changePage(1)}
          disabled={currentPage >= totalPages}
          className="px-2.5 sm:px-3.5 py-1.5 bg-[var(--accent-pink)] text-black rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-30 disabled:bg-black/40 disabled:text-gray-500 transition flex items-center gap-1 shadow-md shrink-0"
          title="Página siguiente (Adelante)"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Kawaii Reading Settings Modal (Ajustes de Lectura unificados) */}
      <ReadingSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        bookType={book.type}
        pdfReflowMode={pdfReflowMode}
        onTogglePdfReflow={(reflow) => {
          setPdfReflowMode(reflow);
          localStorage.setItem('nl_pdf_reflow_mode', String(reflow));
          setToastHighlight(reflow ? '📖 Modo Acomodar Letras: Las palabras se ajustan al ancho' : '📄 Modo Página Fija: Vista original');
        }}
        currentFont={currentFont}
        onSelectFont={(font) => {
          onSelectFont?.(font);
          localStorage.setItem('nl_font', font);
        }}
        fontSize={fontSize}
        onSelectFontSize={(size) => setFontSize(size)}
        lineHeight={lineHeight}
        onSelectLineHeight={(lh) => setLineHeight(lh)}
        containerWidth={containerWidth}
        onSelectContainerWidth={(w) => setContainerWidth(w)}
        readerMode={readerMode}
        onSelectReaderMode={(m) => setReaderMode(m)}
        isWakeLockActive={isWakeLockActive}
        onToggleWakeLock={toggleWakeLock}
        zoomLevel={zoomLevel}
        onSetZoomLevel={(z) => setZoomLevel(z)}
        isVip={isVip}
        onOpenVipModal={() => onOpenVipModal?.('fonts')}
      />

      {/* Music Shelf Modal (Estantería de Música - Subir archivos y sonar de fondo) */}
      <MusicShelfModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        onToast={(msg) => {
          setToastHighlight(msg);
          setTimeout(() => setToastHighlight(null), 3000);
        }}
      />
    </div>
  );
};
