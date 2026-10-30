import re

with open('src/components/Bookshelf.tsx', 'r') as f:
    text = f.read()

# 1. Remove import
text = text.replace("import { ShelfDecoration, DecorationType } from './ShelfDecoration';\n", "")

# 2. Remove showDecorations state
text = text.replace("  const [showDecorations, setShowDecorations] = useState<boolean>(true);\n", "")

# 3. Remove decorations toggle button in toolbar
text = re.sub(
    r'\{\/\* Shelf Decorations Toggle Button \*\/\}[\s\S]*?\{\/\* Shortcut to Stats \*\/\}',
    '{/* Shortcut to Stats */}',
    text
)

# 4. Remove companions in covers view
text = re.sub(
    r'\{\/\* Companions on shelf: Dragones Rosas[\s\S]*?\}\)\(\)\s*\}\s*',
    '',
    text
)

# 5. Remove companion bookend in spines view
text = re.sub(
    r'\{\/\* Companion Bookend at end of row \*\/\}[\s\S]*?\{\/div>\s*\}\s*',
    '',
    text
)

# 6. Remove companions in stacks view
text = re.sub(
    r'\{showDecorations && \([\s\S]*?<ShelfDecoration[\s\S]*?<\/div>\s*\}\s*',
    '',
    text
)

# 7. Update shelf plank
old_plank_pattern = r'\{\/\* Wooden or Digital 3D THICK Shelf Surface \*\/\}[\s\S]*?\{\/\* Right Shelf Bookend Companion \*\/\}[\s\S]*?<\/div>\s*<\/div>'
new_plank = '''{/* Wooden or Digital 3D THICK Shelf Surface */}
              <div className={`shelf-thick ${shelfClassMap[shelfStyle]} w-full flex items-center justify-between px-4 text-xs shadow-2xl relative select-none mt-2`}>
                <div className="text-[10px] font-mono tracking-widest uppercase opacity-70 text-center select-none font-bold mx-auto text-[var(--text-main)]">
                  ESTANTE {shelfIndex + 1}
                </div>
              </div>'''

text = re.sub(old_plank_pattern, new_plank, text)

# 8. Wrap shelves in bookcase-frame and bookcase-bay
old_shelves = '<div className="space-y-12 sm:space-y-16">'
new_shelves = '<div className={`bookcase-frame-${shelfStyle} overflow-hidden shadow-2xl`}>\n          {/* Top Cornice Header */}\n          <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/10 bg-black/40 text-[11px] font-mono tracking-widest text-[var(--accent-pink)]">\n            <span className="font-bold flex items-center gap-1.5">\n              <span>📚</span>\n              <span>LIBRERO NEKO GOTHIC</span>\n            </span>\n            <span className="text-[10px] text-[var(--text-muted)] font-mono">\n              {books.length} {books.length === 1 ? \'TOMO\' : \'TOMOS\'} EN TOTAL\n            </span>\n          </div>\n\n          <div className="divide-y divide-black/80">'

text = text.replace(old_shelves, new_shelves)

# Change div className="relative" for each shelf into bookcase-bay
text = text.replace(
    '{shelves.map((shelfBooks, shelfIndex) => (\n            <div key={shelfIndex} className="relative">',
    '{shelves.map((shelfBooks, shelfIndex) => (\n              <div key={shelfIndex} className={`bookcase-bay-${shelfStyle} pt-6 pb-0 relative`}>'
)

# Replace closing of shelves
old_closing = '''            </div>
          ))}
        </div>'''
new_closing = '''              </div>
            ))}
          </div>
        </div>'''
text = text.replace(old_closing, new_closing)

with open('src/components/Bookshelf.tsx', 'w') as f:
    f.write(text)

print('Bookshelf.tsx successfully transformed.')
