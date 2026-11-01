import { Book, Quote, ThemeOption, FontOption, PageSticker, ReaderModeOption } from '../types';

export const READER_MODES: ReaderModeOption[] = [
  {
    id: 'dark-oled',
    name: 'OLED Gótico',
    bg: '#0c0914',
    text: '#e8dcff',
    accent: '#ff79c6'
  },
  {
    id: 'vanilla-fresa',
    name: 'Vainilla Fresa',
    bg: '#24141f',
    text: '#ffeef2',
    accent: '#ff85a2'
  },
  {
    id: 'sepia-pergamino',
    name: 'Pergamino Sepia',
    bg: '#201a15',
    text: '#f2e8d5',
    accent: '#eab308'
  },
  {
    id: 'azul-abisal',
    name: 'Azul Abisal',
    bg: '#060913',
    text: '#d8e7ff',
    accent: '#80b3ff'
  },
  {
    id: 'papel-dia',
    name: 'Papel Día',
    bg: '#f6f1e8',
    text: '#1a1424',
    accent: '#d946ef'
  }
];

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'kawaii-dark',
    name: 'Kawaii Dark (Neko Goth)',
    subtitle: 'Morado Neón & Rosa Gótico',
    icon: '🖤',
    primary: '#ff79c6',
    card: '#1a1726',
    accent: '#bd93f9'
  },
  {
    id: 'vanilla-fresa',
    name: 'Vainilla Fresa',
    subtitle: 'Crema Pastel & Fresa Dulce Gótico',
    icon: '🍓',
    primary: '#ff85a2',
    card: '#2d1a25',
    accent: '#fce1e4'
  },
  {
    id: 'nocturno',
    name: 'Nocturno Ultra Dark',
    subtitle: 'Azul Noche & Plata OLED',
    icon: '🌙',
    primary: '#80b3ff',
    card: '#0b0f19',
    accent: '#a8c8fb'
  },
  {
    id: 'brujita-lavanda',
    name: 'Brujita Lavanda',
    subtitle: 'Amatista Místico & Hechizo Crepúsculo',
    icon: '🔮',
    primary: '#c084fc',
    card: '#1a142b',
    accent: '#e9d5ff'
  },
  {
    id: 'carmesi-vampiro',
    name: 'Carmesí Vampiro',
    subtitle: 'Terciopelo Escarlata & Rosas Negras',
    icon: '🥀',
    primary: '#f43f5e',
    card: '#210c12',
    accent: '#fda4af'
  }
];

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'sans',
    name: 'Quicksand',
    family: "'Quicksand', sans-serif",
    category: 'Kawaii Limpia & Moderna',
    preview: 'El gatito caminaba entre las sombras con patitas suaves.'
  },
  {
    id: 'cute',
    name: 'Fredoka',
    family: "'Fredoka', cursive",
    category: 'Cozy Kawaii Rounded',
    preview: '¡Una taza de té de fresa para leer bajo la lluvia!'
  },
  {
    id: 'reborn',
    name: 'Cinzel Decorative',
    family: "'Cinzel Decorative', serif",
    category: 'Dark Reborn Gótico Real',
    preview: 'LAS SOMBRAS ETERNAS DEL CASTILLO NEKO.'
  },
  {
    id: 'pirata',
    name: 'Pirata One',
    family: "'Pirata One', serif",
    category: 'Vikingo & Fantasía Dark',
    preview: 'Navegando el mar de tinta con garras afiladas.'
  },
  {
    id: 'gothic',
    name: 'UnifrakturMaguntia',
    family: "'UnifrakturMaguntia', cursive",
    category: 'Old Goth Calligraphy',
    preview: 'Gothische Geheimnisse der Katzenliebe.'
  },
  {
    id: 'creepster',
    name: 'Creepster',
    family: "'Creepster', cursive",
    category: 'Horror & Dulzura Espeluznante',
    preview: 'Pesadillas rosas y misterios de medianoche.'
  },
  {
    id: 'serif_classic',
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'Clásica Novela Romántica',
    preview: 'En el salón iluminado solo por la tenue luz de las velas.'
  },
  {
    id: 'lora',
    name: 'Lora',
    family: "'Lora', serif",
    category: 'Serif Cómoda para Lectura Larga',
    preview: 'La textura del papel susurraba historias olvidadas.'
  }
];

