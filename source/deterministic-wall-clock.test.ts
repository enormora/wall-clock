import assert from 'node:assert';
import { suite, test } from 'mocha';

import { createDeterministicWallClock } from './deterministic-wall-clock.ts';

function createCallRecorder() {
    const calls: unknown[][] = [];

    return {
        calls,
        record(...handlerArguments: unknown[]) {
            calls.push(handlerArguments);
        }
    };
}

suite('deterministic wall clock', function () {
    test('starts at zero by default', function () {
        const wallClock = createDeterministicWallClock();

        assert.strictEqual(wallClock.currentTimestampInMilliseconds, 0);
        assert.strictEqual(wallClock.currentDate.getTime(), 0);
    });

    test('starts with the provided timestamp', function () {
        const expectedCurrentTimestampInMilliseconds = 1_704_067_200_000;
        const wallClock = createDeterministicWallClock({
            initialCurrentTimestampInMilliseconds: expectedCurrentTimestampInMilliseconds
        });

        assert.strictEqual(wallClock.currentTimestampInMilliseconds, expectedCurrentTimestampInMilliseconds);
        assert.strictEqual(wallClock.currentDate.getTime(), expectedCurrentTimestampInMilliseconds);
    });

    test('sets the current timestamp in milliseconds', function () {
        const wallClock = createDeterministicWallClock();
        const expectedCurrentTimestampInMilliseconds = 1_800_000;

        wallClock.setCurrentTimestampInMilliseconds(expectedCurrentTimestampInMilliseconds);

        assert.strictEqual(wallClock.currentTimestampInMilliseconds, expectedCurrentTimestampInMilliseconds);
        assert.strictEqual(wallClock.currentDate.getTime(), expectedCurrentTimestampInMilliseconds);
    });

    test('advances current timestamp by the provided delay', function () {
        const wallClock = createDeterministicWallClock({
            initialCurrentTimestampInMilliseconds: 10_000
        });

        wallClock.advanceByMilliseconds(500);
        wallClock.advanceByMilliseconds(1500);

        assert.strictEqual(wallClock.currentTimestampInMilliseconds, 12_000);
        assert.strictEqual(wallClock.currentDate.getTime(), 12_000);
    });

    test('returns a new date instance for each call', function () {
        const wallClock = createDeterministicWallClock({
            initialCurrentTimestampInMilliseconds: 100
        });

        const firstCurrentDate = wallClock.currentDate;
        const secondCurrentDate = wallClock.currentDate;

        assert.notStrictEqual(firstCurrentDate, secondCurrentDate);
        assert.strictEqual(firstCurrentDate.getTime(), 100);
        assert.strictEqual(secondCurrentDate.getTime(), 100);
    });

    test('executes timeout callback once when time reaches the delay', function () {
        const wallClock = createDeterministicWallClock();
        const timeoutRecorder = createCallRecorder();

        wallClock.setTimeout(timeoutRecorder.record, 100, 'timeout argument');
        wallClock.advanceByMilliseconds(100);
        wallClock.advanceByMilliseconds(500);

        assert.deepStrictEqual(timeoutRecorder.calls, [ [ 'timeout argument' ] ]);
    });

    test('does not execute timeout callback before the delay', function () {
        const wallClock = createDeterministicWallClock();
        const timeoutRecorder = createCallRecorder();

        wallClock.setTimeout(timeoutRecorder.record, 100);
        wallClock.advanceByMilliseconds(99);

        assert.deepStrictEqual(timeoutRecorder.calls, []);
    });

    test('stops executing timeout callback after clearTimeout', function () {
        const wallClock = createDeterministicWallClock();
        const timeoutRecorder = createCallRecorder();

        const timeoutIdentifier = wallClock.setTimeout(timeoutRecorder.record, 100);
        wallClock.clearTimeout(timeoutIdentifier);
        wallClock.advanceByMilliseconds(100);

        assert.deepStrictEqual(timeoutRecorder.calls, []);
    });

    test('executes due timeout callbacks in timestamp and registration order', function () {
        const wallClock = createDeterministicWallClock();
        const executionOrder: string[] = [];

        wallClock.setTimeout(function () {
            executionOrder.push('second timeout');
        }, 100);
        wallClock.setTimeout(function () {
            executionOrder.push('first timeout');
        }, 50);
        wallClock.setTimeout(function () {
            executionOrder.push('third timeout');
        }, 100);

        wallClock.advanceByMilliseconds(100);

        assert.deepStrictEqual(executionOrder, [ 'first timeout', 'second timeout', 'third timeout' ]);
    });

    test('executes interval callbacks repeatedly when time advances', function () {
        const wallClock = createDeterministicWallClock();
        const intervalRecorder = createCallRecorder();

        wallClock.setInterval(intervalRecorder.record, 100, 'interval argument');
        wallClock.advanceByMilliseconds(250);

        assert.deepStrictEqual(intervalRecorder.calls, [ [ 'interval argument' ], [ 'interval argument' ] ]);
    });

    test('stops executing interval callbacks after clearInterval', function () {
        const wallClock = createDeterministicWallClock();
        const intervalRecorder = createCallRecorder();

        const intervalIdentifier = wallClock.setInterval(intervalRecorder.record, 100);
        wallClock.advanceByMilliseconds(100);
        wallClock.clearInterval(intervalIdentifier);
        wallClock.advanceByMilliseconds(300);

        assert.deepStrictEqual(intervalRecorder.calls, [ [] ]);
    });

    test('rejects invalid timeout delays', function () {
        const wallClock = createDeterministicWallClock();

        assert.throws(function () {
            wallClock.setTimeout(function () {
                return undefined;
            }, -1);
        }, RangeError);
        assert.throws(function () {
            wallClock.setTimeout(function () {
                return undefined;
            }, NaN);
        }, TypeError);
    });

    test('rejects invalid interval delays', function () {
        const wallClock = createDeterministicWallClock();

        assert.throws(function () {
            wallClock.setInterval(function () {
                return undefined;
            }, 0);
        }, RangeError);
        assert.throws(function () {
            wallClock.setInterval(function () {
                return undefined;
            }, Infinity);
        }, TypeError);
    });
});
