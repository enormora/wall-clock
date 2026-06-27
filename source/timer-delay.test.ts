import assert from 'node:assert';
import { suite, test } from 'mocha';

import {
    validateFiniteDelayInMilliseconds,
    validateIntervalDelayInMilliseconds,
    validateTimeoutDelayInMilliseconds
} from './timer-delay.ts';

suite('timer delay validation', function () {
    test('accepts finite delays', function () {
        assert.doesNotThrow(function () {
            validateFiniteDelayInMilliseconds(0);
        });
        assert.doesNotThrow(function () {
            validateFiniteDelayInMilliseconds(100);
        });
        assert.doesNotThrow(function () {
            validateFiniteDelayInMilliseconds(-100);
        });
    });

    test('rejects non-finite delays', function () {
        assert.throws(function () {
            validateFiniteDelayInMilliseconds(NaN);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
        assert.throws(function () {
            validateFiniteDelayInMilliseconds(Infinity);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
        assert.throws(function () {
            validateFiniteDelayInMilliseconds(-Infinity);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });

    test('accepts zero and positive timeout delays', function () {
        assert.doesNotThrow(function () {
            validateTimeoutDelayInMilliseconds(0);
        });
        assert.doesNotThrow(function () {
            validateTimeoutDelayInMilliseconds(100);
        });
    });

    test('rejects negative timeout delays', function () {
        assert.throws(function () {
            validateTimeoutDelayInMilliseconds(-1);
        }, /^RangeError: Invalid timeout delay -1, must be greater than or equal to 0$/u);
    });

    test('rejects non-finite timeout delays', function () {
        assert.throws(function () {
            validateTimeoutDelayInMilliseconds(NaN);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });

    test('accepts positive interval delays', function () {
        assert.doesNotThrow(function () {
            validateIntervalDelayInMilliseconds(1);
        });
        assert.doesNotThrow(function () {
            validateIntervalDelayInMilliseconds(100);
        });
    });

    test('rejects zero and negative interval delays', function () {
        assert.throws(function () {
            validateIntervalDelayInMilliseconds(0);
        }, /^RangeError: Invalid interval delay 0, must be greater than 0$/u);
        assert.throws(function () {
            validateIntervalDelayInMilliseconds(-1);
        }, /^RangeError: Invalid interval delay -1, must be greater than 0$/u);
    });

    test('rejects non-finite interval delays', function () {
        assert.throws(function () {
            validateIntervalDelayInMilliseconds(Infinity);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });
});
