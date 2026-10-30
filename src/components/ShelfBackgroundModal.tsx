import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Sliders, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Eye, 
  Layers,
  HelpCircle
} from 'lucide-react';
import { ShelfBackgroundConfig } from '../types';

export const DEFAULT_SHELF_BG: ShelfBackgroundConfig = {
  customImage: null,
  presetId: 'default',
  overlayDarkness: 65,
  blur: 0,
  fit: 'cover'
};

// Preset high quality background textures and patterns
export const SHELF_TEXTURE_PRESETS = [
  {
    id: 'default',
    name: 'Gótico Nocturno (Original)',
    desc: 'Fondo negro azabache con gradiente sutil OLED',
    image: null,
    previewStyle: { background: 'linear-gradient(180deg, #120e17 0%, #08060a 100%)' }
  },
  {
    id: 'wood-dark',
    name: 'Madera Roble & Ébano',
    desc: 'Textura de vetas de madera noble oscura',
    image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=1200&q=80',
    previewStyle: { backgroundImage: 'url(https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=300&q=70)', backgroundSize: 'cover' }
  },
  {
    id: 'cozy-library',
    name: 'Biblioteca Crepuscular',
    desc: 'Ambiente cálido de biblioteca clásica entre sombras',
    image: 'https://images.unsplash.com/photo-1507842229452-e93147348914?auto=format&fit=crop&w=1200&q=80',
    previewStyle: { backgroundImage: 'url(https://images.unsplash.com/photo-1507842229452-e93147348914?auto=format&fit=crop&w=300&q=70)', backgroundSize: 'cover' }
  },
  {
    id: 'starry-galaxy',
    name: 'Noche Cósmica Estrellada',
    desc: 'Cielo estrellado místico con nebulosas púrpuras y rosas',
    image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    previewStyle: { backgroundImage: 'url(https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=70)', backgroundSize: 'cover' }
  },
  {
    id: 'marble-obsidian',
    name: 'Mármol Negro Obsidiana',
    desc: 'Mármol pulido oscuro con vetas blancas y doradas',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    previewStyle: { backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=70)', backgroundSize: 'cover' }
  },
  {
    id: 'gothic-pattern',
    name: 'Damasco Gótico Carmesí',
    desc: 'Estampado barroco victoriano con tonos terciopelo oscuro',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    previewStyle: { backgroundImage: 'url(https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=70)', backgroundSize: 'cover' }
  }
];

interface ShelfBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ShelfBackgroundConfig;
  onSaveConfig: (nextConfig: ShelfBackgroundConfig) => void;
}

