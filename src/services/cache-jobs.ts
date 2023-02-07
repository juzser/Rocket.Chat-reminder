import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { OeReminderApp as AppClass } from "../../OeReminderApp";
import { IJob, JobStatus } from "../interfaces/IJob";
import { getReminders } from "./reminder";

type IJobsCache = {
    jobs: IJob[];
    valid: number;
};

export class JobsCache {
    private _jobs: Record<string, IJobsCache> = {};
    private _expirationTime: number = 1800000; // 30 minutes

    constructor(private readonly app: AppClass) {}

    public async getOnUser(status: JobStatus, userId: string): Promise<IJob[]> {
        if (this._jobs[userId] && this._jobs[userId].jobs && this.isValid(this._jobs[userId].valid)) {
            // Filter again to pick current status only
            const jobs = this._jobs[userId].jobs.filter((j) => j.status === status);

            return jobs as IJob[];
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
            jobs: allJobs,
            valid: validTime,
        };

        return jobs;
    }

    public setOnUser(userId: string, jobs: IJob[]): void {
        this._jobs[userId] = {
            ...this._jobs[userId],
            jobs,
        };
    }

    public setOnUserByJobId(userId: string, id: string, newData: Partial<IJob>): void {
        const jobs = this._jobs[userId] && this._jobs[userId].jobs;

        if (jobs) {
            const index = jobs.findIndex((j) => j.id === id);

            if (index >= 0) {
                jobs[index] = { ...jobs[index], ...newData };
                this._jobs[userId].jobs = jobs;
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
