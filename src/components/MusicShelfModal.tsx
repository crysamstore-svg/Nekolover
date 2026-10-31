import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Trash2, 
  Music, 
  Disc, 
  Sparkles,
  Headphones,
  Check
} from 'lucide-react';
import { MusicTrack } from '../types';
import { musicPlayer } from '../utils/musicManager';

interface MusicShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

export const MusicShelfModal: React.FC<MusicShelfModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [tracks, setTracks] = useState<MusicTrack[]>(() => musicPlayer.getTracks());
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(musicPlayer.currentTrack);
  const [isPlaying, setIsPlaying] = useState<boolean>(musicPlayer.isPlaying);
  const [volume, setVolume] = useState<number>(musicPlayer.volume);
  const [currentTime, setCurrentTime] = useState<number>(musicPlayer.currentTime);
  const [duration, setDuration] = useState<number>(musicPlayer.duration);
  const [isLoop, setIsLoop] = useState<boolean>(musicPlayer.isLoop);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to musicPlayer state
  useEffect(() => {
    const unsubscribe = musicPlayer.subscribe(() => {
      setTracks(musicPlayer.getTracks());
      setCurrentTrack(musicPlayer.currentTrack);
      setIsPlaying(musicPlayer.isPlaying);
      setVolume(musicPlayer.volume);
      setCurrentTime(musicPlayer.currentTime);
      setDuration(musicPlayer.duration);
      setIsLoop(musicPlayer.isLoop);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
        continue;
      }
      try {
        const newTrack = await musicPlayer.uploadCustomTrack(file);
        uploadedCount++;
        // If nothing is playing, play the newly uploaded track
        if (!musicPlayer.isPlaying) {
          musicPlayer.playTrack(newTrack);
        }
      } catch (err) {
        console.error('Error al subir audio:', err);
      }
    }

    setIsUploading(false);
    if (uploadedCount > 0) {
      onToast?.(`🎵 ${uploadedCount} canción${uploadedCount > 1 ? 'es' : ''} añadida(s) a la Estantería de Música`);
    } else {
      onToast?.('Selecciona archivos de audio válidos (MP3, WAV, OGG, M4A)');
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    musicPlayer.setVolume(newVol);
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const customTracks = tracks.filter(t => t.isCustom);
  const presetTracks = tracks.filter(t => !t.isCustom);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl relative modal-animate flex flex-col max-h-[90vh]">
        {/* Hidden Audio File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFileUpload(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[var(--accent-purple)] to-[var(--accent-pink)] flex items-center justify-center shadow-lg text-lg">
              🎵
            </div>
            <div>
              <h3 className="dark-reborn-font font-bold text-base sm:text-lg text-[var(--accent-pink)] flex items-center gap-2">
                <span>Estantería de Música</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-[var(--accent-purple)] border border-purple-500/40">
                  Lectura Sonora
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                La música continúa sonando en segundo plano mientras lees tus libros
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Now Playing Bar & Volume Control Card */}
        <div className="bg-black/60 border border-[var(--border-color)] rounded-2xl p-3.5 sm:p-4 mb-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
            {/* Track Info */}
            <div className="flex items-center gap-3 w-full sm:w-auto truncate">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500/30 via-purple-600/30 to-black border border-[var(--accent-pink)]/40 flex items-center justify-center text-xl shrink-0 ${
                isPlaying ? 'animate-pulse shadow-[0_0_15px_rgba(255,121,198,0.3)]' : ''
              }`}>
                {currentTrack?.type?.startsWith('soundscape') ? '🌧️' : '💿'}
              </div>
              <div className="truncate flex-1">
                <span className="text-[10px] text-[var(--accent-pink)] font-bold uppercase tracking-wider block">
                  {isPlaying ? '▶ Sonando mientras lees' : '⏸ En Pausa'}
                </span>
                <h4 className="font-bold text-sm text-white truncate">
                  {currentTrack ? currentTrack.title : 'Selecciona una canción o sonido'}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] truncate">
                  {currentTrack?.artist || (currentTrack?.fileSize ? `Archivo local · ${currentTrack.fileSize}` : 'Estantería NekoLover')}
                </p>
              </div>
            </div>

            {/* Configuración de Volumen */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 0.7)}
                className="text-[var(--accent-pink)] hover:scale-110 transition p-0.5"
                title={volume === 0 ? 'Activar sonido' : 'Silenciar'}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-24 sm:w-28 accent-[var(--accent-pink)] cursor-pointer h-1.5 bg-white/20 rounded-lg"
                title="Ajustar volumen de la música"
              />
              <span className="text-[11px] font-mono text-[var(--accent-pink)] font-bold min-w-8 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Progress / Time Bar (for files with duration) */}
          {duration > 0 && (
            <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-[var(--text-muted)]">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => musicPlayer.seek(parseFloat(e.target.value))}
                className="flex-1 accent-[var(--accent-purple)] cursor-pointer h-1 bg-white/10 rounded-lg"
              />
              <span>{formatTime(duration)}</span>
            </div>
          )}

          {/* Player Transport Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => musicPlayer.playPrevTrack()}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition active:scale-95"
                title="Pista anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => musicPlayer.togglePlay()}
                className="px-4 py-1.5 bg-gradient-to-r from-[var(--accent-pink)] to-purple-600 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 hover:opacity-95 shadow-md active:scale-95 transition"
                title={isPlaying ? 'Pausar música' : 'Reproducir música'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
              </button>
              <button
                type="button"
                onClick={() => musicPlayer.playNextTrack()}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition active:scale-95"
                title="Siguiente pista"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => musicPlayer.setLoop(!isLoop)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                  isLoop 
                    ? 'bg-purple-500/25 border border-purple-500/50 text-[var(--accent-purple)]' 
                    : 'bg-black/40 text-[var(--text-muted)] border border-white/5 hover:text-white'
                }`}
                title="Repetir en bucle mientras lees"
              >
                <Repeat className="w-3 h-3" />
                <span className="text-[10px]">Bucle {isLoop ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button: Subir Archivo desde el dispositivo */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Disc className="w-4 h-4 text-[var(--accent-pink)]" />
            <span>Tus Álbumes & Canciones ({customTracks.length})</span>
          </span>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
            title="Subir canción desde tus archivos (MP3, WAV, OGG, M4A)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Subiendo...' : '➕ Subir Música'}</span>
          </button>
        </div>

        {/* Tracks List on the Shelf */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
          {/* Custom Uploaded Music Section */}
          {customTracks.length > 0 ? (
            <div className="space-y-1.5">
              {customTracks.map((trk) => {
                const isSelected = currentTrack?.id === trk.id;
                return (
                  <div
                    key={trk.id}
                    onClick={() => musicPlayer.playTrack(trk)}
                    className={`p-2.5 sm:p-3 rounded-2xl border transition flex items-center justify-between gap-2 cursor-pointer group ${
                      isSelected && isPlaying
                        ? 'bg-[var(--accent-pink)]/15 border-[var(--accent-pink)] shadow-md'
                        : isSelected
                        ? 'bg-white/10 border-purple-500/40'
                        : 'bg-black/40 border-[var(--border-color)] hover:border-white/20 hover:bg-black/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 transition ${
                        isSelected && isPlaying 
                          ? 'bg-[var(--accent-pink)] text-black' 
                          : 'bg-white/10 text-[var(--text-muted)] group-hover:text-white'
                      }`}>
                        {isSelected && isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </div>
                      <div className="truncate">
                        <h5 className={`text-xs font-bold truncate ${isSelected ? 'text-[var(--accent-pink)]' : 'text-white'}`}>
                          {trk.title}
                        </h5>
                        <p className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1.5">
                          <span>{trk.fileSize || 'Audio local'}</span>
                          <span>·</span>
                          <span className="text-[var(--accent-purple)]">Subida por ti</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          musicPlayer.deleteTrack(trk.id);
                          onToast?.(`Canción "${trk.title}" eliminada de la estantería.`);
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition"
                        title="Eliminar de la estantería de música"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 sm:p-6 rounded-2xl border border-dashed border-[var(--accent-pink)]/40 hover:border-[var(--accent-pink)] bg-black/30 hover:bg-black/50 transition cursor-pointer text-center space-y-2 group"
            >
              <div className="text-3xl group-hover:scale-110 transition-transform">📂🎶</div>
              <h4 className="font-bold text-xs sm:text-sm text-[var(--accent-pink)]">
                Añade tus canciones favoritas a la estantería
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                Toca aquí para subir archivos de audio (MP3, WAV, M4A, OGG). Se guardarán en tu dispositivo y sonarán mientras lees.
              </p>
            </div>
          )}

          {/* Preset Ambient Tracks Section */}
          <div className="pt-3">
            <span className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
              Melodías y Sonidos Ambientales Integrados
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presetTracks.map((trk) => {
                const isSelected = currentTrack?.id === trk.id;
                return (
                  <div
                    key={trk.id}
                    onClick={() => musicPlayer.playTrack(trk)}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected && isPlaying
                        ? 'bg-[var(--accent-purple)]/20 border-[var(--accent-purple)] shadow'
                        : 'bg-black/30 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-lg shrink-0">
                        {trk.type === 'soundscape-rain' ? '🌧️' : '🐈‍⬛'}
                      </span>
                      <div className="truncate">
                        <h5 className="text-xs font-bold text-white truncate">
                          {trk.title}
                        </h5>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {trk.artist}
                        </p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs shrink-0">
                      {isSelected && isPlaying ? '⏸' : '▶'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 mt-3 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>🎧 La música continúa sonando en el lector</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
