import { IPersistence } from "@rocket.chat/apps-engine/definition/accessors";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { IJob, JobStatus, JobType } from "../interfaces/IJob";

const REMINDER_KEY = 'reminder';

export async function setReminder({ persis, data }: {
    persis: IPersistence,
    data: IJob,
}): Promise<boolean> {
    const associations: RocketChatAssociationRecord[] = [
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, REMINDER_KEY),
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `reminder-type-${data.type}`),
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `reminder-status-${data.status}`),
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `job-${data.jobId}`),
        new RocketChatAssociationRecord(RocketChatAssociationModel.USER, data.user),
    ];

    try {
        await persis.updateByAssociations(associations, data, true);
    } catch (err) {
        console.warn(err);
        return false;
    }

    return true;
}

export async function removeReminder({ persis, jobId }: {
    persis: IPersistence,
    jobId: string,
}): Promise<boolean> {
    const associations: RocketChatAssociationRecord[] = [
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, REMINDER_KEY),
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `job-${jobId}`),
    ];

    try {
        await persis.removeByAssociations(associations);
    } catch (err) {
        console.warn(err);
        return false;
    }

    return true;
}

export async function getReminders({ persis, type, status, user, jobId }: {
    persis: IPersistence,
    type?: JobType,
    status?: JobStatus,
    user?: string,
    jobId?: string,
}): Promise<IJob[]> {
    const associations: RocketChatAssociationRecord[] = [
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, REMINDER_KEY),
    ];

    if (type) {
        associations.push(new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `reminder-type-${type}`));
    }

    if (status) {
        associations.push(new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `reminder-status-${status}`));
    }

    if (user) {
        associations.push(new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user));
    }

    if (jobId) {
        associations.push(new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `job-${jobId}`));
    }

    try {
        const result = await persis.removeByAssociations(associations);
        return result as IJob[];
    } catch (err) {
        console.warn(err);
        return [];
    }
}
