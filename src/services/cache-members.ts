import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { OeReminderApp as AppClass } from "../../OeReminderApp";
import { getMembersByRoom } from "../lib/helpers";

export class MembersCache {
    private _members: Array<IUser>;
    private _expire: number;
    private _expirationTime: number = 1800000; // 30 minutes

    constructor(private readonly app: AppClass) {}

    public async getMembers(): Promise<Array<IUser>> {
        if (this._members && this.isValid()) {
            return this._members;
        }

        const members = await getMembersByRoom(this.app, this.app.defaultChannel, this.app.getAccessors().reader);

        this._members = members;
        this._expire = Date.now() + this._expirationTime;

        return members;
    }

    public isValid(): boolean {
        return this._expire > Date.now();
    }

    get members(): Array<IUser> {
        return this._members;
    }
}