export const KAWAII_STICKERS: string[] = [
  // 1-20: Gratuitos
  '🐈‍⬛', '🐾', '🍓', '🧁', '🦇', '💀', '🖤', '🎀',
  '🧪', '🕯️', '🔮', '✨', '☕', '🗡️', '🥀', '🌙',
  '🐱', '🍩', '🩸', '🕸️',
  // 21+: Exclusivos VIP
  '🧸', '🪓', '🕷️', '🏰', '👑', '💎', '🍷', '🎭',
  '🍰', '🪶', '🗝️', '🥞', '🐺', '🪐', '🍬', '⚡'
];

export const DEFAULT_BOOKS: Book[] = [
  {
    id: 'demo-neko-1',
    title: 'El Gato Negro & Las Sombras Kawaii',
    author: 'Sora Neko',
    category: 'reading',
    favorite: true,
    emoji: '🐈‍⬛',
    type: 'demo',
    coverGradient: 'from-pink-900/60 via-purple-950 to-black',
    currentPage: 1,
    totalPages: 5,
    progressPercent: 20,
    addedAt: Date.now() - 86400000 * 3,
    lastReadAt: Date.now() - 3600000,
    content: [
      `En una vieja mansión de altos tejados oscuros y balcones victorianos, un pequeño gato negro abría lentamente sus ojos color amatista.

El cielo de octubre teñía los vitrales con reflejos magenta y violeta. Nadie sabía cuántos siglos llevaba la biblioteca en pie, pero entre sus estantes de caoba pulida yacían grimorios encuadernados en terciopelo y cuadernos de poesía que aún conservaban el dulce aroma a vainilla y frutos rojos.

—Miau... —susurró el felino, apoyando una patita afelpada sobre el lomo de un libro sellado con un lazo de seda fucsia.

Aquella noche, las campanas de la torre no anunciaban soledad ni frío; anunciaban que la magia del renacer oscuro acababa de comenzar.`,

      `Las sombras en este lugar no eran temibles ni siniestras; se movían como caricias de terciopelo, dejando a su paso chispas de luz tenue y polvo de estrellas.

El gatito recorrió el pasillo flotando casi sin peso sobre alfombras de encaje negro. En la chimenea danzaban llamas de color lila suave, mientras en la mesita de té humeaba una taza de porcelana con infusión de fresas silvestres y canela.

"Quien busca la belleza en la oscuridad jamás teme a la noche", rezaba una inscripción grabada en letras góticas doradas sobre el marco del gran espejo.`,

      `Al acercarse a la gran estantería del ala norte, una melodía invisible resonó en el aire: el suave tintineo de gotas de lluvia golpeando los cristales de la ventana alta, acompañado por un ronroneo hondo y reconfortante.

El pequeño neko saltó sobre el alféizar y miró hacia el jardín: entre los rosales de rosas negras brotaban capullos de un fucsia encendido, y pequeñas mariposas nocturnas revoloteaban como pétalos en vuelo.

—Este es tu refugio —parecía susurrar el viento entre las hojas secas—. Aquí cada palabra leída florece en tu corazón.`,

      `¡Bienvenido a NekoLover Read! 🐾🖤

Esta biblioteca mágica ha sido forjada para amantes de la estética Kawaii Dark y la literatura. Aquí podrás:
• Subir y leer tus libros favoritos en formato EPUB y PDF directamente desde tu dispositivo.
• Personalizar la tipografía con estilos Dark Reborn como Cinzel, Pirata One, Unifraktur y clásicos de lectura como Quicksand o Lora.
• Pegar stickers movibles sobre cualquier página con solo tocarlos y arrastrarlos con el dedo o ratón.
• Subrayar y guardar citas memorables con reflexiones personales en el Baúl de Notas.
• Sumergirte en la lectura con sonido ambiental de Lluvia Gótica y Ronroneo de Gato Neko.`,

      `Y así, con una taza tibia de té dulce y un buen libro entre las manos, la noche se vuelve un santuario de paz y misterio.

Las páginas esperan tus ojos, y los gatos de la sombra velarán por tus sueños mientras te sumerges en nuevas aventuras.

"Que tus lecturas sean eternas y tus sueños, tan dulces como la vainilla y profundos como la noche estrellada." 🖤🐾🦇`
    ]
  },
  {
    id: 'demo-carmilla-2',
    title: 'Carmilla (Edición Rosa Oscura)',
    author: 'J. Sheridan Le Fanu',
    category: 'reading',
    favorite: true,
    emoji: '🦇',
    type: 'demo',
    coverGradient: 'from-rose-950 via-purple-950 to-black',
    currentPage: 1,
    totalPages: 4,
    progressPercent: 25,
    addedAt: Date.now() - 86400000 * 5,
    lastReadAt: Date.now() - 7200000,
    content: [
      `En Styria nos encontramos con un castillo antiquísimo, rodeado de bosques de pinos que se mecían al compás de tempestades melancólicas.

Yo era muy joven entonces, y la soledad del schloss sólo era mitigada por mis paseos entre las ruinas del antiguo puente levadizo, donde las glicinas moradas caían como cascadas de encaje.

Fue durante una noche de luna llena cuando un carruaje volcó estrepitosamente en el camino de grava, trayendo consigo a la huésped más fascinante y misteriosa que jamás hubiese cruzado nuestro umbral: Carmilla.`,

      `Era de una belleza sobrecogedora y lánguida. Su cabello castaño oscuro caía en ondas opulentas hasta su cintura, y sus ojos oscuros brillaban con una intensidad hipnótica que parecía encender un fuego dulce en mi pecho.

—Querida mía —me decía a menudo con su voz melodiosa, tomándome las manos entre las suyas, tan frías como la porcelana fina—, tú y yo estábamos destinadas a encontrarnos. Vivirás en mí, y yo moriré por ti.

Sus palabras eran a la vez una caricia y un enigma que me estremecía de dulzura.`,

      `Pasábamos las tardes en el salón este, contemplando los cuadros de antepasados cuyas miradas parecían seguir cada uno de nuestros movimientos. Carmilla apenas probaba bocado, pero bebía pequeños sorbos de jarabe carmesí de copas de cristal cortado.

A menudo me susurraba confidencias que parecían recuerdos de siglos pasados, hablando de bailes celebrados en cortes olvidadas y de reinas que se adornaban con perlas y lazos de seda negra.

Su respiración era tan suave que a veces creía estar al lado de un ángel caído... o de una sombra enamorada.`,

      `Cuando la luna alcanzaba su cenit sobre la torre del homenaje, un murmullo semejante al aleteo de murciélagos terciopelo cruzaba los corredores.

Carmilla se despedía con un beso en mi mejilla que dejaba una huella ardiente y helada a la vez.

—Buenas noches, mi dulce compañera —decía con una sonrisa que dejaba entrever dos colmillitos diminutos y perfectos—. Sueña conmigo, pues las sombras siempre guardan el secreto de los corazones que laten al unísono.`
    ]
  },
  {
    id: 'demo-alicia-3',
    title: 'Alicia en el Laberinto de Sombras',
    author: 'Lewis Carroll (Edición Neko)',
    category: 'unread',
    favorite: false,
    emoji: '☕',
    type: 'demo',
    coverGradient: 'from-violet-950 via-pink-950 to-black',
    currentPage: 1,
    totalPages: 3,
    progressPercent: 0,
    addedAt: Date.now() - 86400000 * 2,
    content: [
      `La tetera humeaba desprendiendo un vapor aromático con olor a moras silvestres y lavanda confitada.

Sobre la mesa del sombrerero, docenas de tazas de té victoriano temblaban al compás de un reloj que marchaba hacia atrás. Alicia contempló al Gato de Cheshire, cuyas rayas no eran comunes, sino de un resplandeciente tono lila y fucsia.

—¿Podrías decirme, por favor, qué camino debo tomar desde aquí? —preguntó la muchacha con cortesía.`,

      `—Eso depende en gran medida de adónde quieras ir —dijo el Gato con una sonrisa tan ancha que parecía iluminar la penumbra del bosque de hongos luminiscentes.

—No me importa mucho el lugar... —respondió Alicia.

—Entonces no importa qué camino elijas —replicó el minino, desvaneciéndose en el aire hasta dejar únicamente su par de ojos resplandecientes y una sonrisa pícara—. Siempre se llega a alguna parte si se camina lo suficiente, especialmente si llevas un buen libro en el bolsillo.`,

      `Alicia sonrió y abrió su libro forrado en seda negra. Cada página revelaba acertijos que sólo podían descifrarse al compás del tictac del corazón.

El Gato reapareció brevemente sobre la rama de un sauce llorón, lamiéndose una pata con elegancia de terciopelo.

—Todos estamos un poco locos aquí, pequeña lectora —ronroneó—. Pero las mejores personas son las que aman las historias en la medianoche.`
    ]
  },
  {
    id: 'demo-poemas-4',
    title: 'Poemas de la Noche & Cuervos Dulces',
    author: 'Edgar Allan Poe & Poetas Góticos',
    category: 'completed',
    favorite: true,
    emoji: '🥀',
    type: 'demo',
    coverGradient: 'from-slate-900 via-purple-950 to-black',
    currentPage: 3,
    totalPages: 3,
    progressPercent: 100,
    addedAt: Date.now() - 86400000 * 8,
    lastReadAt: Date.now() - 86400000,
    content: [
      `EL CUERVO & EL GATO DE TERCIOPELO

Una vez, en una medianoche mustia y taciturna,
mientras meditaba débil y cansado
sobre un curioso y raro volumen de olvidadas historias,
mientras cabeceaba, casi dormido,
escuché de pronto un suave ronroneo en el cristal de mi ventana.

No era el viento, ni el lamento de un alma en pena;
era un minino negro de patitas blancas,
con un lazo escarlata al cuello y ojos como dos brasas de topacio.`,

      `ANNABEL LEE EN EL REINO JUNTO AL MAR

Fue hace muchos y muchos años,
en un reino junto al mar bravío,
donde vivía una doncella a quien tal vez conozcáis
por el nombre de Annabel Lee.

Y esta doncella no vivía con otro pensamiento
que el de amar y ser amada por mí.
Éramos dos niños en este reino junto al mar,
pero nos amábamos con un amor que era más que amor;
yo y mi hermosa dama de ojos de medianoche y corazón de fresa.`,

      `A HELENA & LA LUZ DE LAS VELAS

Helena, tu belleza es para mí
como aquellas barcas de Nicea de antaño,
que sobre un mar perfumado y sereno
llevaban al peregrino rendido
a su propia costa natal.

En la ventana iluminada por tenues cirios de cera lila,
tu silueta estatutaria me contempla en la penumbra,
sosteniendo una lámpara de ágata en la mano marmórea...
¡Ah, Psique, que regresas de los dominios de la noche bendita!`
    ]
  }
];

