class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  preloadSound(name: string, path: string): void {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.sounds.set(name, audio);
    } catch (error) {
      console.warn(`Failed to preload sound ${name}:`, error);
    }
  }

  async playSound(name: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const audio = this.sounds.get(name);
      if (!audio) {
        console.warn(`Sound ${name} not found`);
        return;
      }

      audio.currentTime = 0;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      console.warn(`Failed to play sound ${name}:`, error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();

export const initSounds = () => {
  soundManager.preloadSound('click', '/sounds/click.mp3');
};

export const playClickSound = async () => {
  await soundManager.playSound('click');
};
