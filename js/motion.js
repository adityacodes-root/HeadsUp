class MotionController {
    constructor() {
        this.active = false;
        this.actionsEnabled = false;
        this.hasSensorData = false;
        this.permissionGranted = false;

        this.onTiltUp = null;
        this.onTiltDown = null;
        this.onStateChange = null;

        this.state = 'NEUTRAL';
        this.isLocked = false;
        this.armed = true;

        this.TILT_THRESHOLD = 2.6;
        this.NEUTRAL_THRESHOLD = 1.6;
        this.COOLDOWN_MS = 600;

        this.baselineZ = 0;
        this.neutralFrames = 0;
        this.requiredNeutralFrames = 2;

        this.isPhoneHorizontal = true;
        this.invertTilt = false;

        try {
            const savedInvert = localStorage.getItem('headsup_invert_tilt');
            if (savedInvert !== null) this.invertTilt = savedInvert === 'true';
            const savedSens = localStorage.getItem('headsup_sensitivity');
            if (savedSens) this.setSensitivity(savedSens);
        } catch (e) {}

        this.handleDeviceMotion = this.handleDeviceMotion.bind(this);
        this.handleDeviceOrientation = this.handleDeviceOrientation.bind(this);
    }

    setSensitivity(level) {
        if (level === 'sensitive') {
            this.TILT_THRESHOLD = 2.0;
            this.NEUTRAL_THRESHOLD = 1.2;
        } else if (level === 'firm') {
            this.TILT_THRESHOLD = 3.2;
            this.NEUTRAL_THRESHOLD = 2.0;
        } else {
            this.TILT_THRESHOLD = 2.6;
            this.NEUTRAL_THRESHOLD = 1.6;
        }
        try {
            localStorage.setItem('headsup_sensitivity', level);
        } catch (e) {}
    }

    setInvertTilt(invert) {
        this.invertTilt = !!invert;
        try {
            localStorage.setItem('headsup_invert_tilt', this.invertTilt);
        } catch (e) {}
    }

    async requestPermission() {
        let granted = true;

        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const res = await DeviceMotionEvent.requestPermission();
                if (res !== 'granted') granted = false;
            } catch (err) {
                granted = false;
            }
        }

        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const res = await DeviceOrientationEvent.requestPermission();
                if (res !== 'granted') granted = false;
            } catch (err) {}
        }

        this.permissionGranted = granted;
        return granted;
    }

    start(enableActions = true) {
        this.active = true;
        this.actionsEnabled = enableActions;
        this.state = 'NEUTRAL';
        this.armed = true;
        this.isLocked = false;
        this.baselineZ = 0;
        this.neutralFrames = 0;
        this.isPhoneHorizontal = true;
        this.hasSensorData = false;

        window.addEventListener('devicemotion', this.handleDeviceMotion, false);
        window.addEventListener('deviceorientation', this.handleDeviceOrientation, false);
    }

    enableActions() {
        this.actionsEnabled = true;
        this.armed = true;
        this.isLocked = false;
    }

    stop() {
        this.active = false;
        this.actionsEnabled = false;
        window.removeEventListener('devicemotion', this.handleDeviceMotion, false);
        window.removeEventListener('deviceorientation', this.handleDeviceOrientation, false);
    }

    handleDeviceMotion(e) {
        if (!this.active) return;
        const acc = e.accelerationIncludingGravity;
        if (!acc || acc.z === null || acc.z === undefined) return;

        this.hasSensorData = true;

        const ax = Math.abs(acc.x || 0);
        const ay = Math.abs(acc.y || 0);
        const az = Math.abs(acc.z || 0);

        const isLandscapeBrowser = window.innerWidth > window.innerHeight;
        if (isLandscapeBrowser) {
            this.isPhoneHorizontal = true;
        } else if (az < 4.5) {
            if (ax > ay + 1.0 && ay < 4.5) {
                this.isPhoneHorizontal = true;
            } else if (ay > ax + 1.0 || ay > 5.5) {
                this.isPhoneHorizontal = false;
            }
        } else if (ay > 6.5) {
            this.isPhoneHorizontal = false;
        }

        let z = acc.z || 0;
        if (this.invertTilt) z = -z;

        this.processReading(z, this.isPhoneHorizontal);
    }

    handleDeviceOrientation(e) {
        if (!this.active || this.hasSensorData) return;

        const orientation = window.orientation || (screen.orientation && screen.orientation.angle) || 0;
        let tilt = 0;

        if (Math.abs(orientation) === 90 || orientation === 270) {
            tilt = (orientation === 90) ? -e.gamma : e.gamma;
            this.isPhoneHorizontal = true;
        } else {
            tilt = e.gamma || 0;
            this.isPhoneHorizontal = true;
        }

        if (tilt === null || isNaN(tilt)) return;

        let simulatedZ = Math.sin((tilt || 0) * (Math.PI / 180)) * 9.8;
        if (this.invertTilt) simulatedZ = -simulatedZ;

        this.processReading(simulatedZ, this.isPhoneHorizontal);
    }

    processReading(z, isHorizontal) {
        if (!isHorizontal) {
            if (this.onStateChange) {
                this.onStateChange({
                    z,
                    delta: 0,
                    state: 'DISABLED_VERTICAL',
                    isLocked: true,
                    armed: false,
                    isHorizontal: false
                });
            }
            return;
        }

        if (Math.abs(z) <= 2.2 && !this.isLocked) {
            this.baselineZ = this.baselineZ * 0.95 + z * 0.05;
            this.baselineZ = Math.max(-2.0, Math.min(2.0, this.baselineZ));
        }

        const delta = z - this.baselineZ;

        if (Math.abs(delta) <= this.NEUTRAL_THRESHOLD) {
            this.neutralFrames++;
            if (this.neutralFrames >= this.requiredNeutralFrames && !this.isLocked) {
                this.armed = true;
                this.state = 'NEUTRAL';
            }
        } else {
            this.neutralFrames = 0;
        }

        if (this.onStateChange) {
            this.onStateChange({
                z,
                delta,
                state: this.state,
                isLocked: this.isLocked,
                armed: this.armed,
                isHorizontal: true
            });
        }

        if (!this.actionsEnabled || this.isLocked || !this.armed) return;

        if (delta <= -this.TILT_THRESHOLD) {
            this.triggerAction('DOWN');
            return;
        }

        if (delta >= this.TILT_THRESHOLD) {
            this.triggerAction('UP');
            return;
        }
    }

    triggerAction(direction) {
        this.isLocked = true;
        this.armed = false;
        this.neutralFrames = 0;
        this.state = direction === 'DOWN' ? 'TILTED_DOWN' : 'TILTED_UP';

        if (direction === 'DOWN' && typeof this.onTiltDown === 'function') {
            this.onTiltDown();
        } else if (direction === 'UP' && typeof this.onTiltUp === 'function') {
            this.onTiltUp();
        }

        setTimeout(() => {
            this.isLocked = false;
        }, this.COOLDOWN_MS);
    }
}

const MotionEngine = new MotionController();
