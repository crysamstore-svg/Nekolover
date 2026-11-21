import {
  ShelfBookendId,
  ShelfDecorConfig,
  ShelfDecorPropId,
  ShelfDecorTheme,
} from '../types';

export interface ShelfDecorCatalogItem {
  id: ShelfDecorPropId;
  category: Exclude<ShelfDecorTheme, 'none'>;
  name: string;
  subtitle: string;
  reaction: string;
  accentColor: string;
}

export interface ShelfBookendCatalogItem {
  id: Exclude<ShelfBookendId, 'none'>;
  category: Exclude<ShelfDecorTheme, 'none'>;
  name: string;
  subtitle: string;
  reaction: string;
  accentColor: string;
}

export interface ShelfDecorPreset {
  id: Exclude<ShelfDecorTheme, 'none'>;
  name: string;
  shortLabel: string;
  subtitle: string;
  description: string;
  props: ShelfDecorPropId[];
  bookend: ShelfBookendId;
  ledGlow: boolean;
  hangingVines: boolean;
  cardAccent: string;
}

export const SHELF_BOOKEND_CATALOG: ShelfBookendCatalogItem[] = [
  {
    id: 'readers-silhouette',
    category: 'kawaii',
    name: 'Lectores en Silueta',
    subtitle: 'Pareja leyendo con base negra',
    reaction: 'Dos lectores incansables sosteniendo tu fila favorita.',
    accentColor: '#f9a8d4',
  },
  {
    id: 'fairy-wings',
    category: 'fantasy',
    name: 'Alas de Hada',
    subtitle: 'Madera cálida y vitral ámbar',
    reaction: 'Alas translúcidas brillando con magia del bosque.',
    accentColor: '#fbbf24',
  },
  {
    id: 'crimson-hands',
    category: 'dark',
    name: 'Manos Cuerda Carmesí',
    subtitle: 'Manos atadas con cuerda carmesí',
    reaction: 'Manos atadas con cuerda carmesí resguardando tus tomos oscuros.',
    accentColor: '#e11d48',
  },
];

export const SHELF_DECOR_PRESETS: ShelfDecorPreset[] = [
  {
    id: 'kawaii',
    name: 'Kawaii Cozy',
    shortLabel: 'Kawaii',
    subtitle: 'Luz cálida, café y hiedra',
    description:
      'Nicho Café Soleado, sujetalibros de lectores, lámpara nube, tulipanes, mini radio pastel, conejita y osito.',
    props: [
      'kawaii-sunshine-cafe',
      'kawaii-cloud-lamp',
      'kawaii-tulips-vase',
      'kawaii-retro-radio',
      'kawaii-bunny-bear',
      'kawaii-moon-lamp',
    ],
    bookend: 'readers-silhouette',
    ledGlow: true,
    hangingVines: true,
    cardAccent: '#f9a8d4',
  },
  {
    id: 'fantasy',
    name: 'Fantasía Celestial',
    shortLabel: 'Fantasía',
    subtitle: 'Arcos mágicos, dragón y caballero',
    description:
      'Sujetalibros Alas de Hada, Dragón con libro dorado, Nicho Arco Estelar, Caballero Lector, farol y gato negro.',
    props: [
      'fantasy-reading-dragon',
      'fantasy-arch-nook',
      'fantasy-reading-knight',
      'fantasy-lantern',
      'fantasy-black-cat',
      'fantasy-moon-potion',
    ],
    bookend: 'fairy-wings',
    ledGlow: true,
    hangingVines: true,
    cardAccent: '#fbbf24',
  },
  {
    id: 'dark',
    name: 'Dark Romance',
    shortLabel: 'Dark',
    subtitle: 'Portales góticos, dagas y rosas',
    description:
      'Sujetalibros Cuerda Carmesí, Portal de Calaveras, Daga entre Rosas, Nicho Mansión y Rosa y velas negras.',
    props: [
      'dark-skull-portal',
      'dark-dagger-roses',
      'dark-manor-nook',
      'dark-crimson-roses',
      'dark-masquerade-mask',
      'dark-candles',
    ],
    bookend: 'crimson-hands',
    ledGlow: true,
    hangingVines: true,
    cardAccent: '#fb7185',
  },
];

