// Kawaii Neko Text-to-Speech Narrator

class NekoTTS {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  public isSpeaking = false;
  public isPaused = false;
  public rate = 0.95; // Slightly cozy reading tempo
  public pitch = 1.1; // Cute slightly elevated tone

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(
    text: string,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ) {
    if (!this.synth) {
      console.warn('Speech synthesis is not supported on this browser.');
      return;
    }

    this.stop();

    if (!text || text.trim().length === 0) return;

    // Clean markdown/html formatting if any
    const cleanText = text.replace(/<[^>]*>?/gm, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    // Pick best Spanish or matching voice if available
    const voices = this.synth.getVoices();
    const esVoice = voices.find(
      (v) => v.lang.startsWith('es') || v.lang.includes('ES') || v.lang.includes('MX')
    );
    if (esVoice) {
      utterance.voice = esVoice;
      utterance.lang = esVoice.lang;
    } else if (voices.length > 0) {
      utterance.voice = voices[0];
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (onError) onError(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  public resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
    }
  }
}

export const nekoTTS = new NekoTTS();
