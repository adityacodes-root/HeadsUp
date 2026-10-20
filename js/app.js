class HeadsUpGame {
    constructor() {
        this.config = {
            targetCards: 15
        };

        this.selectedDeckKey = 'places';
        this.activeDeck = null;
        this.shuffledCards = [];
        this.cardIndex = 0;
        this.correctCount = 0;
        this.skipCount = 0;
        this.elapsedSeconds = 0;
        this.timerInterval = null;
        this.wakeLock = null;
        this.gameState = 'LOBBY';
        this.roundHistory = [];
        this.readyCountdown = 3;
        this.readyInterval = null;

        this.dom = {};
    }

    init() {
        this.cacheDom();
        this.bindEvents();
        this.renderDeckList();
        this.setupMotionCallbacks();
        this.setupKeyboardControls();

        try {
            const savedTarget = localStorage.getItem('headsup_target');
            if (savedTarget) this.config.targetCards = parseInt(savedTarget, 10);
        } catch (e) {}

        this.updateSettingsUi();
    }

    cacheDom() {
        this.dom = {
            screenLobby: document.getElementById('screen-lobby'),
            screenReady: document.getElementById('screen-ready'),
            screenPlaying: document.getElementById('screen-playing'),
            screenSummary: document.getElementById('screen-summary'),
            
            deckGrid: document.getElementById('deck-grid'),
            selectedDeckName: document.getElementById('selected-deck-name'),
            
            readyCount: document.getElementById('ready-count'),
            readyDeckName: document.getElementById('ready-deck-name'),
            readyRules: document.getElementById('ready-rules'),
            
            wordDisplay: document.getElementById('current-word'),
            wordCategory: document.getElementById('playing-category'),
            timerDisplay: document.getElementById('timer-display'),
            scoreProgress: document.getElementById('score-progress'),
            tiltIndicator: document.getElementById('tilt-status-dot'),
            
            btnCorrect: document.getElementById('btn-action-correct'),
            btnSkip: document.getElementById('btn-action-skip'),
            btnExitGame: document.getElementById('btn-exit-game'),
            btnFlipOrientation: document.getElementById('btn-flip-orientation'),
            feedbackOverlay: document.getElementById('feedback-overlay'),
            
            summaryTitle: document.getElementById('summary-title'),
            summarySubtitle: document.getElementById('summary-subtitle'),
            summaryScore: document.getElementById('summary-score'),
            summaryTime: document.getElementById('summary-time'),
            summarySkips: document.getElementById('summary-skips'),
            summaryHistoryList: document.getElementById('summary-history-list'),
            
            btnMute: document.getElementById('btn-mute-toggle'),
            btnSettings: document.getElementById('btn-settings-toggle'),
            modalSettings: document.getElementById('modal-settings'),
            btnCloseSettings: document.getElementById('btn-close-settings'),
            selectTarget: document.getElementById('setting-target'),
            btnStartChallenge: document.getElementById('btn-start-challenge')
        };
    }

    bindEvents() {
        if (this.dom.btnSettings) {
            this.dom.btnSettings.addEventListener('click', () => {
                this.dom.modalSettings.classList.toggle('active');
            });
        }
        if (this.dom.btnCloseSettings) {
            this.dom.btnCloseSettings.addEventListener('click', () => {
                this.dom.modalSettings.classList.remove('active');
            });
        }
        if (this.dom.selectTarget) {
            this.dom.selectTarget.addEventListener('change', (e) => {
                this.config.targetCards = parseInt(e.target.value, 10);
                try { localStorage.setItem('headsup_target', this.config.targetCards); } catch (err) {}
            });
        }

        if (this.dom.btnMute) {
            this.dom.btnMute.addEventListener('click', () => {
                const isMuted = AudioEngine.toggleMute();
                this.dom.btnMute.innerText = isMuted ? '🔇' : '🔊';
            });
            this.dom.btnMute.innerText = AudioEngine.muted ? '🔇' : '🔊';
        }

        const handleCorrect = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            if (this.gameState === 'PLAYING') this.recordAnswer(true);
        };
        const handleSkip = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            if (this.gameState === 'PLAYING') this.recordAnswer(false);
        };
        const handleExit = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            this.abortGame();
        };

        if (this.dom.btnCorrect) {
            this.dom.btnCorrect.addEventListener('click', handleCorrect);
            this.dom.btnCorrect.addEventListener('touchend', handleCorrect);
        }
        if (this.dom.btnSkip) {
            this.dom.btnSkip.addEventListener('click', handleSkip);
            this.dom.btnSkip.addEventListener('touchend', handleSkip);
        }
        if (this.dom.btnExitGame) {
            this.dom.btnExitGame.addEventListener('click', handleExit);
            this.dom.btnExitGame.addEventListener('touchend', handleExit);
        }
        if (this.dom.btnFlipOrientation) {
            this.dom.btnFlipOrientation.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dom.screenPlaying.classList.toggle('flip-180');
            });
        }

        if (this.dom.btnStartChallenge) {
            this.dom.btnStartChallenge.addEventListener('click', () => {
                this.prepareRound(this.selectedDeckKey);
            });
        }

        if (this.dom.screenReady) {
            this.dom.screenReady.addEventListener('click', () => {
                if (this.gameState === 'READY') {
                    this.startActivePlay();
                }
            });
        }

        const btnPlayAgain = document.getElementById('btn-play-again');
        if (btnPlayAgain) {
            btnPlayAgain.addEventListener('click', () => {
                this.prepareRound(this.selectedDeckKey);
            });
        }
        const btnChooseDeck = document.getElementById('btn-choose-deck');
        if (btnChooseDeck) {
            btnChooseDeck.addEventListener('click', () => {
                this.showScreen('LOBBY');
            });
        }
    }

    abortGame() {
        clearInterval(this.timerInterval);
        clearInterval(this.readyInterval);
        MotionEngine.stop();
        this.releaseWakeLock();
        this.dom.screenPlaying.classList.remove('flip-180');
        this.showScreen('LOBBY');
    }

    updateSettingsUi() {
        if (this.dom.selectTarget) {
            this.dom.selectTarget.value = this.config.targetCards.toString();
        }
    }

    renderDeckList() {
        if (!this.dom.deckGrid) return;
        this.dom.deckGrid.innerHTML = '';

        Object.keys(DECKS).forEach(key => {
            const deck = DECKS[key];
            const card = document.createElement('div');
            card.className = `deck-card ${key === this.selectedDeckKey ? 'selected' : ''}`;
            card.setAttribute('data-deck', key);

            card.innerHTML = `
                <div class="deck-icon">${deck.icon}</div>
                <div class="deck-info">
                    <div class="deck-header-row">
                        <h3 class="deck-title">${deck.name}</h3>
                        <span class="deck-count">${deck.cards.length} cards</span>
                    </div>
                    <p class="deck-desc">${deck.tagline}</p>
                </div>
            `;

            card.addEventListener('click', () => {
                this.selectDeck(key);
            });

            this.dom.deckGrid.appendChild(card);
        });
    }

    selectDeck(deckKey) {
        this.selectedDeckKey = deckKey;
        const cards = document.querySelectorAll('.deck-card');
        cards.forEach(c => {
            if (c.getAttribute('data-deck') === deckKey) {
                c.classList.add('selected');
            } else {
                c.classList.remove('selected');
            }
        });
        const deck = DECKS[deckKey];
        if (this.dom.selectedDeckName) this.dom.selectedDeckName.innerText = deck.name;
    }

    setupMotionCallbacks() {
        MotionEngine.onTiltDown = () => {
            if (this.gameState === 'PLAYING') {
                this.recordAnswer(true);
            }
        };

        MotionEngine.onTiltUp = () => {
            if (this.gameState === 'PLAYING') {
                this.recordAnswer(false);
            }
        };

        MotionEngine.onStateChange = (status) => {
            if (this.dom.tiltIndicator && this.gameState === 'PLAYING') {
                if (status.state === 'DISABLED_VERTICAL') {
                    this.dom.tiltIndicator.className = 'status-dot';
                } else if (status.state === 'TILTED_DOWN') {
                    this.dom.tiltIndicator.className = 'status-dot up';
                } else if (status.state === 'TILTED_UP') {
                    this.dom.tiltIndicator.className = 'status-dot down';
                } else {
                    this.dom.tiltIndicator.className = 'status-dot neutral';
                }
            }
        };
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState === 'PLAYING') {
                if (e.code === 'ArrowDown' || e.code === 'Space') {
                    e.preventDefault();
                    this.recordAnswer(true);
                } else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
                    e.preventDefault();
                    this.recordAnswer(false);
                } else if (e.code === 'Escape') {
                    this.abortGame();
                }
            } else if (this.gameState === 'READY' && e.code === 'Space') {
                e.preventDefault();
                this.startActivePlay();
            }
        });
    }

    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {}
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release().catch(() => {});
            this.wakeLock = null;
        }
    }

    showScreen(screenName) {
        this.gameState = screenName;
        const screens = [
            this.dom.screenLobby,
            this.dom.screenReady,
            this.dom.screenPlaying,
            this.dom.screenSummary
        ];
        screens.forEach(s => s && s.classList.remove('active'));

        if (screenName === 'LOBBY') this.dom.screenLobby.classList.add('active');
        if (screenName === 'READY') this.dom.screenReady.classList.add('active');
        if (screenName === 'PLAYING') this.dom.screenPlaying.classList.add('active');
        if (screenName === 'SUMMARY') this.dom.screenSummary.classList.add('active');
    }

    shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    async prepareRound(deckKey) {
        AudioEngine.init();
        await MotionEngine.requestPermission();
        await this.requestWakeLock();

        this.activeDeck = DECKS[deckKey] || DECKS.places;
        this.shuffledCards = this.shuffleArray(this.activeDeck.cards);
        this.cardIndex = 0;
        this.correctCount = 0;
        this.skipCount = 0;
        this.roundHistory = [];
        this.elapsedSeconds = 0;

        if (this.dom.readyDeckName) {
            this.dom.readyDeckName.innerHTML = `${this.activeDeck.icon} ${this.activeDeck.name}`;
        }
        if (this.dom.readyRules) {
            this.dom.readyRules.innerText = `Complete ${this.config.targetCards} cards as fast as possible`;
        }

        this.showScreen('READY');

        this.readyCountdown = 3;
        this.dom.readyCount.innerText = this.readyCountdown;
        AudioEngine.playBeep(false);

        clearInterval(this.readyInterval);
        this.readyInterval = setInterval(() => {
            this.readyCountdown--;
            if (this.readyCountdown > 0) {
                this.dom.readyCount.innerText = this.readyCountdown;
                AudioEngine.playBeep(false);
            } else if (this.readyCountdown === 0) {
                this.dom.readyCount.innerText = 'GO';
                AudioEngine.playBeep(true);
                clearInterval(this.readyInterval);
                setTimeout(() => {
                    this.startActivePlay();
                }, 300);
            }
        }, 1000);
    }

    startActivePlay() {
        clearInterval(this.readyInterval);
        this.showScreen('PLAYING');
        this.elapsedSeconds = 0;

        MotionEngine.start();

        this.updateTimerDisplay();
        this.updateScoreProgress();
        this.displayCurrentCard();

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    updateTimerDisplay() {
        if (!this.dom.timerDisplay) return;
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        this.dom.timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    updateScoreProgress() {
        if (this.dom.scoreProgress) {
            this.dom.scoreProgress.innerText = `${this.correctCount} / ${this.config.targetCards}`;
        }
    }

    displayCurrentCard() {
        if (this.cardIndex >= this.shuffledCards.length) {
            this.shuffledCards = [...this.shuffledCards, ...this.shuffleArray(this.activeDeck.cards)];
        }

        const currentWord = this.shuffledCards[this.cardIndex];
        if (this.dom.wordDisplay) {
            this.dom.wordDisplay.innerText = currentWord;
            this.adjustWordFontSize(currentWord);
        }
        if (this.dom.wordCategory) {
            this.dom.wordCategory.innerText = this.activeDeck.name.toUpperCase();
        }
    }

    adjustWordFontSize(word) {
        const el = this.dom.wordDisplay;
        if (!el) return;
        const length = word.length;
        if (length <= 10) {
            el.style.fontSize = 'clamp(2.4rem, 6.5vw, 4.5rem)';
        } else if (length <= 16) {
            el.style.fontSize = 'clamp(1.9rem, 5vw, 3.5rem)';
        } else {
            el.style.fontSize = 'clamp(1.5rem, 4vw, 2.8rem)';
        }
    }

    recordAnswer(isCorrect) {
        if (this.gameState !== 'PLAYING') return;

        const currentWord = this.shuffledCards[this.cardIndex];
        this.roundHistory.push({
            word: currentWord,
            result: isCorrect ? 'correct' : 'skipped'
        });

        if (isCorrect) {
            this.correctCount++;
            AudioEngine.playCorrect();
            this.triggerFeedbackVisual('correct');
        } else {
            this.skipCount++;
            AudioEngine.playSkip();
            this.triggerFeedbackVisual('skip');
        }

        this.updateScoreProgress();

        if (this.correctCount >= this.config.targetCards) {
            AudioEngine.playVictory();
            this.endRound();
            return;
        }

        this.cardIndex++;
        this.displayCurrentCard();
    }

    triggerFeedbackVisual(type) {
        const overlay = this.dom.feedbackOverlay;
        if (!overlay) return;
        overlay.className = `feedback-overlay ${type}`;
        setTimeout(() => {
            overlay.className = 'feedback-overlay';
        }, 280);
    }

    endRound() {
        clearInterval(this.timerInterval);
        MotionEngine.stop();
        this.releaseWakeLock();
        this.dom.screenPlaying.classList.remove('flip-180');

        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        const formatted = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;

        if (this.dom.summaryTitle) {
            this.dom.summaryTitle.innerText = 'Completed!';
        }
        if (this.dom.summarySubtitle) {
            this.dom.summarySubtitle.innerText = `${this.correctCount} cards solved in ${formatted}`;
        }

        if (this.dom.summaryScore) this.dom.summaryScore.innerText = `${this.correctCount} / ${this.config.targetCards}`;
        if (this.dom.summaryTime) this.dom.summaryTime.innerText = formatted;
        if (this.dom.summarySkips) this.dom.summarySkips.innerText = this.skipCount.toString();

        if (this.dom.summaryHistoryList) {
            this.dom.summaryHistoryList.innerHTML = '';
            this.roundHistory.forEach(item => {
                const row = document.createElement('div');
                row.className = `history-item ${item.result}`;
                row.innerHTML = `
                    <span class="history-status">${item.result === 'correct' ? '✓' : '—'}</span>
                    <span class="history-word">${item.word}</span>
                `;
                this.dom.summaryHistoryList.appendChild(row);
            });
        }

        this.showScreen('SUMMARY');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new HeadsUpGame();
    window.game.init();
});
