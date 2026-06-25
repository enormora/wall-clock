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

export type DeterministicWallClock = WallClock & {
    readonly setCurrentTimestampInMilliseconds: (nextTimestampInMilliseconds: number) => void;
    readonly advanceByMilliseconds: (delayInMilliseconds: number) => void;
};

export type DeterministicWallClockOptions = {
    readonly initialCurrentTimestampInMilliseconds?: number;
};

type TimeoutRegistration = {
    readonly execute: () => void;
    readonly executionTimestampInMilliseconds: number;
};

type IntervalRegistration = {
    readonly delayInMilliseconds: number;
    readonly execute: () => void;
    readonly nextExecutionTimestampInMilliseconds: number;
};

type TimeoutController = {
    readonly runDueTimeoutRegistrations: () => void;
    readonly setTimeout: WallClock['setTimeout'];
    readonly clearTimeout: WallClock['clearTimeout'];
};

type IntervalController = {
    readonly runDueIntervalRegistrations: () => void;
    readonly setInterval: WallClock['setInterval'];
    readonly clearInterval: WallClock['clearInterval'];
};

type CurrentTimestampReader = () => number;

function validateFiniteDelayInMilliseconds(delayInMilliseconds: number): void {
    if (!Number.isFinite(delayInMilliseconds)) {
        throw new TypeError('Invalid delay, must be a finite number');
    }
}

function validateTimeoutDelayInMilliseconds(delayInMilliseconds: number): void {
    validateFiniteDelayInMilliseconds(delayInMilliseconds);

    if (delayInMilliseconds < 0) {
        throw new RangeError(`Invalid timeout delay ${delayInMilliseconds}, must be greater than or equal to 0`);
    }
}

function validateIntervalDelayInMilliseconds(delayInMilliseconds: number): void {
    validateFiniteDelayInMilliseconds(delayInMilliseconds);

    if (delayInMilliseconds <= 0) {
        throw new RangeError(`Invalid interval delay ${delayInMilliseconds}, must be greater than 0`);
    }
}

export function createWallClock(): WallClock {
    return {
        get currentTimestampInMilliseconds() {
            return Date.now();
        },

        get currentDate() {
            return new Date();
        },

        setTimeout: globalThis.setTimeout.bind(globalThis),

        clearTimeout: globalThis.clearTimeout.bind(globalThis),

        setInterval: globalThis.setInterval.bind(globalThis),

        clearInterval: globalThis.clearInterval.bind(globalThis)
    };
}

function createTimeoutController(currentTimestampInMilliseconds: CurrentTimestampReader): TimeoutController {
    let nextTimeoutIdentifier = 0;
    const timeoutRegistrations = new Map<number, TimeoutRegistration>();

    function runDueTimeoutRegistrations(): void {
        const dueTimeoutEntries = Array.from(timeoutRegistrations.entries())
            .filter(([, timeoutRegistration]) => {
                return timeoutRegistration.executionTimestampInMilliseconds <= currentTimestampInMilliseconds();
            })
            .toSorted((firstTimeoutEntry, secondTimeoutEntry) => {
                const [firstTimeoutIdentifier, firstTimeoutRegistration] = firstTimeoutEntry;
                const [secondTimeoutIdentifier, secondTimeoutRegistration] = secondTimeoutEntry;

                if (
                    firstTimeoutRegistration.executionTimestampInMilliseconds !==
                    secondTimeoutRegistration.executionTimestampInMilliseconds
                ) {
                    return (
                        firstTimeoutRegistration.executionTimestampInMilliseconds -
                        secondTimeoutRegistration.executionTimestampInMilliseconds
                    );
                }

                return firstTimeoutIdentifier - secondTimeoutIdentifier;
            });

        dueTimeoutEntries.forEach(([timeoutIdentifier, timeoutRegistration]) => {
            timeoutRegistrations.delete(timeoutIdentifier);
            timeoutRegistration.execute();
        });
    }

    return {
        runDueTimeoutRegistrations,

        setTimeout(handler, delayInMilliseconds, ...handlerArguments) {
            validateTimeoutDelayInMilliseconds(delayInMilliseconds);

            const timeoutIdentifier = nextTimeoutIdentifier;
            nextTimeoutIdentifier += 1;

            timeoutRegistrations.set(timeoutIdentifier, {
                execute: () => {
                    handler(...handlerArguments);
                },
                executionTimestampInMilliseconds: currentTimestampInMilliseconds() + delayInMilliseconds
            });

            return timeoutIdentifier as unknown as ReturnType<typeof globalThis.setTimeout>;
        },

        clearTimeout(timeoutIdentifier) {
            timeoutRegistrations.delete(timeoutIdentifier as unknown as number);
        }
    };
}

