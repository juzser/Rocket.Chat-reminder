import { IModify, IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ButtonStyle, UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import { ButtonElement, LayoutBlock } from '@rocket.chat/ui-kit';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { Lang } from '../lang/index';
import { IJob, JobStatus, JobTargetType, JobType } from '../interfaces/IJob';
import { getWeekDayName } from '../lib/helpers';

export async function reminderList({ app, jobList, pausedJobs, user, modify, status }: {
    app: AppClass;
    jobList: IJob[];
    pausedJobs?: IJob[];
    user: IUser;
    modify: IModify;
    status?: 'active' | 'finished' | 'paused';
}): Promise<IUIKitSurfaceViewParam> {
    const { lang } = new Lang(app.appLanguage);

    const block: LayoutBlock[] = [];

    let caption = '';
    if (!status || status === 'active' || status === 'paused') {
        caption = lang.reminder.listModal.caption_active(jobList.length, pausedJobs && pausedJobs.length || 0);
    } else {
        caption = lang.reminder.listModal.caption_finished(jobList.length);
    }

    block.push({
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: caption,
        },
        accessory: {
            type: 'button',
            appId: app.getID(),
            blockId: 'reminderList',
            actionId: 'reminder-list-view',
            text: {
                type: 'plain_text',
                text: status !== 'finished' ? lang.reminder.listModal.view_finished : lang.reminder.listModal.view_active,
            },
            value: status !== 'finished' ? 'finished' : 'active',
        }
    }, {
        type: 'divider',
    })

    // Paused jobs
    if (pausedJobs && pausedJobs.length > 0) {
        block.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: lang.reminder.listModal.list_paused,
            },
        });

        pausedJobs.forEach((job, index) => {
            const subBlocks = generateJobBlock({ app, lang, job, timeOffset: user.utcOffset });
            block.push(...subBlocks);
        });
    }

    // Active jobs
    if (jobList.length === 0) {
        block.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: lang.reminder.listModal.no_reminders,
            }
        });
    } else {
        block.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: status === 'finished'
                    ? lang.reminder.listModal.list_finished
                    : lang.reminder.listModal.list_active,
            },
        });

        jobList.forEach((job, index) => {
            const subBlocks = generateJobBlock({ app, lang, job, timeOffset: user.utcOffset });
            block.push(...subBlocks);
        });
    }

    return {
        type: UIKitSurfaceType.MODAL,
        id: 'modal-reminder-list',
        title: {
            type: 'plain_text',
            text: lang.reminder.listModal.heading,
        },
        close: {
            type: 'button',
            appId: app.getID(),
            blockId: 'reminderList',
            actionId: 'reminder-list-close',
            text: {
                type: 'plain_text',
                text: lang.common.close,
            }
        },
        blocks: block,
    };
}

function generateJobBlock({ app, lang, job, timeOffset }: {
    app: AppClass;
    lang: Record<string, any>;
    job: IJob;
    timeOffset: number
}): LayoutBlock[] {
    const [year, month, day] = job.whenDate.split('-');
    const [hour, minute] = job.whenTime.split(':');

    let when = `${hour}:${minute} - ${day}/${month}`;
    let repeatLabel = '';

    switch(job.type) {
        case JobType.DAILY:
            repeatLabel = lang.reminder.createModal.repeat_options.daily;
            when = `${hour}:${minute}`;
            break;
        case JobType.WEEKDAYS:
            repeatLabel = lang.reminder.createModal.repeat_options.weekdays_pure;
            when = `${hour}:${minute}`;
            break;
        case JobType.WEEKLY:
            repeatLabel = lang.reminder.createModal.repeat_options.weekly;
            const weekday = getWeekDayName(app, job.whenDate);
            when = `${hour}:${minute} - ${weekday}`;
            break;
        case JobType.BIWEEKLY:
            repeatLabel = lang.reminder.createModal.repeat_options.biweekly;
            const biweekday = getWeekDayName(app, job.whenDate);
            when = `${hour}:${minute} - ${biweekday}`;
            break;
        case JobType.MONTHLY:
            repeatLabel = lang.reminder.createModal.repeat_options.monthly;
            when = `${hour}:${minute} - ${lang.date.day.toLowerCase()} ${day}`;
            break;
    }

    // Build target string
    let target = '';
    if (job.targetType === JobTargetType.USER) {
        if (Array.isArray(job.target)) {
            target = job.target.map((target) => `**${target}**`).join(' ');
        }
    }

    if (job.targetType === JobTargetType.CHANNEL) {
        if (!Array.isArray(job.target)) {
            target = `channel **${job.target}**`;
        }
    }

    // Build title
    const title = job.type === JobType.ONCE
        ? lang.reminder.jobBlock.title_once(when, target)
        : lang.reminder.jobBlock.title_repeat(when, repeatLabel.toLowerCase(), target);

    // Get next run time
    let nextRun = '';
    if (job.nextRunAt) {
        // Format next run time to hh:mm - dd/mm (24 hour format)
        const nextRunAt = new Date(job.nextRunAt + timeOffset * 60 * 60 * 1000);
        const hour = nextRunAt.getHours().toString().padStart(2, '0');
        const minute = nextRunAt.getMinutes().toString().padStart(2, '0');
        const day = nextRunAt.getDate().toString().padStart(2, '0');
        const month = (nextRunAt.getMonth() + 1).toString().padStart(2, '0');

        nextRun = lang.reminder.jobBlock.next_run_at(`${hour}:${minute} - ${day}/${month}`);
    }

    // Job content
    const block: LayoutBlock[] = [];
    block.push({
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text: `${title}${nextRun ? `\n${nextRun}` : ''}\n
                **${lang.reminder.jobBlock.message}**\n${job.message}
                `
            },
        ],
    });

    // Build buttons
    const buttonPause = job.status === JobStatus.PAUSED
        ? {
            type: 'button',
            actionId: `job-resume--${job.id}`,
            text: {
                type: 'mrkdwn',
                text: lang.reminder.jobBlock.button_resume,
            },
            value: `job-resume--${job.id}`,
        }
        : {
            type: 'button',
            actionId: `job-pause--${job.id}`,
            text: {
                type: 'mrkdwn',
                text: lang.reminder.jobBlock.button_pause,
            },
            value: `job-pause--${job.id}`,
        };

    const buttonCancel = {
        type: 'button',
        actionId: `job-cancel--${job.id}`,
        text: {
            type: 'mrkdwn',
            text: lang.reminder.jobBlock.button_remove,
        },
        style: ButtonStyle.DANGER,
        value: `job-cancel--${job.id}`,
    };

    // Still active
    if (job.status === JobStatus.ACTIVE) {
        block.push({
            type: 'actions',
            blockId: `job-actions--active--${job.id}`,
            elements: [
                buttonPause as ButtonElement,
                buttonCancel as ButtonElement,
            ],
        });
    }

    // Paused
    if (job.status === JobStatus.PAUSED) {
        block.push({
            type: 'actions',
            blockId: `job-actions--paused--${job.id}`,
            elements: [
                buttonPause as ButtonElement,
                buttonCancel as ButtonElement,
            ],
        });
    }

    // Finished
    if (job.status === JobStatus.FINISHED) {
        block.push({
            type: 'actions',
            blockId: `job-actions--finished--${job.id}`,
            elements: [
                buttonCancel as ButtonElement,
            ],
        });
    }

    block.push({
        type: 'divider',
    });

    return block;
}
