import { equal } from 'node:assert/strict';

import { createWallClock } from './wall-clock.ts';

test('uses the configured current time source', () => {
    const expectedCurrentTimeMilliseconds = 1_782_391_296_000;
    const wallClock = createWallClock({
        currentTimeMilliseconds: () => {
            return expectedCurrentTimeMilliseconds;
        }
    });

    const actualCurrentTimeMilliseconds = wallClock.currentTimeMilliseconds();

    equal(actualCurrentTimeMilliseconds, expectedCurrentTimeMilliseconds);
});
