// Ambient Sound Generator using Web Audio API

class SoundscapeManager {
  private ctx: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private purrGain: GainNode | null = null;
  private purrOsc1: OscillatorNode | null = null;
  private purrOsc2: OscillatorNode | null = null;
  private purrMod: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;

  public isRainActive = false;
  public isPurrActive = false;
  public rainVolume = 0.4;
  public purrVolume = 0.35;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate pink/brown gentle rain noise
  public toggleRain(enable?: boolean): boolean {
    this.initContext();
    if (!this.ctx || !this.masterGain) return false;

    const shouldEnable = enable !== undefined ? enable : !this.isRainActive;

    if (shouldEnable) {
      if (this.isRainActive) return true;

      // Create 5-second looped buffer of smoothed rain noise
      const bufferSize = this.ctx.sampleRate * 5;
      const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

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
          const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
          data[i] = pink;
        }
      }

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = buffer;
      this.rainSource.loop = true;

      // Filter to simulate soft raindrops hitting window glass
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(this.rainVolume, this.ctx.currentTime);

      this.rainSource.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);

      this.rainSource.start();
      this.isRainActive = true;
    } else {
      if (this.rainSource) {
        try {
          this.rainSource.stop();
          this.rainSource.disconnect();
        } catch {}
        this.rainSource = null;
      }
      this.isRainActive = false;
    }

    return this.isRainActive;
  }

  // Generate realistic rhythmic cat purring
  public togglePurr(enable?: boolean): boolean {
    this.initContext();
    if (!this.ctx || !this.masterGain) return false;

    const shouldEnable = enable !== undefined ? enable : !this.isPurrActive;

    if (shouldEnable) {
      if (this.isPurrActive) return true;

      const now = this.ctx.currentTime;
      this.purrGain = this.ctx.createGain();
      this.purrGain.gain.setValueAtTime(this.purrVolume, now);

      // Low frequency rumble oscillators
      this.purrOsc1 = this.ctx.createOscillator();
      this.purrOsc1.type = 'triangle';
      this.purrOsc1.frequency.setValueAtTime(28, now); // Cat purr fundamental frequency

      this.purrOsc2 = this.ctx.createOscillator();
      this.purrOsc2.type = 'sine';
      this.purrOsc2.frequency.setValueAtTime(56, now); // First harmonic

      // Tremolo / breathing modulator (~1.8Hz purr rhythm)
      const tremoloGain = this.ctx.createGain();
      tremoloGain.gain.setValueAtTime(0.5, now);

      this.purrMod = this.ctx.createOscillator();
      this.purrMod.type = 'sine';
      this.purrMod.frequency.setValueAtTime(1.8, now);

      const modDepth = this.ctx.createGain();
      modDepth.gain.setValueAtTime(0.4, now);
      this.purrMod.connect(modDepth);
      modDepth.connect(tremoloGain.gain);

      // Subdued low-pass filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);

      this.purrOsc1.connect(tremoloGain);
      this.purrOsc2.connect(tremoloGain);
      tremoloGain.connect(filter);
      filter.connect(this.purrGain);
      this.purrGain.connect(this.masterGain);

      this.purrOsc1.start();
      this.purrOsc2.start();
      this.purrMod.start();

      this.isPurrActive = true;
    } else {
      if (this.purrOsc1) {
        try {
          this.purrOsc1.stop();
          this.purrOsc2?.stop();
          this.purrMod?.stop();
          this.purrOsc1.disconnect();
          this.purrOsc2?.disconnect();
          this.purrMod?.disconnect();
        } catch {}
        this.purrOsc1 = null;
        this.purrOsc2 = null;
        this.purrMod = null;
      }
      this.isPurrActive = false;
    }

    return this.isPurrActive;
  }

  public setRainVolume(vol: number) {
    this.rainVolume = vol;
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public setPurrVolume(vol: number) {
    this.purrVolume = vol;
    if (this.purrGain && this.ctx) {
      this.purrGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public stopAll() {
    this.toggleRain(false);
    this.togglePurr(false);
  }
}

export const soundscape = new SoundscapeManager();
