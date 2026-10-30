with open('src/components/Bookshelf.tsx', 'r') as f:
    text = f.read()

# Replace from end of spines view to closing of shelves
old_chunk = '''                        {/* Quick Delete overlay button on hover */}
                        <button
                          onClick={(e) => onDeleteBook(book.id, e)}
                          className="absolute -top-3 right-0 p-1 rounded-full bg-red-950 text-red-300 border border-red-500/50 opacity-0 group-hover:opacity-100 transition shadow-lg text-[10px]"
                          title="Eliminar tomo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}

                  }

                  
                </div>
              )}

              {/* Wooden or Digital 3D THICK Shelf Surface */}
              <div className={`shelf-thick ${shelfClassMap[shelfStyle]} w-full flex items-center justify-between px-4 text-xs shadow-2xl relative select-none mt-2`}>
                <div className="text-[10px] font-mono tracking-widest uppercase opacity-70 text-center select-none font-bold mx-auto text-[var(--text-main)]">
                  ESTANTE {shelfIndex + 1}
                </div>
                </div>
            ))}
          </div>
        </div>
      )}'''

new_chunk = '''                        {/* Quick Delete overlay button on hover */}
                        <button
                          onClick={(e) => onDeleteBook(book.id, e)}
                          className="absolute -top-3 right-0 p-1 rounded-full bg-red-950 text-red-300 border border-red-500/50 opacity-0 group-hover:opacity-100 transition shadow-lg text-[10px]"
                          title="Eliminar tomo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MODE 3: STACKS VIEW (Libros acostados / apilados horizontalmente) */}
              {viewMode === 'stacks' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-2 items-end">
                  {shelfBooks.map((book) => {
                    const percent = book.progressPercent || 0;
                    return (
                      <div
                        key={book.id}
                        onClick={() => onOpenBook(book)}
                        className="group cursor-pointer flex flex-col justify-end transition-all duration-300 transform hover:-translate-y-2 relative"
                      >
                        {/* Horizontal Flat / Stacked Book */}
                        <div 
                          className="w-full h-14 sm:h-16 rounded-lg shadow-xl border border-white/10 p-2.5 flex items-center justify-between text-left relative overflow-hidden group-hover:shadow-[0_0_20px_rgba(255,121,198,0.3)] transition"
                          style={{
                            background:
                              book.coverGradient ||
                              'linear-gradient(90deg, #1f1a2e 0%, #100d18 100%)'
                          }}
                        >
                          {/* Faux Page Paper Edge on the side */}
                          <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-r from-amber-100/10 to-amber-100/30 border-l border-black/30 pointer-events-none" />

                          <div className="flex items-center space-x-2.5 min-w-0 pr-4">
                            <span className="text-2xl shrink-0">{book.emoji}</span>
                            <div className="truncate">
                              <h4 className="font-cute font-bold text-xs text-white truncate group-hover:text-[var(--accent-pink)] transition">
                                {book.title}
                              </h4>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">
                                {book.author}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pr-2">
                            <span className="text-[10px] font-mono font-bold text-[var(--accent-pink)]">
                              {percent}%
                            </span>
                            <span className="text-[9px] text-[var(--text-muted)] block uppercase font-mono">
                              {book.type}
                            </span>
                          </div>
                        </div>

                        {/* Quick Delete overlay button on hover */}
                        <button
                          onClick={(e) => onDeleteBook(book.id, e)}
                          className="absolute -top-2 right-1 p-1 rounded-full bg-red-950 text-red-300 border border-red-500/50 opacity-0 group-hover:opacity-100 transition shadow-lg text-[10px] z-10"
                          title="Eliminar de la estantería"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Wooden or Digital 3D THICK Shelf Surface */}
              <div className={`shelf-thick ${shelfClassMap[shelfStyle]} w-full flex items-center justify-between px-4 text-xs shadow-2xl relative select-none mt-2`}>
                <div className="text-[10px] font-mono tracking-widest uppercase opacity-70 text-center select-none font-bold mx-auto text-[var(--text-main)]">
                  ESTANTE {shelfIndex + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}'''

if old_chunk in text:
    text = text.replace(old_chunk, new_chunk)
    print('Replaced chunk successfully.')
else:
    print('Warning: old_chunk not exact match. Attempting fuzzy replace...')
    import re
    # Match from Quick Delete overlay button in spines to end of shelves
    pattern = r'\{\/\* Quick Delete overlay button on hover \*\/\}[\s\S]*?ESTANTE \{shelfIndex \+ 1\}[\s\S]*?<\/div>\s*\}\)\)\s*<\/div>\s*<\/div>\s*\}\)'
    # let's find the exact text
    idx = text.find('ESTANTE {shelfIndex + 1}')
    if idx != -1:
        start_idx = text.rfind('{/* Quick Delete overlay button on hover */}', 0, idx)
        end_idx = text.find('{/* Floating Bottom Upload Banner */}', idx)
        if start_idx != -1 and end_idx != -1:
            text = text[:start_idx] + new_chunk + '\n\n      ' + text[end_idx:]
            print('Replaced by index range successfully.')

with open('src/components/Bookshelf.tsx', 'w') as f:
    f.write(text)
