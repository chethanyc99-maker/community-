/**
 * Speech Engine using Web Speech API (SpeechSynthesis)
 * Provides multi-sensory auditory guidance for non-verbal or reading-impaired learners.
 */
class SpeechAssistant {
  constructor() {
    this.synth = window.speechSynthesis;
    this.enabled = true;
    this.rate = 0.8;
    this.pitch = 1.05;
    this.voice = null;
    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;
    const updateVoiceList = () => {
      const voices = this.synth.getVoices();
      this.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira'))) || voices.find(v => v.lang.startsWith('en')) || null;
    };

    updateVoiceList();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = updateVoiceList;
    }
  }

  toggle(enableState) {
    this.enabled = typeof enableState === 'boolean' ? enableState : !this.enabled;
    if (!this.enabled && this.synth) {
      this.synth.cancel();
    }
    return this.enabled;
  }

  setRate(newRate) {
    this.rate = newRate;
  }

  speak(text, priority = false) {
    if (!this.enabled || !this.synth || !text) return;

    if (priority) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    if (this.voice) {
      utterance.voice = this.voice;
    }

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

window.speechAssistant = new SpeechAssistant();
