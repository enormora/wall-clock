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
