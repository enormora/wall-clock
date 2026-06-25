export type WallClock = {
    readonly currentTimeMilliseconds: () => number;
};

export type WallClockDependencies = {
    readonly currentTimeMilliseconds: () => number;
};

export const createWallClock = (
    dependencies: WallClockDependencies = {
        currentTimeMilliseconds: () => {
            return Date.now();
        }
    }
): WallClock => {
    return {
        currentTimeMilliseconds: dependencies.currentTimeMilliseconds
    };
};
