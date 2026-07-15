import config from './config';
import { MorseBoard } from './morse-board';

const PRACTICE_SESSION_COUNT_KEY = 'practiceSessionCount';
const PRACTICE_LAST_SESSION_KEY = 'practiceLastSession';
const PHRASES_PER_SESSION = 6;

const PRACTICE_PHRASES = [
  'read the code',
  'send a signal',
  'learn morse fast',
  'practice every day',
  'tap and listen',
  'count to ten',
  'keep it simple',
  'short clear message',
  'hear dots and dashes',
  'train with focus',
  'write what you hear',
  'steady typing pace',
  'copy this phrase',
  'say it and send',
  'use the morse board',
  'you are stupid',
  'was that even morse',
  'that dot was crooked',
  'you call that a dash',
  'your spacing is a mess',
  'wrong letter again',
  'my grandma types faster',
  'my cat types cleaner',
  'sloppy dots everywhere',
  'that dash was too short',
  'learn to hold the key',
  'even autocorrect gave up',
  'is your finger broken',
  'that was not a t',
  'read it before you type',
  'slow down and aim',
  'your morse needs work',
  'too slow again',
  'typos even in morse',
  'skill issue detected',
  'keep dreaming champion',
  'nice try i guess',
  'may the force be with you',
  'i am your father',
  'i will be back',
  'to infinity and beyond',
  'why so serious',
  'you shall not pass',
  'houston we have a problem',
  'just keep swimming',
  'hasta la vista baby',
  'there is no place like home',
  'winter is coming',
  'i feel the need for speed',
  'this is sparta',
  'wax on wax off',
  'you cant handle the truth',
  'keep your friends close',
  'run forrest run',
  'life finds a way',
  'i see dead people',
  'elementary my dear watson',
  'here is looking at you kid'
];

const normalizePhrase = (phrase) => (phrase.toLowerCase().match(/[a-z0-9]/g) || []).join('');

class PracticeState {
  constructor(game, course) {
    this.game = game;
    this.course = course;
    this.sessionPhrases = [];
    this.currentPhraseIndex = 0;
    this.currentCharIndex = 0;
    this.totalErrors = 0;
    this.totalWords = 0;
    this.startedAt = null;
    this.sessionComplete = false;
    this.morseBoard = null;
    this.statusTimeout = null;
  }

  init() {
    this.sessionPhrases = this.pickSessionPhrases();
    this.currentPhraseIndex = 0;
    this.currentCharIndex = 0;
    this.totalErrors = 0;
    this.totalWords = this.sessionPhrases.reduce((sum, phrase) => sum + phrase.trim().split(/\s+/).length, 0);
    this.sessionComplete = false;
    this.startedAt = Date.now();
    this.incrementPracticeCount();
  }

  create() {
    this.createBackground();
    this.createLabels();
    this.ensureMorseBoardVisible();
    this.createMorseBoard();
    this.renderPhrase();
    this.speakCurrentPhrase();
  }

  createBackground() {
    const rect = this.game.add.graphics(0, 0);
    rect.beginFill(0x145da0, 1);
    rect.drawRect(0, 0, this.game.world.width, this.game.world.height);
    rect.endFill();
  }