export const SHELF_DECOR_CATALOG: ShelfDecorCatalogItem[] = [
  // 1. KAWAII COZY
  {
    id: 'kawaii-sunshine-cafe',
    category: 'kawaii',
    name: 'Nicho Café Soleado',
    subtitle: 'Book nook casita café con gatito',
    reaction: 'Café recién hecho y un gatito amarillo dormitando entre libros.',
    accentColor: '#fde68a',
  },
  {
    id: 'kawaii-cloud-lamp',
    category: 'kawaii',
    name: 'Lámpara Nube',
    subtitle: 'Luz cálida suave',
    reaction: 'Nube luminosa: ilumina tu rincón de lectura con calma.',
    accentColor: '#fde68a',
  },
  {
    id: 'kawaii-tulips-vase',
    category: 'kawaii',
    name: 'Tulipanes Pastel',
    subtitle: 'Jarrón con lazo vichy',
    reaction: 'Tulipanes frescos: aroma primaveral junto a tus libros.',
    accentColor: '#f9a8d4',
  },
  {
    id: 'kawaii-retro-radio',
    category: 'kawaii',
    name: 'Mini Radio Rosa',
    subtitle: 'Altavoz vintage',
    reaction: 'Radio pastel: sintonizando melodías suaves de lluvia y café.',
    accentColor: '#f472b6',
  },
  {
    id: 'kawaii-bunny-bear',
    category: 'kawaii',
    name: 'Conejita y Osito',
    subtitle: 'Figuras de cerámica',
    reaction: 'Compañeros pastel cuidando tus capítulos favoritos.',
    accentColor: '#fbcfe8',
  },
  {
    id: 'kawaii-quote-frame',
    category: 'kawaii',
    name: 'Cuadro Pastel',
    subtitle: 'Little by little',
    reaction: 'Poco a poco, página a página, cada historia deja huella.',
    accentColor: '#ddd6fe',
  },
  {
    id: 'kawaii-moon-lamp',
    category: 'kawaii',
    name: 'Lámpara Luna',
    subtitle: 'Sobre base de madera',
    reaction: 'Luna llena dorada lista para acompañar lecturas nocturnas.',
    accentColor: '#fcd34d',
  },

  // 2. FANTASÍA CELESTIAL
  {
    id: 'fantasy-arch-nook',
    category: 'fantasy',
    name: 'Nicho Arco Estelar',
    subtitle: 'Book nook montaña y aldea nocturna',
    reaction: 'Un portal iluminado hacia la ciudad bajo las estrellas.',
    accentColor: '#fbbf24',
  },
  {
    id: 'fantasy-reading-dragon',
    category: 'fantasy',
    name: 'Dragón Lector',
    subtitle: 'Obsidiana con tomo dorado',
    reaction: 'Tu dragón de obsidiana devora otro capítulo épico.',
    accentColor: '#fcd34d',
  },
  {
    id: 'fantasy-reading-knight',
    category: 'fantasy',
    name: 'Caballero Lector',
    subtitle: 'Armadura plateada en descanso',
    reaction: 'Hasta el guardián del reino se detiene a leer una página más.',
    accentColor: '#cbd5e1',
  },
  {
    id: 'fantasy-cat-lamp',
    category: 'fantasy',
    name: 'Gatito Luminoso',
    subtitle: 'Lámpara mágica',
    reaction: 'Neko de luz cálida velando tus noches entre páginas.',
    accentColor: '#fde68a',
  },
  {
    id: 'fantasy-lantern',
    category: 'fantasy',
    name: 'Farol Encantado',
    subtitle: 'Vela de hierro forjado',
    reaction: 'La llama del farol parpadea al abrir un nuevo capítulo.',
    accentColor: '#f59e0b',
  },
  {
    id: 'fantasy-cottage',
    category: 'fantasy',
    name: 'Casita del Bosque',
    subtitle: 'Miniatura iluminada',
    reaction: 'Ventanitas cálidas brillando en el rincón encantado.',
    accentColor: '#fdba74',
  },
  {
    id: 'fantasy-ghost-frame',
    category: 'fantasy',
    name: 'Cuadro Celestial',
    subtitle: 'Better Things Ahead',
    reaction: 'Las estrellas anuncian mejores capítulos por venir.',
    accentColor: '#c4b5fd',
  },
  {
    id: 'fantasy-black-cat',
    category: 'fantasy',
    name: 'Gato Negro y Otoño',
    subtitle: 'Guardián nocturno',
    reaction: 'Tu gato negro vigila la estantería con ojos dorados.',
    accentColor: '#fbbf24',
  },
  {
    id: 'fantasy-moon-potion',
    category: 'fantasy',
    name: 'Luna y Pócima',
    subtitle: 'Orbe astral',
    reaction: 'Brillo lunar embotellado para mundos de fantasía.',
    accentColor: '#a78bfa',
  },

  // 3. DARK ROMANCE & GÓTICO
  {
    id: 'dark-skull-portal',
    category: 'dark',
    name: 'Portal de Calaveras',
    subtitle: 'Book nook gótico con cuervo',
    reaction: 'El umbral sombrío aguarda a quienes cruzan el bosque.',
    accentColor: '#fbbf24',
  },
  {
    id: 'dark-dagger-roses',
    category: 'dark',
    name: 'Daga entre Rosas',
    subtitle: 'Hoja ondulada y rosas de terciopelo',
    reaction: 'Amor y peligro entrelazados entre pétalos carmesí.',
    accentColor: '#e11d48',
  },
  {
    id: 'dark-manor-nook',
    category: 'dark',
    name: 'Nicho Mansión y Rosa',
    subtitle: 'Book nook figura en sombra',
    reaction: 'Una rosa carmesí frente a la mansión iluminada en penumbra.',
    accentColor: '#f43f5e',
  },
  {
    id: 'dark-masquerade-mask',
    category: 'dark',
    name: 'Máscara Nocturna',
    subtitle: 'Filigrana gótica',
    reaction: 'Elegancia teatral entre secretos y romance oscuro.',
    accentColor: '#e2e8f0',
  },
  {
    id: 'dark-crimson-roses',
    category: 'dark',
    name: 'Rosas Carmesí',
    subtitle: 'Jarrón de obsidiana',
    reaction: 'Pétalos aterciopelados de rosa negra y carmesí.',
    accentColor: '#fb7185',
  },
  {
    id: 'dark-skull-coffin',
    category: 'dark',
    name: 'Cráneo y Relicario',
    subtitle: 'Mini ataúd y cristal',
    reaction: 'Reliquia dark romance para tus historias más intensas.',
    accentColor: '#fda4af',
  },
  {
    id: 'dark-crescent-moon',
    category: 'dark',
    name: 'Media Luna Tallada',
    subtitle: 'Escultura metálica',
    reaction: 'Bronce y plata lunar forjados para noches sin fin.',
    accentColor: '#cbd5e1',
  },
  {
    id: 'dark-noir-frame',
    category: 'dark',
    name: 'Cuadro Midnight',
    subtitle: 'Lámina gótica',
    reaction: 'Lámina vintage de club secreto bajo la penumbra.',
    accentColor: '#f43f5e',
  },
  {
    id: 'dark-candles',
    category: 'dark',
    name: 'Velas de Obsidiana',
    subtitle: 'Cera negra y carmesí',
    reaction: 'Llamas oscuras iluminando tu biblioteca nocturnal.',
    accentColor: '#fb7185',
  },
];

export const DEFAULT_SHELF_DECOR: ShelfDecorConfig = {
  theme: 'kawaii',
  enabledProps: [...SHELF_DECOR_PRESETS[0].props],
  bookend: SHELF_DECOR_PRESETS[0].bookend,
  ledGlow: true,
  hangingVines: true,
};

export function getPresetByTheme(theme: ShelfDecorTheme): ShelfDecorPreset | undefined {
  if (theme === 'none') return undefined;
  return SHELF_DECOR_PRESETS.find((p) => p.id === theme);
}

export function isValidShelfDecorProp(id: string): id is ShelfDecorPropId {
  return SHELF_DECOR_CATALOG.some((item) => item.id === id);
}

export function isValidShelfBookend(id: string): id is ShelfBookendId {
  return (
    id === 'none' || SHELF_BOOKEND_CATALOG.some((item) => item.id === id)
  );
}
