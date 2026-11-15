import { HighlightColor, TextHighlight } from '../types';

const ALLOWED_TAGS = new Set([
  'p', 'div', 'span', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
  'blockquote', 'q', 'cite', 'code', 'pre',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'figure', 'figcaption', 'img', 'a',
  'section', 'article', 'header', 'footer', 'aside', 'main',
  'ruby', 'rt', 'rp'
]);

const STRIP_WITH_CONTENT_TAGS = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset',
  'object', 'embed', 'applet', 'svg', 'math',
  'form', 'input', 'button', 'textarea', 'select', 'option',
  'meta', 'base', 'link', 'template', 'noscript', 'title'
]);

const ALLOWED_STYLE_PROPS = new Set([
  'text-align',
  'font-style',
  'font-weight',
  'text-decoration',
  'max-width',
  'height',
  'margin',
  'display',
  'border-radius',
  'padding',
  'line-height',
  'background-color',
  'border-bottom'
]);

const SAFE_DATA_IMAGE_RE = /^data:image\/(?:png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/i;
const SAFE_HTTPS_URL_RE = /^https:\/\/[^\s"'<>()\\]+$/i;

/**
 * Validates image URLs (allows only HTTPS image URLs or raster Base64 images,
 * blocking SVG scripts, javascript:, and CSS injection characters).
 */
export function sanitizeImageUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (SAFE_DATA_IMAGE_RE.test(trimmed)) return trimmed;
  if (SAFE_HTTPS_URL_RE.test(trimmed)) return trimmed;
  return null;
}

/**
 * Validates href links inside EPUB content (only #anchors and http/https URLs).
 */
function sanitizeHref(rawHref?: string | null): string | null {
  if (!rawHref || typeof rawHref !== 'string') return null;
  const trimmed = rawHref.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('#') && !/[\s"'<>]/.test(trimmed)) return trimmed;
  if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed)) return trimmed;
  return null;
}

/**
 * Keeps only benign CSS declarations and rejects url(), expression(), etc.
 */
