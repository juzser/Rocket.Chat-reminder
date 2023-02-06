import { IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
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
        // new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `reminder-status-${data.status}`),
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `job-${data.id}`),
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

export async function removeReminder({ persis, id }: {
    persis: IPersistence,
    id: string,
}): Promise<boolean> {
    const associations: RocketChatAssociationRecord[] = [
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, REMINDER_KEY),
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `job-${id}`),
    ];

    try {
        await persis.removeByAssociations(associations);
    } catch (err) {
        console.warn(err);
        return false;
    }

    return true;
}

export async function getReminders({ read, type, user, id }: {
    read: IRead,
    type?: JobType,
    user?: string,
    id?: string,
}): Promise<IJob[]> {
    const associations: RocketChatAssociationRecord[] = [
        new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, REMINDER_KEY),
    ];

    if (type) {
        associations.push(new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `reminder-type-${type}`));
    }

    if (user) {
        associations.push(new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user));
    }

    if (id) {
        associations.push(new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `job-${id}`));
    }

    try {
        const result = await read.getPersistenceReader().readByAssociations(associations);
        return result as IJob[];
    } catch (err) {
        console.warn(err);
        return [];
    }
}
