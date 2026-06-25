import { doesNotThrow, throws } from 'node:assert/strict';
import { suite, test } from 'mocha';

import {
    validateFiniteDelayInMilliseconds,
    validateIntervalDelayInMilliseconds,
    validateTimeoutDelayInMilliseconds
} from './timer-delay.ts';

suite('timer delay validation', () => {
    test('accepts finite delays', () => {
        doesNotThrow(() => {
            validateFiniteDelayInMilliseconds(0);
        });
        doesNotThrow(() => {
            validateFiniteDelayInMilliseconds(100);
        });
        doesNotThrow(() => {
            validateFiniteDelayInMilliseconds(-100);
        });
    });

    test('rejects non-finite delays', () => {
        throws(() => {
            validateFiniteDelayInMilliseconds(Number.NaN);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
        throws(() => {
            validateFiniteDelayInMilliseconds(Number.POSITIVE_INFINITY);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
        throws(() => {
            validateFiniteDelayInMilliseconds(Number.NEGATIVE_INFINITY);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });

    test('accepts zero and positive timeout delays', () => {
        doesNotThrow(() => {
            validateTimeoutDelayInMilliseconds(0);
        });
        doesNotThrow(() => {
            validateTimeoutDelayInMilliseconds(100);
        });
    });

    test('rejects negative timeout delays', () => {
        throws(() => {
            validateTimeoutDelayInMilliseconds(-1);
        }, /^RangeError: Invalid timeout delay -1, must be greater than or equal to 0$/u);
    });

    test('rejects non-finite timeout delays', () => {
        throws(() => {
            validateTimeoutDelayInMilliseconds(Number.NaN);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });

    test('accepts positive interval delays', () => {
        doesNotThrow(() => {
            validateIntervalDelayInMilliseconds(1);
        });
        doesNotThrow(() => {
            validateIntervalDelayInMilliseconds(100);
        });
    });

    test('rejects zero and negative interval delays', () => {
        throws(() => {
            validateIntervalDelayInMilliseconds(0);
        }, /^RangeError: Invalid interval delay 0, must be greater than 0$/u);
        throws(() => {
            validateIntervalDelayInMilliseconds(-1);
        }, /^RangeError: Invalid interval delay -1, must be greater than 0$/u);
    });

    test('rejects non-finite interval delays', () => {
        throws(() => {
            validateIntervalDelayInMilliseconds(Number.POSITIVE_INFINITY);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });
});
