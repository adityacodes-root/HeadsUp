class MotionController {
    constructor() {
        this.active = false;
        this.hasSensorData = false;
        this.permissionGranted = false;

        this.onTiltUp = null;
        this.onTiltDown = null;
        this.onStateChange = null;

        this.state = 'NEUTRAL';
        this.isLocked = false;
        this.armed = true;

        this.TILT_THRESHOLD = 2.2;
        this.NEUTRAL_THRESHOLD = 1.1;
        this.COOLDOWN_MS = 700;

        this.baselineZ = 0;
        this.calibrationSamples = 0;
        this.calibrated = false;

        this.currentZ = 0;
        this.currentDelta = 0;
        this.isPhoneHorizontal = true;

        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        this.handleDeviceMotion = this.handleDeviceMotion.bind(this);
        this.handleDeviceOrientation = this.handleDeviceOrientation.bind(this);
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

    start() {
        this.active = true;
        this.state = 'NEUTRAL';
        this.armed = true;
        this.isLocked = false;
        this.baselineZ = 0;
        this.calibrationSamples = 0;
        this.calibrated = false;
        this.hasSensorData = false;
        this.isPhoneHorizontal = true;

        window.addEventListener('devicemotion', this.handleDeviceMotion, false);
        window.addEventListener('deviceorientation', this.handleDeviceOrientation, false);
    }

    stop() {
        this.active = false;
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

        // Only horizontal orientation allowed - vertical tilt is disabled
        const isLandscapeBrowser = window.innerWidth > window.innerHeight;
        const isHorizontalPhysical = ax >= (ay - 1.5);
        this.isPhoneHorizontal = isLandscapeBrowser || isHorizontalPhysical;

        // Normalize Z: positive = UP (ceiling), negative = DOWN (floor)
        const z = this.isIOS ? -acc.z : acc.z;
        this.currentZ = z;
        this.processReading(z);
    }

    handleDeviceOrientation(e) {
        if (!this.active || this.hasSensorData) return;

        let tilt = 0;
        const orientation = window.orientation || (screen.orientation && screen.orientation.angle) || 0;

        if (Math.abs(orientation) === 90 || orientation === 270) {
            tilt = (orientation === 90) ? e.gamma : -e.gamma;
            this.isPhoneHorizontal = true;
        } else {
            // When browser in portrait, rotating around horizontal phone axis is gamma
            tilt = e.gamma;
            this.isPhoneHorizontal = true;
        }

        if (tilt === null || isNaN(tilt)) return;

        const simulatedZ = Math.sin((tilt || 0) * (Math.PI / 180)) * 9.8;
        this.currentZ = simulatedZ;
        this.processReading(simulatedZ);
    }

    processReading(z) {
        // If phone is held vertically, disable tilt actions
        if (!this.isPhoneHorizontal) {
            if (this.onStateChange) {
                this.onStateChange({
                    z,
                    delta: 0,
                    state: 'DISABLED_VERTICAL',
                    isLocked: true,
                    armed: false
                });
            }
            return;
        }

        // Calibrate baseline to player's forehead resting angle
        if (!this.calibrated) {
            if (Math.abs(z) < 6.0) {
                this.baselineZ = (this.baselineZ * this.calibrationSamples + z) / (this.calibrationSamples + 1);
                this.calibrationSamples++;
                if (this.calibrationSamples >= 5) {
                    this.calibrated = true;
                }
            }
        } else if (!this.isLocked && this.armed && Math.abs(z - this.baselineZ) < 1.3) {
            this.baselineZ = this.baselineZ * 0.95 + z * 0.05;
        }

        const delta = z - this.baselineZ;
        this.currentDelta = delta;

        if (this.onStateChange) {
            this.onStateChange({
                z,
                delta,
                state: this.state,
                isLocked: this.isLocked,
                armed: this.armed
            });
        }

        if (Math.abs(delta) <= this.NEUTRAL_THRESHOLD) {
            if (!this.isLocked && !this.armed) {
                this.armed = true;
                this.state = 'NEUTRAL';
            }
        }

        if (this.isLocked || !this.armed) return;

        // Bend phone down towards floor -> CORRECT
        if (delta <= -this.TILT_THRESHOLD) {
            this.triggerAction('DOWN');
            return;
        }

        // Bend phone up towards ceiling -> SKIP
        if (delta >= this.TILT_THRESHOLD) {
            this.triggerAction('UP');
            return;
        }
    }

    triggerAction(direction) {
        this.isLocked = true;
        this.armed = false;
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
