// Ambient Sound Generator using Web Audio API

class SoundscapeManager {
  private ctx: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private purrGain: GainNode | null = null;
  private purrFilter: BiquadFilterNode | null = null;
  private purrTremoloGain: GainNode | null = null;
  private purrModDepth: GainNode | null = null;
  private purrOsc1: OscillatorNode | null = null;
  private purrOsc2: OscillatorNode | null = null;
  private purrOsc3: OscillatorNode | null = null;
  private purrMod: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;

  public isRainActive = false;
  public isPurrActive = false;
  public rainVolume = 0.45;
  public purrVolume = 0.45;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isAnyActive(): boolean {
    return this.isRainActive || this.isPurrActive;
  }

  // Generate soothing rain noise audible on both mobile and desktop speakers
  public toggleRain(enable?: boolean): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return false;

    const shouldEnable = enable !== undefined ? enable : !this.isRainActive;

    if (shouldEnable) {
      if (this.isRainActive) return true;

      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.2;
          b6 = white * 0.115926;
          data[i] = Math.max(-0.95, Math.min(0.95, pink));
        }
      }

      const now = ctx.currentTime;
      this.rainSource = ctx.createBufferSource();
      this.rainSource.buffer = buffer;
      this.rainSource.loop = true;

      this.rainFilter = ctx.createBiquadFilter();
      this.rainFilter.type = 'lowpass';
      this.rainFilter.frequency.setValueAtTime(1400, now);
      this.rainFilter.Q.setValueAtTime(0.7, now);

      this.rainGain = ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.01, now);
      this.rainGain.gain.linearRampToValueAtTime(this.rainVolume, now + 0.25);

      this.rainSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);

      this.rainSource.start(now);
      this.isRainActive = true;
    } else {
      if (this.rainSource) {
        try {
          this.rainSource.stop();
          this.rainSource.disconnect();
        } catch {}
        this.rainSource = null;
      }
      if (this.rainFilter) {
        try {
          this.rainFilter.disconnect();
        } catch {}
        this.rainFilter = null;
      }
      if (this.rainGain) {
        try {
          this.rainGain.disconnect();
        } catch {}
        this.rainGain = null;
      }
      this.isRainActive = false;
    }

    return this.isRainActive;
  }

  // Generate warm, rhythmic cat purring with harmonics audible on mobile speakers
  public togglePurr(enable?: boolean): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return false;

    const shouldEnable = enable !== undefined ? enable : !this.isPurrActive;

    if (shouldEnable) {
      if (this.isPurrActive) return true;

      const now = ctx.currentTime;
      this.purrGain = ctx.createGain();
      this.purrGain.gain.setValueAtTime(0.01, now);
      this.purrGain.gain.linearRampToValueAtTime(this.purrVolume * 0.75, now + 0.25);

      // Sub-bass rumble + speaker-audible purr harmonics
      this.purrOsc1 = ctx.createOscillator();
      this.purrOsc1.type = 'triangle';
      this.purrOsc1.frequency.setValueAtTime(32, now);

      this.purrOsc2 = ctx.createOscillator();
      this.purrOsc2.type = 'sawtooth';
      this.purrOsc2.frequency.setValueAtTime(64, now);

      this.purrOsc3 = ctx.createOscillator();
      this.purrOsc3.type = 'triangle';
      this.purrOsc3.frequency.setValueAtTime(128, now);

      // Rhythmic breathing / purr cadence (~1.85Hz)
      this.purrTremoloGain = ctx.createGain();
      this.purrTremoloGain.gain.setValueAtTime(0.55, now);

      this.purrMod = ctx.createOscillator();
      this.purrMod.type = 'sine';
      this.purrMod.frequency.setValueAtTime(1.85, now);

      this.purrModDepth = ctx.createGain();
      this.purrModDepth.gain.setValueAtTime(0.42, now);
      this.purrMod.connect(this.purrModDepth);
      this.purrModDepth.connect(this.purrTremoloGain.gain);

      this.purrFilter = ctx.createBiquadFilter();
      this.purrFilter.type = 'lowpass';
      this.purrFilter.frequency.setValueAtTime(320, now);
      this.purrFilter.Q.setValueAtTime(1.2, now);

      this.purrOsc1.connect(this.purrTremoloGain);
      this.purrOsc2.connect(this.purrTremoloGain);
      this.purrOsc3.connect(this.purrTremoloGain);
      this.purrTremoloGain.connect(this.purrFilter);
      this.purrFilter.connect(this.purrGain);
      this.purrGain.connect(this.masterGain);

      this.purrOsc1.start(now);
      this.purrOsc2.start(now);
      this.purrOsc3.start(now);
      this.purrMod.start(now);

      this.isPurrActive = true;
    } else {
      try {
        this.purrOsc1?.stop();
        this.purrOsc2?.stop();
        this.purrOsc3?.stop();
        this.purrMod?.stop();
        this.purrOsc1?.disconnect();
        this.purrOsc2?.disconnect();
        this.purrOsc3?.disconnect();
        this.purrMod?.disconnect();
        this.purrModDepth?.disconnect();
        this.purrTremoloGain?.disconnect();
        this.purrFilter?.disconnect();
        this.purrGain?.disconnect();
      } catch {}
      this.purrOsc1 = null;
      this.purrOsc2 = null;
      this.purrOsc3 = null;
      this.purrMod = null;
      this.purrModDepth = null;
      this.purrTremoloGain = null;
      this.purrFilter = null;
      this.purrGain = null;
      this.isPurrActive = false;
    }

    return this.isPurrActive;
  }

  public setRainVolume(vol: number) {
    this.rainVolume = vol;
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  public setPurrVolume(vol: number) {
    this.purrVolume = vol;
    if (this.purrGain && this.ctx) {
      this.purrGain.gain.setTargetAtTime(vol * 0.75, this.ctx.currentTime, 0.05);
    }
  }

  public stopAll() {
    this.toggleRain(false);
    this.togglePurr(false);
  }
}

export const soundscape = new SoundscapeManager();
