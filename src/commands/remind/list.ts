import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { JobStatus } from '../../interfaces/IJob';
import { reminderList } from '../../modals/reminderList';
import { getReminders } from '../../services/reminder';

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
    const activeJobs = await app.jobsCache.getOnUser(JobStatus.ACTIVE, context.getSender().id);
    const pausedJobs = await app.jobsCache.getOnUser(JobStatus.PAUSED, context.getSender().id);

    const triggerId = context.getTriggerId();

    if (triggerId) {
        const modal = await reminderList({
            app,
            jobList: activeJobs,
            pausedJobs,
            user: context.getSender(),
            modify,
            status: 'active',
        });

        await modify.getUiController().openModalView(modal, { triggerId }, context.getSender());
    }
}