export const ShelfBackgroundModal: React.FC<ShelfBackgroundModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [currentConfig, setCurrentConfig] = useState<ShelfBackgroundConfig>(config || DEFAULT_SHELF_BG);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Compress & downscale uploaded image using canvas to ensure safe localStorage persistence
  const handleProcessImage = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1400;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            setCurrentConfig((prev) => ({
              ...prev,
              customImage: compressedDataUrl,
              presetId: 'custom'
            }));
          }
        } catch (err) {
          setUploadError('Error al procesar la imagen seleccionada.');
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setUploadError('No se pudo cargar la imagen.');
        setIsProcessingImage(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('Error al leer el archivo desde el dispositivo.');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof SHELF_TEXTURE_PRESETS[0]) => {
    setCurrentConfig((prev) => ({
      ...prev,
      customImage: preset.image,
      presetId: preset.id
    }));
  };

  const handleResetToDefault = () => {
    setCurrentConfig({ ...DEFAULT_SHELF_BG });
  };

  const handleApplyAndClose = () => {
    onSaveConfig(currentConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-pink)] to-[var(--accent-purple)] flex items-center justify-center text-lg shadow-md">
              🖼️
            </span>
            <div>
              <h3 className="dark-reborn-font font-bold text-base sm:text-lg text-[var(--accent-pink)]">
                Fondo Personalizado de Estantería
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Sube tus fotos o elige texturas góticas para el fondo de tu estantería
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Live Preview Box */}
          <div>
            <label className="text-xs font-bold text-white block mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
              <span>Vista Previa en Tiempo Real:</span>
            </label>
            <div className="relative h-32 sm:h-36 rounded-2xl border border-[var(--border-color)] overflow-hidden flex items-end p-3 shadow-inner">
              {/* Background Layer */}
              <div 
                className="absolute inset-0 transition-all duration-300"
                style={{
                  backgroundImage: currentConfig.customImage ? `url(${currentConfig.customImage})` : undefined,
                  backgroundSize: currentConfig.fit === 'cover' ? 'cover' : '300px',
                  backgroundRepeat: currentConfig.fit === 'cover' ? 'no-repeat' : 'repeat',
                  backgroundPosition: 'center',
                  backgroundColor: currentConfig.customImage ? undefined : '#0f0c13',
                  filter: `blur(${currentConfig.blur}px)`
                }}
              />

              {/* Dark Overlay for Book Contrast */}
              <div 
                className="absolute inset-0 transition-colors pointer-events-none"
                style={{
                  backgroundColor: '#000000',
                  opacity: currentConfig.overlayDarkness / 100
                }}
              />

              {/* Mini Shelf Books Simulation */}
              <div className="relative z-10 w-full flex items-end justify-around gap-2 px-2">
                <div className="w-10 h-16 rounded-sm bg-gradient-to-t from-pink-800 to-pink-600 border border-white/20 shadow-lg flex flex-col justify-between p-1">
                  <span className="text-[10px]">🐈‍⬛</span>
                  <div className="h-1 bg-white/40 rounded-full" />
                </div>
                <div className="w-11 h-20 rounded-sm bg-gradient-to-t from-purple-900 to-purple-600 border border-white/20 shadow-lg flex flex-col justify-between p-1">
                  <span className="text-[10px]">🦇</span>
                  <div className="h-1 bg-white/40 rounded-full" />
                </div>
                <div className="w-10 h-14 rounded-sm bg-gradient-to-t from-emerald-900 to-emerald-600 border border-white/20 shadow-lg flex flex-col justify-between p-1">
                  <span className="text-[10px]">🌿</span>
                  <div className="h-1 bg-white/40 rounded-full" />
                </div>
                <div className="w-12 h-18 rounded-sm bg-gradient-to-t from-amber-900 to-amber-600 border border-white/20 shadow-lg flex flex-col justify-between p-1">
                  <span className="text-[10px]">🌙</span>
                  <div className="h-1 bg-white/40 rounded-full" />
                </div>
              </div>

              {/* Mini Shelf Board Simulation */}
              <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-r from-amber-950 via-rose-950 to-amber-950 border-t border-white/30 z-20 shadow-md" />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--accent-pink)] shrink-0" />
              <span>El oscurecimiento asegura que los lomos, portadas y textos siempre sean 100% legibles.</span>
            </p>
          </div>

          {/* Section 1: Upload from Device */}
          <div className="bg-black/40 p-4 rounded-2xl border border-[var(--border-color)]">
            <h4 className="font-bold text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                <span>Subir Foto desde tu Dispositivo</span>
              </span>
              {currentConfig.presetId === 'custom' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-[var(--accent-pink)] border border-pink-500/30 font-bold">
                  Foto Activa
                </span>
              )}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">
              Selecciona cualquier foto personal, fondo de pantalla, ilustración anime o textura desde tu teléfono, tablet o PC.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessImage(file);
              }}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-black font-cute font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isProcessingImage ? 'Optimizando foto...' : 'Elegir Imagen de tu Dispositivo'}</span>
              </button>

              {currentConfig.customImage && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-[var(--border-color)] hover:border-red-400 text-red-300 text-xs transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Quitar Foto</span>
                </button>
              )}
            </div>

            {uploadError && (
              <p className="text-[11px] text-red-400 mt-2 font-medium bg-red-950/40 p-2 rounded-lg border border-red-500/30">
                {uploadError}
              </p>
            )}
          </div>

          {/* Section 2: Curated Texture Presets */}
          <div>
            <label className="text-xs font-bold text-white block mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
              <span>O Elige una Textura de Galería:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SHELF_TEXTURE_PRESETS.map((preset) => {
                const isSelected = currentConfig.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative p-2.5 rounded-xl border text-left transition flex flex-col justify-between h-24 overflow-hidden group ${
                      isSelected
                        ? 'border-[var(--accent-pink)] ring-1 ring-[var(--accent-pink)] bg-black/80'
                        : 'border-[var(--border-color)] bg-black/40 hover:border-white/30'
                    }`}
                  >
                    {/* Background Preview */}
                    <div 
                      className="absolute inset-0 opacity-40 group-hover:opacity-60 transition"
                      style={preset.previewStyle}
                    />
                    <div className="absolute inset-0 bg-black/50" />

                    <div className="relative z-10 flex items-center justify-between w-full">
                      <span className="font-bold text-white text-[11px] truncate drop-shadow">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="relative z-10 text-[9px] text-gray-300 line-clamp-2 drop-shadow">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Fine Adjustment Controls (Darkness, Blur, Fit) */}
          <div className="bg-black/30 p-4 rounded-2xl border border-[var(--border-color)] space-y-4">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
              <span>Ajustes de Nitidez y Contraste</span>
            </h4>

            {/* Overlay Darkness Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-[var(--text-muted)] font-medium">
                  Oscurecimiento del Fondo (Contraste):
                </span>
                <span className="font-mono font-bold text-[var(--accent-pink)]">
                  {currentConfig.overlayDarkness}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={currentConfig.overlayDarkness}
                onChange={(e) =>
                  setCurrentConfig((prev) => ({
                    ...prev,
                    overlayDarkness: Number(e.target.value)
                  }))
                }
                className="w-full accent-[var(--accent-pink)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-0.5">
                <span>Más claro (10%)</span>
                <span>Equilibrado (65%)</span>
                <span>OLED Oscuro (95%)</span>
              </div>
            </div>

            {/* Blur Softness Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-[var(--text-muted)] font-medium">
                  Desenfoque Suave (Profundidad de campo):
                </span>
                <span className="font-mono font-bold text-[var(--accent-pink)]">
                  {currentConfig.blur} px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={currentConfig.blur}
                onChange={(e) =>
                  setCurrentConfig((prev) => ({
                    ...prev,
                    blur: Number(e.target.value)
                  }))
                }
                className="w-full accent-[var(--accent-pink)] cursor-pointer"
              />
            </div>

            {/* Fit mode */}
            <div>
              <span className="text-[var(--text-muted)] font-medium block mb-1.5">
                Modo de escala de la foto:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentConfig((prev) => ({ ...prev, fit: 'cover' }))
                  }
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    currentConfig.fit === 'cover'
                      ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]/20 text-white'
                      : 'border-[var(--border-color)] bg-black/40 text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  🖼️ Cubrir Completo (Cover)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentConfig((prev) => ({ ...prev, fit: 'pattern' }))
                  }
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    currentConfig.fit === 'pattern'
                      ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]/20 text-white'
                      : 'border-[var(--border-color)] bg-black/40 text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  🧩 Mosaico Repetido
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-black/50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Original</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-white bg-black/40 border border-[var(--border-color)] transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyAndClose}
              className="px-5 py-2 rounded-xl text-xs font-cute font-bold bg-[var(--accent-pink)] text-black shadow-lg hover:opacity-90 active:scale-95 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Aplicar a Mi Estantería</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
