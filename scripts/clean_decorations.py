with open('src/components/Bookshelf.tsx', 'r') as f:
    text = f.read()

import re

# Remove any remaining ShelfDecoration blocks
text = re.sub(r'\{\/\* Companions on shelf: Dragones Rosas[\s\S]*?\)\(\)\s*\}\s*\)', '', text)
text = re.sub(r'\{\/\* Companion Bookend at end of row \*\/\}[\s\S]*?<\/div>\s*\}\)', '', text)
text = re.sub(r'\{showDecorations && \([\s\S]*?<ShelfDecoration[\s\S]*?<\/div>\s*\}\)', '', text)
text = re.sub(r'\{showDecorations && \([\s\S]*?<ShelfDecoration[\s\S]*?<\/div>\s*\}', '', text)
text = re.sub(r'\{showDecorations &&[\s\S]*?<ShelfDecoration[\s\S]*?\)\(\)\s*\}\s*\}', '', text)

# Just in case, clean up any remaining ShelfDecoration occurrences
lines = text.split('\n')
new_lines = []
skip = False
for line in lines:
    if 'ShelfDecoration' in line:
        continue
    new_lines.append(line)

text = '\n'.join(new_lines)

# Clean up empty slots or decorationPool if still present
text = re.sub(r'const emptySlots = 4 - shelfBooks\.length;[\s\S]*?return decorationPool[\s\S]*?\)\(\)\s*\}?', '', text)

with open('src/components/Bookshelf.tsx', 'w') as f:
    f.write(text)

print('Cleaned all ShelfDecoration.')
