export class ModuleTaget {
    isComment: boolean;
}

export const IS_COMMENT = { isComment: true } as ModuleTaget;
export const IS_POST = { isComment: false } as ModuleTaget;

export const MAX_LOAD_LAG: number = 2000;

export const HOUR_SECONDS: number = 60 * 60;
export const DAY_SECONDS: number = HOUR_SECONDS * 24;
