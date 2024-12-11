import { vi } from './vi';
import { en } from './en';
import { br } from './br';
import { fr } from './fr';
import { de } from './de';

// export const lang = vi;

export class Lang {
    private _lang: Record<string, any> = {};

    constructor(private readonly locale?: string) {
        switch (locale) {
            case 'vi-vn':
                this._lang = vi;
                break;
            case 'vi':
                this._lang = vi;
                break;
            case 'br':
                this._lang = br;
                break;
            case 'fr':
                this._lang = fr;
                break;
	        case 'de':
		        this._lang = de;
	            break;
            default:
                this._lang = en;
                break;
        }
    }

    get lang(): Record<string, any> {
        return this._lang;
    }
}
