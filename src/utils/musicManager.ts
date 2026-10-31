import { MusicTrack } from '../types';
import { saveFileToDB, getFileFromDB, deleteFileFromDB } from './db';
import { soundscape } from './audio';

export const DEFAULT_PRESET_TRACKS: MusicTrack[] = [
  {
    id: 'preset-rain',
    title: '🌧️ Lluvia Gótica Lo-Fi',
    artist: 'NekoLover Soundscape',
    isCustom: false,
    type: 'soundscape-rain',
    addedAt: 1
  },
  {
    id: 'preset-purr',
    title: '🐈‍⬛ Ronroneo Neko Profundo',
    artist: 'NekoLover Soundscape',
    isCustom: false,
    type: 'soundscape-purr',
    addedAt: 2
  }
];

class MusicPlayerManager {
  private audio: HTMLAudioElement | null = null;
  public currentTrack: MusicTrack | null = null;
  public isPlaying: boolean = false;
  public volume: number = 0.7; // 0.0 to 1.0
  public currentTime: number = 0;
  public duration: number = 0;
  public isLoop: boolean = true;
  private currentBlobUrl: string | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const savedVol = localStorage.getItem('nl_music_volume');
      if (savedVol !== null) {
        this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
      }

      const savedLoop = localStorage.getItem('nl_music_loop');
      if (savedLoop !== null) {
        this.isLoop = savedLoop === 'true';
      }

