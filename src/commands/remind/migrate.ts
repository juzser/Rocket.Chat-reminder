import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { JobStatus } from '../../interfaces/IJob';
import { AppConfig } from '../../lib/config';
import { getNextRunAt, notifyUser } from '../../lib/helpers';
import { getReminders, setReminder } from '../../services/reminder';

// Open modal to request time off
export async function MigrateCommand({ app, context, read, persis, modify }: {
    app: AppClass;
    context: SlashCommandContext;
    read: IRead;
    persis: IPersistence;
    modify: IModify
}): Promise<void> {
    // Check if user is admin
    const user = context.getSender();

    if (!user.roles.includes('admin')) {
        return;
    }

    const allJobs = await getReminders({ read });
    const jobs = allJobs.filter((j) => j.status === JobStatus.ACTIVE);

    for (const job of jobs) {
        const newJobData = { ...job };
        const user = await read.getUserReader().getById(job.user);
        if (!user) {
            continue;
        }

        const nextRunAt = getNextRunAt({
            type: job.type,
            whenDate: job.whenDate,
            whenTime: job.whenTime,
            offset: user.utcOffset,
        });

        if (nextRunAt) {
            const nextJobId = await modify.getScheduler().scheduleOnce({
                id: AppConfig.jobKey,
                when: nextRunAt.toISOString(),
                data: { id: `${user.username}-${job.createdAt}` },
            });

            if (nextJobId) {
                newJobData.jobId = nextJobId;
                newJobData.nextRunAt = nextRunAt.getTime();
            }

            await setReminder({
                persis,
                data: newJobData,
            });
        }
    }

    return await notifyUser({
        app,
        message: 'Migration completed',
        user,
        modify,
        room: context.getRoom(),
    });
}
