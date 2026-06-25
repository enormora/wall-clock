import { deepEqual, equal, notEqual, throws } from 'node:assert/strict';
import timers from 'node:timers/promises';
import { suite, test } from 'mocha';

import { createDeterministicWallClock, createWallClock } from './wall-clock.ts';

function createCallRecorder() {
    const calls: unknown[][] = [];

    return {
        calls,
        record(...handlerArguments: unknown[]) {
            calls.push(handlerArguments);
        }
    };
}

suite('wall clock', () => {
    test('real wall clock returns the current timestamp in milliseconds', () => {
        const lowerTimestampBound = Date.now();
        const wallClock = createWallClock();

        const actualCurrentTimestampInMilliseconds = wallClock.currentTimestampInMilliseconds;

        const upperTimestampBound = Date.now();
        equal(typeof actualCurrentTimestampInMilliseconds, 'number');
        equal(actualCurrentTimestampInMilliseconds >= lowerTimestampBound, true);
        equal(actualCurrentTimestampInMilliseconds <= upperTimestampBound, true);
    });

    test('real wall clock returns a new current date instance', async () => {
        const wallClock = createWallClock();

        const firstCurrentDate = wallClock.currentDate;
        await timers.setTimeout(1);
        const secondCurrentDate = wallClock.currentDate;

        notEqual(firstCurrentDate, secondCurrentDate);
        equal(secondCurrentDate.getTime() >= firstCurrentDate.getTime(), true);
    });

    test('real wall clock binds setTimeout to globalThis', () => {
        const originalSetTimeout = globalThis.setTimeout;
        const timeoutIdentifier = 123 as unknown as ReturnType<typeof globalThis.setTimeout>;
        const invocationContexts: unknown[] = [];

        function setTimeoutStub(this: unknown) {
            invocationContexts.push(this);
            return timeoutIdentifier;
        }

        globalThis.setTimeout = setTimeoutStub as unknown as typeof globalThis.setTimeout;

        try {
            const wallClock = createWallClock();

            const actualTimeoutIdentifier = wallClock.setTimeout(() => {
                return undefined;
            }, 1);

            equal(actualTimeoutIdentifier, timeoutIdentifier);
            equal(invocationContexts[0], globalThis);
        } finally {
            globalThis.setTimeout = originalSetTimeout;
        }
    });

    test('real wall clock binds clearTimeout to globalThis', () => {
        const originalClearTimeout = globalThis.clearTimeout;
        const timeoutIdentifier = 123 as unknown as ReturnType<typeof globalThis.setTimeout>;
        const invocationContexts: unknown[] = [];
        const actualTimeoutIdentifiers: ReturnType<typeof globalThis.setTimeout>[] = [];

        function clearTimeoutStub(this: unknown, providedTimeoutIdentifier: ReturnType<typeof globalThis.setTimeout>) {
            invocationContexts.push(this);
            actualTimeoutIdentifiers.push(providedTimeoutIdentifier);
        }

        globalThis.clearTimeout = clearTimeoutStub as unknown as typeof globalThis.clearTimeout;

        try {
            const wallClock = createWallClock();

            wallClock.clearTimeout(timeoutIdentifier);

            equal(invocationContexts[0], globalThis);
            deepEqual(actualTimeoutIdentifiers, [timeoutIdentifier]);
        } finally {
            globalThis.clearTimeout = originalClearTimeout;
        }
    });

    test('real wall clock binds setInterval to globalThis', () => {
        const originalSetInterval = globalThis.setInterval;
        const intervalIdentifier = 123 as unknown as ReturnType<typeof globalThis.setInterval>;
        const invocationContexts: unknown[] = [];

        function setIntervalStub(this: unknown) {
            invocationContexts.push(this);
            return intervalIdentifier;
        }

        globalThis.setInterval = setIntervalStub as unknown as typeof globalThis.setInterval;

        try {
            const wallClock = createWallClock();

            const actualIntervalIdentifier = wallClock.setInterval(() => {
                return undefined;
            }, 1);

            equal(actualIntervalIdentifier, intervalIdentifier);
            equal(invocationContexts[0], globalThis);
        } finally {
            globalThis.setInterval = originalSetInterval;
        }
    });

    test('real wall clock binds clearInterval to globalThis', () => {
        const originalClearInterval = globalThis.clearInterval;
        const intervalIdentifier = 123 as unknown as ReturnType<typeof globalThis.setInterval>;
        const invocationContexts: unknown[] = [];
        const actualIntervalIdentifiers: ReturnType<typeof globalThis.setInterval>[] = [];

        function clearIntervalStub(
            this: unknown,
            providedIntervalIdentifier: ReturnType<typeof globalThis.setInterval>
        ) {
            invocationContexts.push(this);
            actualIntervalIdentifiers.push(providedIntervalIdentifier);
        }

        globalThis.clearInterval = clearIntervalStub as unknown as typeof globalThis.clearInterval;

        try {
            const wallClock = createWallClock();

            wallClock.clearInterval(intervalIdentifier);

            equal(invocationContexts[0], globalThis);
            deepEqual(actualIntervalIdentifiers, [intervalIdentifier]);
        } finally {
            globalThis.clearInterval = originalClearInterval;
        }
    });

    test('deterministic wall clock starts at zero by default', () => {
        const wallClock = createDeterministicWallClock();

        equal(wallClock.currentTimestampInMilliseconds, 0);
        equal(wallClock.currentDate.getTime(), 0);
    });

    test('deterministic wall clock starts with the provided timestamp', () => {
        const expectedCurrentTimestampInMilliseconds = 1_704_067_200_000;
        const wallClock = createDeterministicWallClock({
            initialCurrentTimestampInMilliseconds: expectedCurrentTimestampInMilliseconds
        });

        equal(wallClock.currentTimestampInMilliseconds, expectedCurrentTimestampInMilliseconds);
        equal(wallClock.currentDate.getTime(), expectedCurrentTimestampInMilliseconds);
    });

    test('deterministic wall clock sets the current timestamp in milliseconds', () => {
        const wallClock = createDeterministicWallClock();
        const expectedCurrentTimestampInMilliseconds = 1_800_000;

        wallClock.setCurrentTimestampInMilliseconds(expectedCurrentTimestampInMilliseconds);

        equal(wallClock.currentTimestampInMilliseconds, expectedCurrentTimestampInMilliseconds);
        equal(wallClock.currentDate.getTime(), expectedCurrentTimestampInMilliseconds);
    });

    test('deterministic wall clock advances current timestamp by the provided delay', () => {
        const wallClock = createDeterministicWallClock({
            initialCurrentTimestampInMilliseconds: 10_000
        });

        wallClock.advanceByMilliseconds(500);
        wallClock.advanceByMilliseconds(1500);

        equal(wallClock.currentTimestampInMilliseconds, 12_000);
        equal(wallClock.currentDate.getTime(), 12_000);
    });

    test('deterministic wall clock returns a new date instance for each call', () => {
        const wallClock = createDeterministicWallClock({
            initialCurrentTimestampInMilliseconds: 100
        });

        const firstCurrentDate = wallClock.currentDate;
        const secondCurrentDate = wallClock.currentDate;

        notEqual(firstCurrentDate, secondCurrentDate);
        equal(firstCurrentDate.getTime(), 100);
        equal(secondCurrentDate.getTime(), 100);
    });

    test('deterministic wall clock executes timeout callback once when time reaches the delay', () => {
        const wallClock = createDeterministicWallClock();
        const timeoutRecorder = createCallRecorder();

        wallClock.setTimeout(timeoutRecorder.record, 100, 'timeout argument');
        wallClock.advanceByMilliseconds(100);
        wallClock.advanceByMilliseconds(500);

        deepEqual(timeoutRecorder.calls, [['timeout argument']]);
    });

    test('deterministic wall clock does not execute timeout callback before the delay', () => {
        const wallClock = createDeterministicWallClock();
        const timeoutRecorder = createCallRecorder();

        wallClock.setTimeout(timeoutRecorder.record, 100);
        wallClock.advanceByMilliseconds(99);

        deepEqual(timeoutRecorder.calls, []);
    });

    test('deterministic wall clock stops executing timeout callback after clearTimeout', () => {
        const wallClock = createDeterministicWallClock();
        const timeoutRecorder = createCallRecorder();

        const timeoutIdentifier = wallClock.setTimeout(timeoutRecorder.record, 100);
        wallClock.clearTimeout(timeoutIdentifier);
        wallClock.advanceByMilliseconds(100);

        deepEqual(timeoutRecorder.calls, []);
    });

    test('deterministic wall clock executes due timeout callbacks in timestamp and registration order', () => {
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

    test('deterministic wall clock executes interval callbacks repeatedly when time advances', () => {
        const wallClock = createDeterministicWallClock();
        const intervalRecorder = createCallRecorder();

        wallClock.setInterval(intervalRecorder.record, 100, 'interval argument');
        wallClock.advanceByMilliseconds(250);

        deepEqual(intervalRecorder.calls, [['interval argument'], ['interval argument']]);
    });

    test('deterministic wall clock stops executing interval callbacks after clearInterval', () => {
        const wallClock = createDeterministicWallClock();
        const intervalRecorder = createCallRecorder();

        const intervalIdentifier = wallClock.setInterval(intervalRecorder.record, 100);
        wallClock.advanceByMilliseconds(100);
        wallClock.clearInterval(intervalIdentifier);
        wallClock.advanceByMilliseconds(300);

        deepEqual(intervalRecorder.calls, [[]]);
    });

    test('deterministic wall clock rejects invalid timeout delays', () => {
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

    test('deterministic wall clock rejects invalid interval delays', () => {
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
