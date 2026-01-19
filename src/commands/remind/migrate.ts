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

    app.getLogger().log(`Migrating ${jobs.length} jobs`);

    await modify.getScheduler().cancelAllJobs();

    for (const job of jobs) {
        const newJobData = { ...job };
        const user = await read.getUserReader().getById(job.user);
        if (!user) {
            continue;
        }

        app.getLogger().log(`Migrating job ${job.jobId} for user ${user.username}`);

        const whenDate = job.whenDate.includes('/')
            ? job.whenDate.split('/').reverse().join('-')
            : job.whenDate;

        app.getLogger().log(`When date: ${whenDate}`);

        const nextRunAt = getNextRunAt({
            type: job.type,
            whenDate,
            whenTime: job.whenTime,
            offset: user.utcOffset,
        });

        if (nextRunAt) {
            // Remove old job
            await modify.getScheduler().cancelJob(job.jobId);

            const nextJobId = await modify.getScheduler().scheduleOnce({
                id: AppConfig.jobKey,
                when: nextRunAt,
                data: { id: `${user.username}-${job.createdAt}` },
            });

            if (nextJobId) {
                newJobData.jobId = nextJobId;
                newJobData.whenDate = whenDate;

                if (job.type !== 'once') {
                    newJobData.nextRunAt = nextRunAt.getTime();
                } else {
                    newJobData.nextRunAt = undefined;
                }
            }

            await setReminder({
                persis,
                data: newJobData,
            });

            // purge cache
            app.jobsCache.purge(job.user);
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
