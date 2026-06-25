import { deepEqual, equal, notEqual } from 'node:assert/strict';
import timers from 'node:timers/promises';
import { suite, test } from 'mocha';

import { createWallClock } from './wall-clock.ts';

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
});
