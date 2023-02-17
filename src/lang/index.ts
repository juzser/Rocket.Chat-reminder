import { vi } from './vi';
import { en } from './en';

// export const lang = vi;

export class Lang {
    private _lang: Record<string, any> = {};

    constructor(private readonly locale?: string) {
        switch (locale) {
            // case 'vi-vn':
            //     this._lang = vi;
            //     break;
            default:
                this._lang = vi;
                break;
        }
    }

    get lang(): Record<string, any> {
        return this._lang;
    }
}