      this.audio = new Audio();
      this.audio.loop = this.isLoop;
      this.audio.volume = this.volume;

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio) {
          this.currentTime = this.audio.currentTime;
          this.duration = this.audio.duration || 0;
          this.notify();
        }
      });

      this.audio.addEventListener('ended', () => {
        if (!this.isLoop) {
          this.playNextTrack();
        }
      });

      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.notify();
      });

      this.audio.addEventListener('pause', () => {
        // Only if soundscape isn't playing
        if (!soundscape.isRainActive && !soundscape.isPurrActive) {
          this.isPlaying = false;
        }
        this.notify();
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try { l(); } catch (e) { console.error(e); }
    });
  }

  public getTracks(): MusicTrack[] {
    try {
      const saved = localStorage.getItem('nl_music_shelf_tracks');
      const customTracks: MusicTrack[] = saved ? JSON.parse(saved) : [];
      return [...DEFAULT_PRESET_TRACKS, ...customTracks];
    } catch {
      return [...DEFAULT_PRESET_TRACKS];
    }
  }

  public async uploadCustomTrack(file: File): Promise<MusicTrack> {
    const id = `user-audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await saveFileToDB(`music-${id}`, file);

    const newTrack: MusicTrack = {
      id,
      title: file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      isCustom: true,
      type: 'file',
      addedAt: Date.now()
    };

    const existing = this.getCustomTracks();
    const updated = [newTrack, ...existing];
    localStorage.setItem('nl_music_shelf_tracks', JSON.stringify(updated));
    this.notify();
    return newTrack;
  }

  public async deleteTrack(trackId: string): Promise<void> {
    if (this.currentTrack?.id === trackId) {
      this.stop();
    }
    await deleteFileFromDB(`music-${trackId}`);
    const existing = this.getCustomTracks();
    const updated = existing.filter((t) => t.id !== trackId);
    localStorage.setItem('nl_music_shelf_tracks', JSON.stringify(updated));
    this.notify();
  }

  private getCustomTracks(): MusicTrack[] {
    try {
      const saved = localStorage.getItem('nl_music_shelf_tracks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  public async playTrack(track: MusicTrack) {
    // 1. Stop whatever was currently playing
    this.stopAudioElement();
    soundscape.stopAll();

    this.currentTrack = track;

    if (track.type === 'soundscape-rain') {
      soundscape.setRainVolume(this.volume);
      soundscape.toggleRain(true);
      this.isPlaying = true;
      this.notify();
      return;
    }

    if (track.type === 'soundscape-purr') {
      soundscape.setPurrVolume(this.volume);
      soundscape.togglePurr(true);
      this.isPlaying = true;
      this.notify();
      return;
    }

    // Custom uploaded audio file from IndexedDB
    try {
      const fileData = await getFileFromDB(`music-${track.id}`);
      if (!fileData) {
        throw new Error('Archivo de audio no encontrado.');
      }

      if (this.currentBlobUrl) {
        URL.revokeObjectURL(this.currentBlobUrl);
        this.currentBlobUrl = null;
      }

      const blob = fileData instanceof Blob ? fileData : new Blob([fileData]);
      const blobUrl = URL.createObjectURL(blob);
      this.currentBlobUrl = blobUrl;

      if (this.audio) {
        this.audio.src = blobUrl;
        this.audio.volume = this.volume;
        this.audio.loop = this.isLoop;
        await this.audio.play();
        this.isPlaying = true;
        this.notify();
      }
    } catch (err) {
      console.error('Error playing track:', err);
      this.isPlaying = false;
      this.notify();
    }
  }

  public togglePlay() {
    if (!this.currentTrack) {
      const tracks = this.getTracks();
      if (tracks.length > 0) {
        this.playTrack(tracks[0]);
      }
      return;
    }

    if (this.currentTrack.type === 'soundscape-rain') {
      const next = soundscape.toggleRain();
      this.isPlaying = next;
      this.notify();
      return;
    }

    if (this.currentTrack.type === 'soundscape-purr') {
      const next = soundscape.togglePurr();
      this.isPlaying = next;
      this.notify();
      return;
    }

    if (this.audio) {
      if (this.audio.paused) {
        this.audio.play().catch(console.error);
        this.isPlaying = true;
      } else {
        this.audio.pause();
        this.isPlaying = false;
      }
      this.notify();
    }
  }

  public pause() {
    if (this.currentTrack?.type === 'soundscape-rain') {
      soundscape.toggleRain(false);
    } else if (this.currentTrack?.type === 'soundscape-purr') {
      soundscape.togglePurr(false);
    } else if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
    this.notify();
  }

  public resume() {
    if (this.currentTrack) {
      this.playTrack(this.currentTrack);
    } else {
      const tracks = this.getTracks();
      if (tracks.length > 0) this.playTrack(tracks[0]);
    }
  }

  public stop() {
    this.stopAudioElement();
    soundscape.stopAll();
    this.currentTrack = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.notify();
  }

  private stopAudioElement() {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch {}
    }
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    localStorage.setItem('nl_music_volume', String(clamped));

    if (this.audio) {
      this.audio.volume = clamped;
    }
    soundscape.setRainVolume(clamped);
    soundscape.setPurrVolume(clamped);
    this.notify();
  }

  public setLoop(loop: boolean) {
    this.isLoop = loop;
    localStorage.setItem('nl_music_loop', String(loop));
    if (this.audio) {
      this.audio.loop = loop;
    }
    this.notify();
  }

  public seek(seconds: number) {
    if (this.audio && Number.isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(this.duration, seconds));
      this.currentTime = this.audio.currentTime;
      this.notify();
    }
  }

  public playNextTrack() {
    const tracks = this.getTracks();
    if (tracks.length === 0) return;
    if (!this.currentTrack) {
      this.playTrack(tracks[0]);
      return;
    }
    const idx = tracks.findIndex((t) => t.id === this.currentTrack?.id);
    const nextIdx = (idx + 1) % tracks.length;
    this.playTrack(tracks[nextIdx]);
  }

  public playPrevTrack() {
    const tracks = this.getTracks();
    if (tracks.length === 0) return;
    if (!this.currentTrack) {
      this.playTrack(tracks[0]);
      return;
    }
    const idx = tracks.findIndex((t) => t.id === this.currentTrack?.id);
    const prevIdx = (idx - 1 + tracks.length) % tracks.length;
    this.playTrack(tracks[prevIdx]);
  }
}

export const musicPlayer = new MusicPlayerManager();
