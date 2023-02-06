import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { BlockBuilder, BlockElementType, ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { lang } from '../lang/index';
import { IJob, JobStatus, JobTargetType, JobType } from '../interfaces/IJob';
import { getWeekDayName } from '../lib/helpers';

export async function reminderList({ app, jobList, pausedJobs, user, modify, status }: {
    app: AppClass;
    jobList: IJob[];
    pausedJobs?: IJob[];
    user: IUser;
    modify: IModify;
    status?: 'active' | 'finished';
}): Promise<IUIKitModalViewParam> {
    const block = modify.getCreator().getBlockBuilder();

    let caption = '';
    if (!status || status === 'active') {
        caption = lang.reminder.listModal.caption_active(jobList.length, pausedJobs && pausedJobs.length || 0);
    } else {
        caption = lang.reminder.listModal.caption_finished(jobList.length);
    }

    block
        .addSectionBlock({
            text: block.newMarkdownTextObject(caption),
            accessory: {
                type: BlockElementType.BUTTON,
                actionId: 'reminder-list-view',
                text: block.newPlainTextObject(status === 'active' ? lang.reminder.listModal.view_finished : lang.reminder.listModal.view_active),
                value: status === 'active' ? 'finished' : 'active',
            }
        })
        .addDividerBlock();

    // Paused jobs
    if (pausedJobs && pausedJobs.length > 0) {
        block.addSectionBlock({
            text: block.newMarkdownTextObject(lang.reminder.listModal.list_paused),
        });

        pausedJobs.forEach((job, index) => {
            generateJobBlock({ block, job, index: index + 1, timeOffset: user.utcOffset });
        });

        block.addDividerBlock();
    }

    // Active jobs
    if (jobList.length === 0) {
        block.addSectionBlock({
            text: block.newMarkdownTextObject(lang.reminder.listModal.no_reminders),
        });
    } else {
        block.addSectionBlock({
            text: block.newMarkdownTextObject(status === 'finished'
                ? lang.reminder.listModal.list_finished
                : lang.reminder.listModal.list_active
            ),
        });
        jobList.forEach((job, index) => {
            generateJobBlock({ block, job, index: index + 1, timeOffset: user.utcOffset });
        });
    }

    return {
        id: 'modal-reminder-list',
        title: block.newPlainTextObject(lang.reminder.listModal.heading),
        close: block.newButtonElement({
            text: block.newPlainTextObject(lang.common.close),
        }),
        blocks: block.getBlocks(),
    };
}

function generateJobBlock({ block, job, index, timeOffset }: { block: BlockBuilder; job: IJob; index: number, timeOffset: number }) {
    const [day, month, year] = job.whenDate.split('/');
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
            const weekday = getWeekDayName(job.whenDate);
            when = `${hour}:${minute} - ${weekday}`;
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
    block
        .addContextBlock({
            elements: [
                block.newMarkdownTextObject(`${title}${nextRun ? `\n${nextRun}` : ''}\n
                **${lang.reminder.jobBlock.message}**\n${job.message}
                `),
            ],
        });

    // Build buttons
    const buttonPause = job.status === JobStatus.PAUSED
        ? {
            actionId: `job-resume--${job.id}`,
            text: block.newMarkdownTextObject(lang.reminder.jobBlock.button_resume),
            value: `job-resume--${job.id}`,
        }
        : {
            actionId: `job-pause--${job.id}`,
            text: block.newMarkdownTextObject(lang.reminder.jobBlock.button_pause),
            value: `job-pause--${job.id}`,
        }

    const buttonCancel = {
        actionId: `job-cancel--${job.id}`,
        text: block.newMarkdownTextObject(lang.reminder.jobBlock.button_remove),
        style: ButtonStyle.DANGER,
        value: `job-cancel--${job.id}`,
    }

    // Still active
    if (job.status === JobStatus.ACTIVE) {
        block
            .addActionsBlock({
                blockId: `job-actions--active--${job.id}`,
                elements: [
                    block.newButtonElement(buttonPause),
                    block.newButtonElement(buttonCancel),
                ],
            });
    }

    // Paused
    if (job.status === JobStatus.PAUSED) {
        block
            .addActionsBlock({
                blockId: `job-actions--paused--${job.id}`,
                elements: [
                    block.newButtonElement(buttonPause),
                    block.newButtonElement(buttonCancel),
                ],
            });
    }

    // Finished
    if (job.status === JobStatus.FINISHED) {
        block
            .addActionsBlock({
                blockId: `job-actions--finished--${job.id}`,
                elements: [
                    block.newButtonElement(buttonCancel),
                ],
            });
    }

    block.addDividerBlock();
}