function createIntervalController(currentTimestampInMilliseconds: CurrentTimestampReader): IntervalController {
    let nextIntervalIdentifier = 0;
    const intervalRegistrations = new Map<number, IntervalRegistration>();

    function runDueIntervalRegistrations(): void {
        intervalRegistrations.forEach((intervalRegistration, intervalIdentifier) => {
            const { delayInMilliseconds, execute } = intervalRegistration;
            let { nextExecutionTimestampInMilliseconds } = intervalRegistration;

            while (nextExecutionTimestampInMilliseconds <= currentTimestampInMilliseconds()) {
                execute();

                if (!intervalRegistrations.has(intervalIdentifier)) {
                    return;
                }

                nextExecutionTimestampInMilliseconds += delayInMilliseconds;
                intervalRegistrations.set(intervalIdentifier, {
                    delayInMilliseconds,
                    execute,
                    nextExecutionTimestampInMilliseconds
                });
            }
        });
    }

    return {
        runDueIntervalRegistrations,

        setInterval(handler, delayInMilliseconds, ...handlerArguments) {
            validateIntervalDelayInMilliseconds(delayInMilliseconds);

            const intervalIdentifier = nextIntervalIdentifier;
            nextIntervalIdentifier += 1;

            intervalRegistrations.set(intervalIdentifier, {
                delayInMilliseconds,
                execute: () => {
                    handler(...handlerArguments);
                },
                nextExecutionTimestampInMilliseconds: currentTimestampInMilliseconds() + delayInMilliseconds
            });

            return intervalIdentifier as unknown as ReturnType<typeof globalThis.setInterval>;
        },

        clearInterval(intervalIdentifier) {
            intervalRegistrations.delete(intervalIdentifier as unknown as number);
        }
    };
}

export function createDeterministicWallClock(options: DeterministicWallClockOptions = {}): DeterministicWallClock {
    const { initialCurrentTimestampInMilliseconds = 0 } = options;

    let currentTimestampInMilliseconds = initialCurrentTimestampInMilliseconds;
    function currentTimestampReader(): number {
        return currentTimestampInMilliseconds;
    }
    const timeoutController = createTimeoutController(currentTimestampReader);
    const intervalController = createIntervalController(currentTimestampReader);

    return {
        get currentTimestampInMilliseconds() {
            return currentTimestampInMilliseconds;
        },

        get currentDate() {
            return new Date(currentTimestampInMilliseconds);
        },

        setCurrentTimestampInMilliseconds(nextTimestampInMilliseconds) {
            currentTimestampInMilliseconds = nextTimestampInMilliseconds;
        },

        advanceByMilliseconds(delayInMilliseconds) {
            validateTimeoutDelayInMilliseconds(delayInMilliseconds);

            currentTimestampInMilliseconds += delayInMilliseconds;
            intervalController.runDueIntervalRegistrations();
            timeoutController.runDueTimeoutRegistrations();
        },

        setTimeout: timeoutController.setTimeout,

        clearTimeout: timeoutController.clearTimeout,

        setInterval: intervalController.setInterval,

        clearInterval: intervalController.clearInterval
    };
}