function sanitizeInlineStyle(rawStyle?: string | null): string {
  if (!rawStyle || typeof rawStyle !== 'string') return '';
  if (/url\s*\(|expression\s*\(|@import|javascript:|behavior\s*:|binding\s*:/i.test(rawStyle)) {
    return '';
  }
  const safeDeclarations: string[] = [];
  for (const decl of rawStyle.split(';')) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const val = decl.slice(colonIdx + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(prop) || !val) continue;
    if (/[<>{}`\\]/.test(val)) continue;
    safeDeclarations.push(`${prop}: ${val}`);
  }
  return safeDeclarations.join('; ');
}

function cleanElementTree(root: Element): void {
  const children = Array.from(root.children);
  for (const el of children) {
    const tag = el.tagName.toLowerCase();

    if (STRIP_WITH_CONTENT_TAGS.has(tag)) {
      el.remove();
      continue;
    }

    // Recursively sanitize children first
    cleanElementTree(el);

    if (!ALLOWED_TAGS.has(tag)) {
      // Unwrap unknown formatting containers while preserving safe text/children
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        el.remove();
      }
      continue;
    }

    // Remove all unsafe attributes & event handlers
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction' || name === 'action') {
        el.removeAttribute(attr.name);
        continue;
      }

      if (name === 'style') {
        const cleaned = sanitizeInlineStyle(attr.value);
        if (cleaned) el.setAttribute('style', cleaned);
        else el.removeAttribute('style');
        continue;
      }

      if (tag === 'img' && name === 'src') {
        const safeSrc = sanitizeImageUrl(attr.value);
        if (safeSrc) el.setAttribute('src', safeSrc);
        else el.removeAttribute('src');
        continue;
      }

      if (tag === 'a' && name === 'href') {
        const safeHref = sanitizeHref(attr.value);
        if (safeHref) {
          el.setAttribute('href', safeHref);
          if (safeHref.startsWith('http')) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          }
        } else {
          el.removeAttribute('href');
        }
        continue;
      }

      if (name === 'alt' || name === 'title' || name === 'colspan' || name === 'rowspan' || name === 'class') {
        if (name === 'class') {
          // Allow benign utility classes only
          const safeClass = attr.value.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
          if (safeClass) el.setAttribute('class', safeClass);
          else el.removeAttribute('class');
        }
        continue;
      }

      el.removeAttribute(attr.name);
    }

    // Remove broken <img> tags that had unsafe/missing src
    if (tag === 'img' && !el.getAttribute('src')) {
      el.remove();
    }
  }
}

/**
 * Sanitizes EPUB chapter HTML against XSS before caching or rendering.
 */
export function sanitizeEpubHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';
  if (typeof DOMParser === 'undefined') {
    return rawHtml.replace(/<[^>]+>/g, '');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const body = doc.body;
  if (!body) return '';
  cleanElementTree(body);
  return body.innerHTML;
}

const HIGHLIGHT_INLINE_STYLES: Record<HighlightColor, string> = {
  pink: 'background-color: rgba(244, 63, 94, 0.4); border-bottom: 2px solid #f43f5e; padding: 1px 4px; border-radius: 4px; font-weight: 600',
  purple: 'background-color: rgba(168, 85, 247, 0.4); border-bottom: 2px solid #a855f7; padding: 1px 4px; border-radius: 4px; font-weight: 600',
  lila: 'background-color: rgba(192, 132, 252, 0.4); border-bottom: 2px solid #c084fc; padding: 1px 4px; border-radius: 4px; font-weight: 600',
  gris: 'background-color: rgba(148, 163, 184, 0.4); border-bottom: 2px solid #94a3b8; padding: 1px 4px; border-radius: 4px; font-weight: 600',
  'rosa-pastel': 'background-color: rgba(244, 114, 182, 0.4); border-bottom: 2px solid #f472b6; padding: 1px 4px; border-radius: 4px; font-weight: 600',
  rojo: 'background-color: rgba(239, 68, 68, 0.4); border-bottom: 2px solid #ef4444; padding: 1px 4px; border-radius: 4px; font-weight: 600',
  gold: 'background-color: rgba(245, 158, 11, 0.4); border-bottom: 2px solid #f59e0b; padding: 1px 4px; border-radius: 4px; font-weight: 600',
  emerald: 'background-color: rgba(16, 185, 129, 0.4); border-bottom: 2px solid #10b981; padding: 1px 4px; border-radius: 4px; font-weight: 600'
};

/**
 * Sanitizes EPUB HTML and safely injects <mark> highlights only within text nodes,
 * never mutating HTML tag names or attributes.
 */
export function highlightHtmlSafely(rawHtml: string, pageHighlights: TextHighlight[]): string {
  const safeHtml = sanitizeEpubHtml(rawHtml);
  if (!pageHighlights || pageHighlights.length === 0 || !safeHtml || typeof DOMParser === 'undefined') {
    return safeHtml;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(safeHtml, 'text/html');
  const body = doc.body;
  if (!body) return safeHtml;

  for (const hl of pageHighlights) {
    const query = hl.text?.trim();
    if (!query || query.length < 2) continue;
    const lowerQuery = query.toLowerCase();

    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      if (current.nodeType === Node.TEXT_NODE && current.parentElement?.tagName.toLowerCase() !== 'mark') {
        textNodes.push(current as Text);
      }
      current = walker.nextNode();
    }

    for (const textNode of textNodes) {
      const value = textNode.nodeValue || '';
      const lowerVal = value.toLowerCase();
      let idx = lowerVal.indexOf(lowerQuery);
      if (idx === -1) continue;

      const frag = doc.createDocumentFragment();
      let lastIdx = 0;
      while (idx !== -1) {
        if (idx > lastIdx) {
          frag.appendChild(doc.createTextNode(value.slice(lastIdx, idx)));
        }
        const mark = doc.createElement('mark');
        mark.setAttribute('style', HIGHLIGHT_INLINE_STYLES[hl.color] || HIGHLIGHT_INLINE_STYLES.pink);
        mark.setAttribute('data-hl-id', String(hl.id).replace(/[^a-zA-Z0-9_-]/g, ''));
        mark.textContent = value.slice(idx, idx + query.length);
        frag.appendChild(mark);
        lastIdx = idx + query.length;
        idx = lowerVal.indexOf(lowerQuery, lastIdx);
      }
      if (lastIdx < value.length) {
        frag.appendChild(doc.createTextNode(value.slice(lastIdx)));
      }
      textNode.parentNode?.replaceChild(frag, textNode);
    }
  }

  return body.innerHTML;
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function stripPrototypePollution(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val.map(stripPrototypePollution);
  }
  if (val && typeof val === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(k)) continue;
      clean[k] = stripPrototypePollution(v);
    }
    return clean;
  }
  return val;
}

/**
 * Safely parses JSON from localStorage while stripping prototype-pollution keys
 * and validating expected shape.
 */
export function safeJsonParse<T>(
  raw: string | null,
  fallback: T,
  validator?: (value: unknown) => value is T
): T {
  if (!raw) return fallback;
  try {
    const parsed = stripPrototypePollution(JSON.parse(raw));
    if (validator && !validator(parsed)) {
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}
