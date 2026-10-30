import React, { useState } from 'react';
import { X, CloudRain, Volume2, VolumeX, Sparkles, Sliders } from 'lucide-react';
import { soundscape } from '../utils/audio';

interface AmbientAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioStateChange: (isPlaying: boolean) => void;
}

export const AmbientAudioModal: React.FC<AmbientAudioModalProps> = ({
  isOpen,
  onClose,
  onAudioStateChange
}) => {
  const [rainActive, setRainActive] = useState(soundscape.isRainActive);
  const [purrActive, setPurrActive] = useState(soundscape.isPurrActive);
  const [rainVolume, setRainVolume] = useState(soundscape.rainVolume);
  const [purrVolume, setPurrVolume] = useState(soundscape.purrVolume);

  if (!isOpen) return null;

  const handleToggleRain = () => {
    const nextState = soundscape.toggleRain();
    setRainActive(nextState);
    onAudioStateChange(nextState || purrActive);
  };

  const handleTogglePurr = () => {
    const nextState = soundscape.togglePurr();
    setPurrActive(nextState);
    onAudioStateChange(rainActive || nextState);
  };

  const handleChangeRainVol = (val: number) => {
    setRainVolume(val);
    soundscape.setRainVolume(val);
  };

  const handleChangePurrVol = (val: number) => {
    setPurrVolume(val);
    soundscape.setPurrVolume(val);
  };

  const handleStopAll = () => {
    soundscape.stopAll();
    setRainActive(false);
    setPurrActive(false);
    onAudioStateChange(false);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl relative modal-animate">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-pink)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-5">
          <h3 className="dark-reborn-font font-bold text-lg text-[var(--accent-pink)] flex items-center justify-center gap-2">
            <span>🌧️</span> Sonidos de Ambiente Lo-Fi
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Generador acústico relajante integrado para sesiones de lectura
          </p>
        </div>

        {/* Channels */}
        <div className="space-y-4">
          {/* Channel 1: Gothic Rain */}
          <div className="bg-black/40 border border-[var(--border-color)] p-3.5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌧️</span>
                <div>
                  <h4 className="font-bold text-xs text-white">Lluvia Gótica</h4>
                  <p className="text-[10px] text-[var(--text-muted)]">Gotas suaves en vitrales</p>
                </div>
              </div>
              <button
                onClick={handleToggleRain}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  rainActive
                    ? 'bg-[var(--accent-pink)] text-black'
                    : 'bg-black/60 border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white'
                }`}
              >
                {rainActive ? 'Activo' : 'Activar'}
              </button>
            </div>
            {rainActive && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                <Volume2 className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={rainVolume}
                  onChange={(e) => handleChangeRainVol(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent-pink)] h-1.5 cursor-pointer bg-black/60 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Channel 2: Cat Purr */}
          <div className="bg-black/40 border border-[var(--border-color)] p-3.5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐈‍⬛</span>
                <div>
                  <h4 className="font-bold text-xs text-white">Ronroneo Neko</h4>
                  <p className="text-[10px] text-[var(--text-muted)]">Vibración cálida felina</p>
                </div>
              </div>
              <button
                onClick={handleTogglePurr}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  purrActive
                    ? 'bg-[var(--accent-purple)] text-black'
                    : 'bg-black/60 border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white'
                }`}
              >
                {purrActive ? 'Activo' : 'Activar'}
              </button>
            </div>
            {purrActive && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                <Volume2 className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={purrVolume}
                  onChange={(e) => handleChangePurrVol(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent-purple)] h-1.5 cursor-pointer bg-black/60 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)]">
            Funciona offline y sin descargar archivos.
          </span>
          {(rainActive || purrActive) && (
            <button
              onClick={handleStopAll}
              className="text-xs text-red-400 hover:underline font-semibold"
            >
              Silenciar todo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
