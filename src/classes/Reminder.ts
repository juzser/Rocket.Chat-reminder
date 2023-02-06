import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IJobContext } from '@rocket.chat/apps-engine/definition/scheduler';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { OeReminderApp as App } from '../../OeReminderApp';
import { IJob, IJobFormData, JobStatus, JobTargetType, JobType } from '../interfaces/IJob';
import { lang } from '../lang/index';
import { AppConfig } from '../lib/config';
import { getDirect, getWhenDateTime, notifyUser, getNextRunAt } from '../lib/helpers';
import { ReminderMessage } from '../messages/reminder';
import { getReminders, setReminder } from '../services/reminder';

export class Reminder {
    constructor(private readonly app: App) {}

    public async create({ formData, room, read, modify, persis, user }: {
        formData: IJobFormData,
        room: IRoom,
        read: IRead;
        modify: IModify;
        persis: IPersistence,
        user: IUser,
    }) {
        const whenDateTime = getWhenDateTime({ whenDate: formData.whenDate, whenTime: formData.whenTime, offset: user.utcOffset });
        const triggerTime = whenDateTime.getTime();

        // Validate form data
        const validation = this.formValidation({ formData, whenUTCTimestamp: triggerTime });

        if (validation !== true) {
            throw validation;
        }

        const targetUsers: IUser[] = [];

        if (formData.targetType === JobTargetType.USER && formData.targetUsers) {
            for (const t of formData.targetUsers) {
                const tUser = await read.getUserReader().getByUsername(t);

                if (tUser) {
                    targetUsers.push(tUser);
                }
            }

            if (!targetUsers.length) {
                throw { targetUsers: 'Invalid user' };
            }

            if (targetUsers.length > this.app.maxUserRemind) {
                throw { targetUsers: `Cannot remind more than ${this.app.maxUserRemind} users` };
            }
        }

        if (formData.targetType === JobTargetType.CHANNEL && formData.targetChannel) {
            const channelName = formData.targetChannel.replace('#', '');
            const tChannel = await read.getRoomReader().getByName(channelName);

            if (!tChannel) {
                throw { targetChannel: 'Invalid channel' };
            }
        }

        // Convert time to agenda format
        const when = new Date(whenDateTime).toISOString();
        const createdAt = new Date().getTime();

        // Create job
        const jobId = await modify.getScheduler().scheduleOnce({
            id: AppConfig.jobKey,
            when,
            data: { id: `${user.username}-${createdAt}` },
        });

        if (!jobId) {
            return await notifyUser({
                app: this.app,
                message: 'Failed to create reminder',
                room,
                user,
                modify,
            });
        }

        // Save to db
        const jobData: IJob = {
            id: `${user.username}-${createdAt}`,
            jobId,
            createdAt,
            user: user.id,
            room: room.id,
            type: formData.repeat,
            message: formData.message,
            status: JobStatus.ACTIVE,
            whenDate: formData.whenDate,
            whenTime: formData.whenTime,
            ...formData.targetType && { targetType: formData.targetType },
            ...formData.targetType === JobTargetType.USER && { target: formData.targetUsers },
            ...formData.targetType === JobTargetType.CHANNEL && { target: formData.targetChannel },
        }
        await setReminder({ persis, data: jobData });

        // Purge cache of jobs
        this.app.jobsCache.purge(user.id);

        // Notify user, created successfully
        await notifyUser({
            app: this.app,
            message: lang.reminder.createModal.create_success,
            user,
            room,
            modify,
        });
    }

    public async cancel({ id, read, modify, persis }: {
        id: string,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
    }) {
        // Get job data
        const jobs = await getReminders({ read, id });
        const jobData = jobs && jobs[0];

        // Cancel job
        await modify.getScheduler().cancelJob(jobData.jobId);

        // Update job data & cache
        await setReminder({ persis, data: { ...jobData, status: JobStatus.CANCELED } });
        this.app.jobsCache.setOnUserByJobId(jobData.status, jobData.user, id, { status: JobStatus.CANCELED });

        return true;
    }