export const DEFAULT_QUOTES: Quote[] = [
  {
    id: 'q-demo-1',
    bookId: 'demo-neko-1',
    bookTitle: 'El Gato Negro & Las Sombras Kawaii',
    chapter: 'Cap. 1 - Pág. 2',
    emotion: '🖤 Dark Reborn',
    text: 'Quien busca la belleza en la oscuridad jamás teme a la noche; las sombras aquí no eran frías, olían a vainilla, fresa y misterios góticos.',
    comment: 'Frase insignia de NekoLover Read. Hermosa mezcla de dulzura y misterio.',
    createdAt: Date.now() - 3600000 * 4
  },
  {
    id: 'q-demo-2',
    bookId: 'demo-carmilla-2',
    bookTitle: 'Carmilla (Edición Rosa Oscura)',
    chapter: 'Cap. 2 - Pág. 2',
    emotion: '🍓 Vainilla Fresa',
    text: 'Tú y yo estábamos destinadas a encontrarnos. Vivirás en mí, y yo moriré por ti.',
    comment: 'Intensidad romántica gótica pura. La estética de Carmilla es perfecta.',
    createdAt: Date.now() - 3600000 * 12
  },
  {
    id: 'q-demo-3',
    bookId: 'demo-alicia-3',
    bookTitle: 'Alicia en el Laberinto de Sombras',
    chapter: 'Pág. 3',
    emotion: '🦇 Oscuro',
    text: 'Todos estamos un poco locos aquí, pequeña lectora. Pero las mejores personas son las que aman las historias en la medianoche.',
    comment: 'El Gato de Cheshire nunca falla con su sabiduría enigmática.',
    createdAt: Date.now() - 3600000 * 24
  }
];

export const DEFAULT_STICKERS: Record<string, PageSticker[]> = {
  'demo-neko-1-p1': [
    { id: 'stk-1', emoji: '🐈‍⬛', x: 42, y: 38, scale: 1, rotation: -6 },
    { id: 'stk-2', emoji: '🎀', x: 120, y: 32, scale: 0.9, rotation: 8 },
    { id: 'stk-3', emoji: '✨', x: 260, y: 70, scale: 0.85, rotation: 12 }
  ],
  'demo-neko-1-p4': [
    { id: 'stk-4', emoji: '🐾', x: 50, y: 50, scale: 1, rotation: 0 },
    { id: 'stk-5', emoji: '🖤', x: 180, y: 40, scale: 1.1, rotation: -10 }
  ]
};
