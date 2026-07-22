# @enormora/wall-clock

Explicit wall-clock time access for TypeScript applications.

`@enormora/wall-clock` provides a small boundary around time-related side effects:

- reading the current timestamp
- creating the current `Date`
- scheduling and clearing timeouts
- scheduling and clearing intervals
- replacing real time with a deterministic clock in tests

The package is intentionally small. It is meant to make time an explicit dependency instead of letting application code
call `Date.now()`, `new Date()`, `setTimeout`, or `setInterval` directly.

## Installation

```sh
npm install @enormora/wall-clock
```

The package is ESM-only and requires Node.js `^24.15.0 || ^26.0.0`.

The root export keeps both clocks available from one import. Prefer the explicit module subpaths when code only needs one
clock:

- `@enormora/wall-clock/wall-clock`
- `@enormora/wall-clock/deterministic-wall-clock`

## Real wall clock

Use `createWallClock()` at the application boundary and pass the resulting `WallClock` into code that needs time.

```ts
import { createWallClock } from '@enormora/wall-clock/wall-clock';

const wallClock = createWallClock();

console.log(wallClock.currentTimestampInMilliseconds);
console.log(wallClock.currentDate.toISOString());
```

The real clock delegates to the runtime:

- `currentTimestampInMilliseconds` uses `Date.now()`
- `currentDate` returns a new `Date`
- `setTimeout` and `clearTimeout` call `globalThis`
- `setInterval` and `clearInterval` call `globalThis`

The timer functions are bound to `globalThis`, so they can be passed around safely.

## Dependency injection

Prefer accepting a `WallClock` as an explicit dependency for code that depends on time.

```ts
import type { WallClock } from '@enormora/wall-clock/wall-clock';

type Session = {
    readonly expiresAtTimestampInMilliseconds: number;
};

export function isSessionExpired(wallClock: WallClock, session: Session): boolean {
    return wallClock.currentTimestampInMilliseconds >= session.expiresAtTimestampInMilliseconds;
}
```

This keeps the core behavior deterministic and easy to test.

## Deterministic wall clock

Use `createDeterministicWallClock()` in tests or deterministic environments.

```ts
import { createDeterministicWallClock } from '@enormora/wall-clock/deterministic-wall-clock';

const wallClock = createDeterministicWallClock({
    initialCurrentTimestampInMilliseconds: 1_704_067_200_000
});

console.log(wallClock.currentDate.toISOString());

wallClock.advanceByMilliseconds(1000);

console.log(wallClock.currentTimestampInMilliseconds);
```

The deterministic clock implements the same `WallClock` interface and adds:

- `setCurrentTimestampInMilliseconds(nextTimestampInMilliseconds)`
- `advanceByMilliseconds(delayInMilliseconds)`

## Testing timers

The deterministic clock runs scheduled callbacks when time is advanced far enough.

```ts
import assert from 'node:assert';
import { createDeterministicWallClock } from '@enormora/wall-clock/deterministic-wall-clock';

const wallClock = createDeterministicWallClock();
const calls: string[] = [];

wallClock.setTimeout(
    (value) => {
        calls.push(value);
    },
    100,
    'done'
);

wallClock.advanceByMilliseconds(99);
assert.deepStrictEqual(calls, []);

wallClock.advanceByMilliseconds(1);
assert.deepStrictEqual(calls, [ 'done' ]);
```

Intervals run once for each elapsed interval.

```ts
import assert from 'node:assert';
import { createDeterministicWallClock } from '@enormora/wall-clock/deterministic-wall-clock';

const wallClock = createDeterministicWallClock();
let count = 0;

const intervalIdentifier = wallClock.setInterval(() => {
    count += 1;
}, 100);

wallClock.advanceByMilliseconds(250);
assert.strictEqual(count, 2);

wallClock.clearInterval(intervalIdentifier);
wallClock.advanceByMilliseconds(500);
assert.strictEqual(count, 2);
```

## Timer behavior

Timeouts:

- execute once
- execute only after the clock reaches their scheduled timestamp
- execute in scheduled timestamp order
- execute in registration order when multiple timeouts share the same scheduled timestamp
- can use a delay of `0`
- reject negative and non-finite delays

Intervals:

- execute repeatedly
- execute once per elapsed interval when time advances
- stop after `clearInterval`
- reject `0`, negative, and non-finite delays

The deterministic clock intentionally rejects zero-delay intervals because they cannot advance safely without creating an
infinite loop.

## API

```ts
export type WallClock = {
    readonly currentTimestampInMilliseconds: number;
    readonly currentDate: Date;
    readonly setTimeout: <HandlerArguments extends readonly unknown[]>(
        handler: (...handlerArguments: HandlerArguments) => void,
        delayInMilliseconds: number,
        ...handlerArguments: HandlerArguments
    ) => ReturnType<typeof globalThis.setTimeout>;
    readonly clearTimeout: (timeoutIdentifier: ReturnType<typeof globalThis.setTimeout>) => void;
    readonly setInterval: <HandlerArguments extends readonly unknown[]>(
        handler: (...handlerArguments: HandlerArguments) => void,
        delayInMilliseconds: number,
        ...handlerArguments: HandlerArguments
    ) => ReturnType<typeof globalThis.setInterval>;
    readonly clearInterval: (intervalIdentifier: ReturnType<typeof globalThis.setInterval>) => void;
};
```

```ts
export type DeterministicWallClock = WallClock & {
    readonly setCurrentTimestampInMilliseconds: (nextTimestampInMilliseconds: number) => void;
    readonly advanceByMilliseconds: (delayInMilliseconds: number) => void;
};
```

```ts
export function createWallClock(): WallClock;
```

```ts
export function createDeterministicWallClock(options?: {
    readonly initialCurrentTimestampInMilliseconds?: number;
}): DeterministicWallClock;
```

## Development

Install dependencies:

```sh
npm clean-install
```

Compile:

```sh
just compile
```

Run lint checks:

```sh
just lint
```

Run tests:

```sh
just test
```

Run a Packtory dry-run:

```sh
just packtory-dry-run
```

## Publishing

Pull requests that should appear in the changelog need exactly one changelog label. Supported labels:

- `breaking`
- `bug`
- `feature`
- `enhancement`
- `documentation`
- `upgrade`
- `refactor`
- `build`

The package is released through a release pull request:

1. Go to GitHub Actions -> Release -> Run workflow.
2. The workflow creates or updates a `Prepare release` pull request with the generated `CHANGELOG.md` changes.
3. Review and merge the release pull request through the normal merge queue.
4. After the release pull request is merged, the publish workflow publishes to npm, pushes the package tag, and creates
   the GitHub Release.

The dry-run command validates the package shape without publishing.

```sh
just packtory-dry-run
```

Inspect the next release plan:

```sh
just release-plan
```

Show what would change compared to the latest published package:

```sh
just release-diff
```

Generate or update the configured changelog output:

```sh
just changelog
```

Prepare a changelog commit:

```sh
just prepare-release
```

Publish, tag, push tags, and create GitHub Releases:

```sh
just publish-release
```

## License

MIT
