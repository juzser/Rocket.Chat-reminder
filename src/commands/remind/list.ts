import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { JobStatus } from '../../interfaces/IJob';
import { reminderList } from '../../modals/reminderList';

// Open modal to request time off
export async function ListCommand({ app, context, read, persis, modify, params }: {
    app: AppClass;
    context: SlashCommandContext;
    read: IRead;
    persis: IPersistence;
    modify: IModify
    params: string[];
}): Promise<void> {
    // Get active job data
    const triggerId = context.getTriggerId();

    if (triggerId) {
        openListModal({ app, user: context.getSender(), modify, triggerId });
    }
}

export async function openListModal({ app, user, modify, triggerId }: {
    app: AppClass;
    user: IUser;
    modify: IModify;
    triggerId: string;
}) {
    const activeJobs = await app.jobsCache.getOnUser(JobStatus.ACTIVE, user.id);
    const pausedJobs = await app.jobsCache.getOnUser(JobStatus.PAUSED, user.id);

    const modal = await reminderList({
        app,
        jobList: activeJobs,
        pausedJobs,
        user,
        modify,
        status: 'active',
    });

    await modify.getUiController().openSurfaceView(modal, { triggerId }, user);
}
