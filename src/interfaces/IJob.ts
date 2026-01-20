export enum JobType {
    DAILY = 'daily',
    WEEKDAYS = 'weekdays',
    WEEKLY = 'weekly',
    BIWEEKLY = 'biweekly',
    MONTHLY = 'monthly',
    ONCE = 'once',
}

export enum JobStatus {
    ACTIVE = 'active',
    FINISHED = 'finished', // completed
    CANCELED = 'canceled',
    PAUSED = 'paused',
}

export enum JobTargetType {
    SELF = 'self',
    USER = 'user',
    CHANNEL = 'channel',
}

export interface IJob {
    id: string; // username + timestamp
    jobId: string;
    user: string; // user id
    room: string; // room id
    type: JobType;
    message: string;
    createdAt: number; // timestamp
    status: JobStatus;
    whenDate: string; // yyyy-mm-dd
    whenTime: string; // hh:mm
    lastRunAt?: number; // timestamp
    nextRunAt?: number; // timestamp
    targetType?: JobTargetType;
    target?: string | string[]; // room id or user id
    referenceMessageId?: string; // message id
}

export interface IJobFormData {
    whenDate: string;
    whenTime: string;
    repeat: JobType;
    message: string;
    targetType: JobTargetType;
    targetUsers?: string[];
    targetChannel?: string;
}
