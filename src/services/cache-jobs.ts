import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { OeReminderApp as AppClass } from "../../OeReminderApp";
import { IJob, JobStatus } from "../interfaces/IJob";
import { getReminders } from "./reminder";

type IJobsCache = {
    [key in JobStatus]?: IJob[];
} & {
    valid: number;
};

export class JobsCache {
    private _jobs: Record<string, IJobsCache> = {};
    private _expirationTime: number = 1800000; // 30 minutes

    constructor(private readonly app: AppClass) {}

    public async getOnUser(status: JobStatus, userId: string): Promise<IJob[]> {
        if (this._jobs[userId] && this._jobs[userId][status] && this.isValid(this._jobs[userId].valid)) {
            // Filter again to pick current status only
            this._jobs[userId][status] = this._jobs[userId][status]?.filter((j) => j.status === status);

            return this._jobs[userId][status] as IJob[];
        }

        const allJobs = await getReminders({
            read: this.app.getAccessors().reader,
            user: userId,
        });

        // Filter jobs by status
        const jobs = allJobs.filter((j) => j.status === status);

        // Set new valid time for cache
        const validTime = Date.now() + this._expirationTime;

        this._jobs[userId] = {
            ...this._jobs[userId],
            [status]: jobs,
            valid: validTime,
        };

        return jobs;
    }

    public setOnUser(status: JobStatus, userId: string, jobs: IJob[]): void {
        this._jobs[userId] = {
            ...this._jobs[userId],
            [status]: jobs,
        };
    }

    public setOnUserByJobId(status: JobStatus, userId: string, id: string, newData: Partial<IJob>): void {
        const jobs = this._jobs[userId][status];

        if (jobs) {
            const index = jobs.findIndex((j) => j.id === id);

            if (index >= 0) {
                jobs[index] = { ...jobs[index], ...newData };
            }
        }
    }

    public purge(userId: string): void {
        delete this._jobs[userId];
    }

    public isValid(validTime: number): boolean {
        return validTime > Date.now();
    }
}
