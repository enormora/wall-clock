import { deepEqual, equal, notEqual, throws } from 'node:assert/strict';
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

suite('deterministic wall clock', () => {
    test('starts at zero by default', () => {
        const wallClock = createDeterministicWallClock();

        equal(wallClock.currentTimestampInMilliseconds, 0);
        equal(wallClock.currentDate.getTime(), 0);
    });

    test('starts with the provided timestamp', () => {
        const expectedCurrentTimestampInMilliseconds = 1_704_067_200_000;
        const wallClock = createDeterministicWallClock({
            initialCurrentTimestampInMilliseconds: expectedCurrentTimestampInMilliseconds
        });

        equal(wallClock.currentTimestampInMilliseconds, expectedCurrentTimestampInMilliseconds);
        equal(wallClock.currentDate.getTime(), expectedCurrentTimestampInMilliseconds);
    });

    test('sets the current timestamp in milliseconds', () => {
        const wallClock = createDeterministicWallClock();
        const expectedCurrentTimestampInMilliseconds = 1_800_000;

        wallClock.setCurrentTimestampInMilliseconds(expectedCurrentTimestampInMilliseconds);

        equal(wallClock.currentTimestampInMilliseconds, expectedCurrentTimestampInMilliseconds);
        equal(wallClock.currentDate.getTime(), expectedCurrentTimestampInMilliseconds);
    });

    test('advances current timestamp by the provided delay', () => {
        const wallClock = createDeterministicWallClock({
            initialCurrentTimestampInMilliseconds: 10_000
        });

        wallClock.advanceByMilliseconds(500);
        wallClock.advanceByMilliseconds(1500);

        equal(wallClock.currentTimestampInMilliseconds, 12_000);
        equal(wallClock.currentDate.getTime(), 12_000);
    });

    test('returns a new date instance for each call', () => {
        const wallClock = createDeterministicWallClock({
            initialCurrentTimestampInMilliseconds: 100
        });

        const firstCurrentDate = wallClock.currentDate;
        const secondCurrentDate = wallClock.currentDate;

        notEqual(firstCurrentDate, secondCurrentDate);
        equal(firstCurrentDate.getTime(), 100);
        equal(secondCurrentDate.getTime(), 100);
    });

    test('executes timeout callback once when time reaches the delay', () => {
        const wallClock = createDeterministicWallClock();
        const timeoutRecorder = createCallRecorder();

        wallClock.setTimeout(timeoutRecorder.record, 100, 'timeout argument');
        wallClock.advanceByMilliseconds(100);
        wallClock.advanceByMilliseconds(500);

        deepEqual(timeoutRecorder.calls, [['timeout argument']]);
    });

    test('does not execute timeout callback before the delay', () => {
        const wallClock = createDeterministicWallClock();
        const timeoutRecorder = createCallRecorder();

        wallClock.setTimeout(timeoutRecorder.record, 100);
        wallClock.advanceByMilliseconds(99);

        deepEqual(timeoutRecorder.calls, []);
    });

    test('stops executing timeout callback after clearTimeout', () => {
        const wallClock = createDeterministicWallClock();
        const timeoutRecorder = createCallRecorder();

        const timeoutIdentifier = wallClock.setTimeout(timeoutRecorder.record, 100);
        wallClock.clearTimeout(timeoutIdentifier);
        wallClock.advanceByMilliseconds(100);

        deepEqual(timeoutRecorder.calls, []);
    });

    test('executes due timeout callbacks in timestamp and registration order', () => {
        const wallClock = createDeterministicWallClock();
        const executionOrder: string[] = [];

        wallClock.setTimeout(() => {
            executionOrder.push('second timeout');
        }, 100);
        wallClock.setTimeout(() => {
            executionOrder.push('first timeout');
        }, 50);
        wallClock.setTimeout(() => {
            executionOrder.push('third timeout');
        }, 100);

        wallClock.advanceByMilliseconds(100);

        deepEqual(executionOrder, ['first timeout', 'second timeout', 'third timeout']);
    });

    test('executes interval callbacks repeatedly when time advances', () => {
        const wallClock = createDeterministicWallClock();
        const intervalRecorder = createCallRecorder();

        wallClock.setInterval(intervalRecorder.record, 100, 'interval argument');
        wallClock.advanceByMilliseconds(250);

        deepEqual(intervalRecorder.calls, [['interval argument'], ['interval argument']]);
    });

    test('stops executing interval callbacks after clearInterval', () => {
        const wallClock = createDeterministicWallClock();
        const intervalRecorder = createCallRecorder();

        const intervalIdentifier = wallClock.setInterval(intervalRecorder.record, 100);
        wallClock.advanceByMilliseconds(100);
        wallClock.clearInterval(intervalIdentifier);
        wallClock.advanceByMilliseconds(300);

        deepEqual(intervalRecorder.calls, [[]]);
    });

    test('rejects invalid timeout delays', () => {
        const wallClock = createDeterministicWallClock();

        throws(() => {
            wallClock.setTimeout(() => {
                return undefined;
            }, -1);
        }, RangeError);
        throws(() => {
            wallClock.setTimeout(() => {
                return undefined;
            }, Number.NaN);
        }, TypeError);
    });

    test('rejects invalid interval delays', () => {
        const wallClock = createDeterministicWallClock();

        throws(() => {
            wallClock.setInterval(() => {
                return undefined;
            }, 0);
        }, RangeError);
        throws(() => {
            wallClock.setInterval(() => {
                return undefined;
            }, Number.POSITIVE_INFINITY);
        }, TypeError);
    });
});
