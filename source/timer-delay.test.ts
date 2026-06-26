import assert from 'node:assert';
import { suite, test } from 'mocha';

import {
    validateFiniteDelayInMilliseconds,
    validateIntervalDelayInMilliseconds,
    validateTimeoutDelayInMilliseconds
} from './timer-delay.ts';

suite('timer delay validation', () => {
    test('accepts finite delays', () => {
        assert.doesNotThrow(() => {
            validateFiniteDelayInMilliseconds(0);
        });
        assert.doesNotThrow(() => {
            validateFiniteDelayInMilliseconds(100);
        });
        assert.doesNotThrow(() => {
            validateFiniteDelayInMilliseconds(-100);
        });
    });

    test('rejects non-finite delays', () => {
        assert.throws(() => {
            validateFiniteDelayInMilliseconds(Number.NaN);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
        assert.throws(() => {
            validateFiniteDelayInMilliseconds(Number.POSITIVE_INFINITY);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
        assert.throws(() => {
            validateFiniteDelayInMilliseconds(Number.NEGATIVE_INFINITY);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });

    test('accepts zero and positive timeout delays', () => {
        assert.doesNotThrow(() => {
            validateTimeoutDelayInMilliseconds(0);
        });
        assert.doesNotThrow(() => {
            validateTimeoutDelayInMilliseconds(100);
        });
    });

    test('rejects negative timeout delays', () => {
        assert.throws(() => {
            validateTimeoutDelayInMilliseconds(-1);
        }, /^RangeError: Invalid timeout delay -1, must be greater than or equal to 0$/u);
    });

    test('rejects non-finite timeout delays', () => {
        assert.throws(() => {
            validateTimeoutDelayInMilliseconds(Number.NaN);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });

    test('accepts positive interval delays', () => {
        assert.doesNotThrow(() => {
            validateIntervalDelayInMilliseconds(1);
        });
        assert.doesNotThrow(() => {
            validateIntervalDelayInMilliseconds(100);
        });
    });

    test('rejects zero and negative interval delays', () => {
        assert.throws(() => {
            validateIntervalDelayInMilliseconds(0);
        }, /^RangeError: Invalid interval delay 0, must be greater than 0$/u);
        assert.throws(() => {
            validateIntervalDelayInMilliseconds(-1);
        }, /^RangeError: Invalid interval delay -1, must be greater than 0$/u);
    });

    test('rejects non-finite interval delays', () => {
        assert.throws(() => {
            validateIntervalDelayInMilliseconds(Number.POSITIVE_INFINITY);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });
});
