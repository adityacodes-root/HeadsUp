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

        this.THRESHOLD_UP = 4.2;
        this.THRESHOLD_DOWN = -4.2;
        this.NEUTRAL_LIMIT = 2.2;
        this.COOLDOWN_MS = 900;

        this.neutralSamples = 0;
        this.requiredNeutralSamples = 4;
        this.currentZ = 0;

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
        this.neutralSamples = 0;
        this.hasSensorData = false;

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

        // iOS and Android report opposite signs for Z axis
        const z = this.isIOS ? -acc.z : acc.z;
        this.currentZ = z;
        this.processReading(z);
    }

    handleDeviceOrientation(e) {
        if (!this.active || this.hasSensorData) return;

        const orientation = window.orientation || (screen.orientation && screen.orientation.angle) || 0;
        let tilt = 0;

        if (Math.abs(orientation) === 90 || orientation === 270) {
            tilt = (orientation === 90) ? e.gamma : -e.gamma;
        } else {
            tilt = e.beta;
        }

        if (tilt === null || isNaN(tilt)) return;

        const simulatedZ = Math.sin((tilt || 0) * (Math.PI / 180)) * 9.8;
        this.currentZ = simulatedZ;
        this.processReading(simulatedZ);
    }

    processReading(z) {
        if (this.onStateChange) {
            this.onStateChange({
                z,
                state: this.state,
                isLocked: this.isLocked,
                armed: this.armed
            });
        }

        const isNeutral = Math.abs(z) <= this.NEUTRAL_LIMIT;

        if (isNeutral) {
            this.neutralSamples++;
            if (this.neutralSamples >= this.requiredNeutralSamples) {
                if (!this.isLocked && !this.armed) {
                    this.armed = true;
                    this.state = 'NEUTRAL';
                }
            }
        } else {
            this.neutralSamples = 0;
        }

        if (this.isLocked || !this.armed) return;

        if (z >= this.THRESHOLD_UP) {
            this.triggerAction('UP');
            return;
        }

        if (z <= this.THRESHOLD_DOWN) {
            this.triggerAction('DOWN');
            return;
        }
    }

    triggerAction(direction) {
        this.isLocked = true;
        this.armed = false;
        this.state = direction === 'UP' ? 'TILTED_UP' : 'TILTED_DOWN';
        this.neutralSamples = 0;

        if (direction === 'UP' && typeof this.onTiltUp === 'function') {
            this.onTiltUp();
        } else if (direction === 'DOWN' && typeof this.onTiltDown === 'function') {
            this.onTiltDown();
        }

        setTimeout(() => {
            this.isLocked = false;
        }, this.COOLDOWN_MS);
    }
}

const MotionEngine = new MotionController();
