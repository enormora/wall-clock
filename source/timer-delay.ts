export function validateFiniteDelayInMilliseconds(delayInMilliseconds: number): void {
    if (!Number.isFinite(delayInMilliseconds)) {
        throw new TypeError('Invalid delay, must be a finite number');
    }
}

export function validateTimeoutDelayInMilliseconds(delayInMilliseconds: number): void {
    validateFiniteDelayInMilliseconds(delayInMilliseconds);

    if (delayInMilliseconds < 0) {
        throw new RangeError(`Invalid timeout delay ${delayInMilliseconds}, must be greater than or equal to 0`);
    }
}

export function validateIntervalDelayInMilliseconds(delayInMilliseconds: number): void {
    validateFiniteDelayInMilliseconds(delayInMilliseconds);

    if (delayInMilliseconds <= 0) {
        throw new RangeError(`Invalid interval delay ${delayInMilliseconds}, must be greater than 0`);
    }
}