  createLabels() {
    this.titleText = this.game.add.text(this.game.world.centerX, 70, 'Speed Practice', {
      align: 'center'
    });
    this.titleText.fill = '#F1E4D4';
    this.titleText.fontSize = 42;
    this.titleText.anchor.setTo(0.5);
    this.titleText.font = config.typography.font;

    this.helpText = this.game.add.text(
      this.game.world.centerX,
      115,
      'Type each phrase in Morse. Wrong letters are flagged and skipped.',
      { align: 'center' }
    );
    this.helpText.fill = '#E6F2FF';
    this.helpText.fontSize = 20;
    this.helpText.anchor.setTo(0.5);
    this.helpText.font = config.typography.font;

    this.progressText = this.game.add.text(this.game.world.centerX, 165, '', { align: 'center' });
    this.progressText.fill = '#FFFFFF';
    this.progressText.fontSize = 26;
    this.progressText.anchor.setTo(0.5);
    this.progressText.font = config.typography.font;

    this.phraseText = this.game.add.text(this.game.world.centerX, 235, '', {
      align: 'center',
      wordWrap: true,
      wordWrapWidth: Math.min(this.game.world.width - 80, 760)
    });
    this.phraseText.fill = '#F1E4D4';
    this.phraseText.fontSize = 44;
    this.phraseText.anchor.setTo(0.5);
    this.phraseText.font = config.typography.font;

    this.inputText = this.game.add.text(this.game.world.centerX, 315, '', {
      align: 'center',
      wordWrap: true,
      wordWrapWidth: Math.min(this.game.world.width - 80, 760)
    });
    this.inputText.fill = '#E8F9FF';
    this.inputText.fontSize = 30;
    this.inputText.anchor.setTo(0.5);
    this.inputText.font = config.typography.font;

    this.statsText = this.game.add.text(this.game.world.centerX, 380, '', { align: 'center' });
    this.statsText.fill = '#FFFFFF';
    this.statsText.fontSize = 24;
    this.statsText.anchor.setTo(0.5);
    this.statsText.font = config.typography.font;

    this.statusText = this.game.add.text(this.game.world.centerX, 430, '', { align: 'center' });
    this.statusText.fill = '#FFD166';
    this.statusText.fontSize = 24;
    this.statusText.anchor.setTo(0.5);
    this.statusText.font = config.typography.font;
  }

  ensureMorseBoardVisible() {
    const morseBoard = document.getElementById('morseboard');
    if (morseBoard) {
      morseBoard.style.display = 'flex';
      morseBoard.classList.remove('hidden');
      localStorage.setItem('morseboard_hidden', 'false');
    }
  }

  createMorseBoard() {
    const dashSoundPath = window.GameApp && window.GameApp.assetPaths ?
      window.GameApp.assetPaths.dashSound : '../assets/sounds/dash.mp3';
    const dotSoundPath = window.GameApp && window.GameApp.assetPaths ?
      window.GameApp.assetPaths.dotSound : '../assets/sounds/dot.mp3';

    this.morseBoard = new MorseBoard({
      debounce: 1500,
      dashSoundPath,
      dotSoundPath,
      notificationStyle: 'output',
      game: this.game,
      onCommit: (event) => {
        this.handleInput(event.letter ? event.letter.toLowerCase() : '');
      },
      oneSwitchMode: localStorage.getItem('one_switch_mode') === 'true',
      oneSwitchKeyMap: [88],
      oneSwitchTimeout: 500
    });
  }

