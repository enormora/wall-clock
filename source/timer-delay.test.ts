import assert from 'node:assert';
import { suite, test } from 'mocha';

import {
    validateFiniteDelayInMilliseconds,
    validateIntervalDelayInMilliseconds,
    validateTimeoutDelayInMilliseconds
} from './timer-delay.ts';

suite('timer delay validation', function () {
    test('accepts finite delays', function () {
        let acceptedDelayCount = 0;
        validateFiniteDelayInMilliseconds(0);
        acceptedDelayCount += 1;
        validateFiniteDelayInMilliseconds(100);
        acceptedDelayCount += 1;
        validateFiniteDelayInMilliseconds(-100);
        acceptedDelayCount += 1;

        assert.strictEqual(acceptedDelayCount, 3);
    });

    test('rejects non-finite delays', function () {
        assert.throws(function () {
            validateFiniteDelayInMilliseconds(Number.NaN);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
        assert.throws(function () {
            validateFiniteDelayInMilliseconds(Number.POSITIVE_INFINITY);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
        assert.throws(function () {
            validateFiniteDelayInMilliseconds(Number.NEGATIVE_INFINITY);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });

    test('accepts zero and positive timeout delays', function () {
        let acceptedDelayCount = 0;
        validateTimeoutDelayInMilliseconds(0);
        acceptedDelayCount += 1;
        validateTimeoutDelayInMilliseconds(100);
        acceptedDelayCount += 1;

        assert.strictEqual(acceptedDelayCount, 2);
    });

    test('rejects negative timeout delays', function () {
        assert.throws(function () {
            validateTimeoutDelayInMilliseconds(-1);
        }, /^RangeError: Invalid timeout delay -1, must be greater than or equal to 0$/u);
    });

    test('rejects non-finite timeout delays', function () {
        assert.throws(function () {
            validateTimeoutDelayInMilliseconds(Number.NaN);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });

    test('accepts positive interval delays', function () {
        let acceptedDelayCount = 0;
        validateIntervalDelayInMilliseconds(1);
        acceptedDelayCount += 1;
        validateIntervalDelayInMilliseconds(100);
        acceptedDelayCount += 1;

        assert.strictEqual(acceptedDelayCount, 2);
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
            validateIntervalDelayInMilliseconds(Number.POSITIVE_INFINITY);
        }, /^TypeError: Invalid delay, must be a finite number$/u);
    });
});
