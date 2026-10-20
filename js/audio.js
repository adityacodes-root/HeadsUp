class SoundEffects {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.hapticsEnabled = true;

        try {
            const savedMute = localStorage.getItem('headsup_muted');
            if (savedMute !== null) this.muted = savedMute === 'true';
            const savedHaptics = localStorage.getItem('headsup_haptics');
            if (savedHaptics !== null) this.hapticsEnabled = savedHaptics !== 'false';
        } catch (e) {}
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        try {
            localStorage.setItem('headsup_muted', this.muted);
        } catch (e) {}
        return this.muted;
    }

    vibrate(pattern) {
        if (!this.hapticsEnabled) return;
        try {
            if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
                navigator.vibrate(pattern);
            }
        } catch (e) {}
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.4, startDelay = 0) {
        if (this.muted) return;
        try {
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startDelay);

            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime + startDelay);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + startDelay + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + startDelay);
            osc.stop(this.ctx.currentTime + startDelay + duration);
        } catch (e) {}
    }

    playCorrect() {
        this.vibrate([60]);
        if (this.muted) return;
        // High bright game-show ding: G5 (784Hz) -> C6 (1046Hz)
        this.playTone(783.99, 'triangle', 0.14, 0.5, 0);
        this.playTone(1046.50, 'triangle', 0.28, 0.65, 0.09);
    }

    playSkip() {
        this.vibrate([40, 40, 40]);
        if (this.muted) return;
        // Distinct descending double-buzz for pass: 360Hz -> 240Hz
        this.playTone(360, 'sawtooth', 0.1, 0.35, 0);
        this.playTone(240, 'sawtooth', 0.16, 0.45, 0.09);
    }

    playTick() {
        this.vibrate(15);
        this.playTone(900, 'sine', 0.04, 0.2);
    }

    playBeep(isFinal = false) {
        this.vibrate(30);
        if (isFinal) {
            this.playTone(880, 'triangle', 0.3, 0.5);
        } else {
            this.playTone(440, 'sine', 0.1, 0.3);
        }
    }

    playVictory() {
        this.vibrate([100, 50, 100, 50, 250]);
        if (this.muted) return;
        const notes = [
            { f: 523.25, t: 0.0 },
            { f: 659.25, t: 0.12 },
            { f: 783.99, t: 0.24 },
            { f: 1046.50, t: 0.38 }
        ];
        notes.forEach(n => this.playTone(n.f, 'triangle', 0.45, 0.5, n.t));
    }
}

const AudioEngine = new SoundEffects();