  pickSessionPhrases() {
    const shuffled = PRACTICE_PHRASES.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, PHRASES_PER_SESSION);
  }

  getCurrentPhrase() {
    return this.sessionPhrases[this.currentPhraseIndex];
  }

  getCurrentTarget() {
    return normalizePhrase(this.getCurrentPhrase() || '');
  }

  renderPhrase() {
    const phrase = this.getCurrentPhrase();
    const target = this.getCurrentTarget();
    const completed = target.slice(0, this.currentCharIndex).toUpperCase();
    const remaining = target.slice(this.currentCharIndex).toUpperCase();

    this.progressText.text = `Phrase ${this.currentPhraseIndex + 1} of ${this.sessionPhrases.length}`;
    this.phraseText.text = (phrase || '').toUpperCase();
    this.inputText.text = `${completed}${remaining ? ' _' : ''}`;
    this.statsText.text = `Errors: ${this.totalErrors}`;
  }

  handleInput(letter) {
    if (this.sessionComplete) return;
    const target = this.getCurrentTarget();
    if (!target) return;
    if (this.currentCharIndex >= target.length) return;

    const expected = target[this.currentCharIndex];
    const correct = letter === expected;

    if (!correct) {
      this.totalErrors += 1;
      this.flagError(expected);
      if (this.game.have_audio) {
        this.game.customSoundManager.playSound('wrong');
      }
    } else if (this.game.have_audio) {
      this.game.customSoundManager.playSound('correct');
    }

    this.currentCharIndex += 1;
    this.renderPhrase();

    if (this.currentCharIndex >= target.length) {
      this.advancePhrase();
    }
  }

  flagError(expected) {
    this.statusText.fill = '#FF6B6B';
    this.statusText.text = `Error flagged. Expected: ${expected.toUpperCase()}`;

    clearTimeout(this.statusTimeout);
    this.statusTimeout = setTimeout(() => {
      this.statusText.fill = '#FFD166';
      this.statusText.text = '';
    }, 800);
  }

  advancePhrase() {
    this.currentPhraseIndex += 1;
    this.currentCharIndex = 0;

    if (this.currentPhraseIndex >= this.sessionPhrases.length) {
      this.finishSession();
      return;
    }

    this.statusText.fill = '#7CFFB2';
    this.statusText.text = 'Phrase complete';
    setTimeout(() => {
      if (this.sessionComplete) return;
      this.statusText.text = '';
      this.renderPhrase();
      this.speakCurrentPhrase();
    }, 500);
  }

  finishSession() {
    this.sessionComplete = true;
    const elapsedMs = Date.now() - this.startedAt;
    const elapsedMinutes = Math.max(elapsedMs / 60000, 0.01);
    const wpm = Math.round((this.totalWords / elapsedMinutes) * 10) / 10;

    this.statusText.fill = '#7CFFB2';
    this.statusText.text = `Session complete. WPM: ${wpm}`;
    this.progressText.text = 'All phrases complete';
    this.phraseText.text = 'Great work';
    this.inputText.text = 'You can practice again anytime.';
    this.statsText.text = `Words: ${this.totalWords} | Errors: ${this.totalErrors} | WPM: ${wpm}`;

    localStorage.setItem(PRACTICE_LAST_SESSION_KEY, JSON.stringify({
      finishedAt: new Date().toISOString(),
      totalWords: this.totalWords,
      errors: this.totalErrors,
      wpm
    }));

    this.createEndButtons();
  }

  // Called by Phaser when leaving/restarting this state. Tear down the
  // MorseBoard so its dot/dash click listeners don't accumulate on the shared
  // DOM buttons across practice sessions.
  shutdown() {
    if (this.morseBoard) {
      try {
        this.morseBoard.destroy();
      } catch (error) {
        console.error('Error destroying morse board on shutdown:', error);
      }
      this.morseBoard = null;
    }
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
      this.statusTimeout = null;
    }
  }

  createEndButtons() {
    this.practiceAgainButton = this.game.add.text(this.game.world.centerX, 500, 'Practice Again', { align: 'center' });
    this.practiceAgainButton.fill = '#FFFFFF';
    this.practiceAgainButton.fontSize = 28;
    this.practiceAgainButton.anchor.setTo(0.5);
    this.practiceAgainButton.font = config.typography.font;
    this.practiceAgainButton.inputEnabled = true;
    this.practiceAgainButton.input.useHandCursor = true;
    this.practiceAgainButton.events.onInputDown.add(() => {
      this.game.state.start('practice', true, false, {});
    });

    this.backButton = this.game.add.text(this.game.world.centerX, 545, 'Back to Title', { align: 'center' });
    this.backButton.fill = '#E6F2FF';
    this.backButton.fontSize = 24;
    this.backButton.anchor.setTo(0.5);
    this.backButton.font = config.typography.font;
    this.backButton.inputEnabled = true;
    this.backButton.input.useHandCursor = true;
    this.backButton.events.onInputDown.add(() => {
      this.game.state.start('title', true, false, {});
    });
  }

  speakCurrentPhrase() {
    if (!this.game.have_audio) return;
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;

    const phrase = this.getCurrentPhrase();
    if (!phrase) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Unable to speak phrase:', error);
    }
  }

  incrementPracticeCount() {
    const count = parseInt(localStorage.getItem(PRACTICE_SESSION_COUNT_KEY), 10) || 0;
    localStorage.setItem(PRACTICE_SESSION_COUNT_KEY, String(count + 1));
  }
}

module.exports.PracticeState = PracticeState;