    public async processor({ job, read, modify, persis }: {
        job: IJobContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
    }) {
        // Get job data
        const jobs = await getReminders({ read, id: job.id });
        const jobData = jobs && jobs[0];

        // Check if job is active
        if (!jobData || jobData.status !== JobStatus.ACTIVE) {
            return;
        }

        // Check if user is active or removed
        const user = await read.getUserReader().getById(jobData.user);
        if (!user.isEnabled) {
            // Update job data & remove user from cache
            await setReminder({ persis, data: { ...jobData, status: JobStatus.FINISHED } });
            this.app.jobsCache.purge(jobData.user);
            return;
        }

        /**
         * Prepare data to send message
         */
        // Check target type & send to target
        const room: IRoom[] = [];

        if (jobData.targetType === JobTargetType.SELF) {
            const directRoom = await getDirect(this.app, user.username, read, modify);
            if (directRoom) {
                room.push(directRoom);
            }
        }

        if (jobData.targetType === JobTargetType.USER && jobData.target) {
            if (Array.isArray(jobData.target) && jobData.target.length) {
                for (const t of jobData.target) {
                    const tUser = await read.getUserReader().getById(t);
                    if (tUser) {
                        const directRoom = await getDirect(this.app, tUser.username, read, modify);
                        if (directRoom) {
                            room.push(directRoom);
                        }
                    }
                }
            }
        }

        if (jobData.targetType === JobTargetType.CHANNEL && jobData.target) {
            if (!Array.isArray(jobData.target)) {
                const channelName = jobData.target.replace('#', '');
                const tChannel = await read.getRoomReader().getByName(channelName);
                if (tChannel) {
                    room.push(tChannel);
                }
            }
        }

        if (!room.length) {
            await notifyUser({ app: this.app, message: `Failed to send reminder ${jobData.id}`, room: this.app.defaultChannel, user, modify })
            return;
        }

        /**
         * Trigger the job!
         */
        for (const r of room) {
            await ReminderMessage({ app: this.app, owner: user, jobData, modify, room: r  });
        }

        const newJobData = { ...jobData, lastRunAt: new Date().getTime() };

        // Trigger repeat if the job is repeatable
        if (jobData.type !== JobType.ONCE) {
            const nextRunAt = getNextRunAt({
                type: jobData.type,
                whenDate: jobData.whenDate,
                whenTime: jobData.whenTime,
                offset: user.utcOffset,
            });

            if (nextRunAt) {
                const nextJobId = await modify.getScheduler().scheduleOnce({
                    id: AppConfig.jobKey,
                    when: nextRunAt.toISOString(),
                    data: { id: `${user.username}-${jobData.createdAt}` },
                });

                if (nextJobId) {
                    newJobData.jobId = nextJobId;
                    newJobData.nextRunAt = nextRunAt.getTime();
                }
            }
        } else {
            // ONCE - Update job status & cache
            newJobData.status = JobStatus.FINISHED;

            this.app.jobsCache.setOnUserByJobId(
                jobData.status,
                jobData.user,
                jobData.id,
                { status: JobStatus.FINISHED },
            )
        }

        // Update job data
        await setReminder({
            persis,
            data: newJobData,
        });
    }

    public async migrate({ read, modify, persis }: {
        read: IRead,
        modify: IModify,
        persis: IPersistence,
    }) {
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
    }

    private formValidation({ formData, whenUTCTimestamp }: {
        formData: IJobFormData;
        whenUTCTimestamp: number;
    }): Record<string, string> | true {
        const {
            whenDate,
            whenTime,
            message,
            targetType,
            targetUsers,
            targetChannel,
        } = formData;

        const currentTime = new Date().getTime();

        // Check if date empty or invalid
        // dd/mm/yyyy
        if (!whenDate || !whenDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return { whenDate: 'Invalid date' };
        }

        // Check if time empty or invalid
        // hh:mm
        if (!whenTime || !whenTime.match(/^\d{2}:\d{2}$/)) {
            return { whenTime: 'Invalid time' };
        }

        // Check if the date time is in the past
        if (whenUTCTimestamp < currentTime) {
            return { whenTime: 'Cannot remind at past' };
        }

        // Check if message is empty
        if (!message) {
            return { message: 'Message cannot be empty' };
        }

        // Check if target is not self but no target is selected
        if (targetType === JobTargetType.USER) {
            if (!targetUsers || !targetUsers.length) {
                return { targetUsers: 'Please select at least one user' };
            }
        }

        if (targetType === JobTargetType.CHANNEL) {
            if (!targetChannel) {
                return { targetChannel: 'Please fill a channel' };
            }
        }

        return true;
    }
}
