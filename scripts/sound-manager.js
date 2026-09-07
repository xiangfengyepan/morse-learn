const { Howl } = require('howler');

class SoundManager {
  constructor() {
    this.sounds = {};
  }

  createSound(name, path) {
    if (!path) {
      console.warn(`No path provided for sound ${name}`);
      return;
    }

    // Asset paths from Parcel already include the file extension.
    const resolvedPath = path.endsWith('.mp3') ? path : `${path}.mp3`;

    const newSound = new Howl({
      src: [resolvedPath]
      // src: [ `${path}.m4a`,`${path}.mp3` ]
    });

    this.sounds[name] = newSound;
  }

  playSound(name) {
    try {
      // Only play if the sound exists
      if (this.sounds[name]) {
        console.log(`Playing sound: ${name}`);

        // Stop any currently playing instance of this sound
        this.sounds[name].stop();

        // Add a longer delay before playing to avoid interruption issues
        setTimeout(() => {
          try {
            // Create a new instance of the sound with error handling
            this.sounds[name].play();

            // Handle any errors that might occur during playback
            this.sounds[name].once('playerror', (id, err) => {
              console.warn(`Error playing sound ${name}:`, err);
            });

            // Add a load event handler to ensure the sound is fully loaded
            this.sounds[name].once('load', () => {
              console.log(`Sound ${name} loaded successfully`);
            });
          } catch (playError) {
            console.warn(`Error playing sound ${name} after delay:`, playError);
          }
        }, 100); // Increased delay to 100ms

        return true;
      } else {
        console.warn(`Sound ${name} not found in sound manager`);
      }
    } catch (error) {
      console.warn(`Error playing sound ${name}:`, error);
    }
    return null;
  }

  soundDuration(name) {
    if (!this.sounds[name]) {
      console.warn(`Sound ${name} not found in sound manager`);
      return 0;
    }

    const duration = this.sounds[name].duration();
    return Number.isFinite(duration) ? duration : 0;
  }

  stopSound(name) {
    try {
      if (this.sounds[name]) {
        console.log(`Stopping sound: ${name}`);
        this.sounds[name].stop();
      }
    } catch (error) {
      console.warn(`Error stopping sound ${name}:`, error);
    }
  }
}

module.exports.SoundManager = SoundManager;
