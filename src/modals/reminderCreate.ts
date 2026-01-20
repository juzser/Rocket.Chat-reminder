import { IModify, IRead, IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ButtonStyle, UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { LayoutBlock, Option } from '@rocket.chat/ui-kit';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { Lang } from '../lang/index';
import { convertTimestampToDate, truncate, getMemberOptions, getRoomName } from '../lib/helpers';
import { JobTargetType, JobType } from '../interfaces/IJob';

export async function reminderCreate({ app, room, user, read, modify, targetType, refMessage }: {
    app: AppClass;
    room: IRoom;
    user: IUser;
    read: IRead;
    modify: IModify;
    targetType?: JobTargetType;
    refMessage?: IMessage;
}): Promise<IUIKitSurfaceViewParam> {
    const { lang } = new Lang(app.appLanguage);

    const block: LayoutBlock[] = [];

    const userTzOffset = user.utcOffset * 60 * 60 * 1000;

    const today = new Date().getTime() + userTzOffset;
    const todayFormated = convertTimestampToDate(today);
    const currentHour = new Date(today + 60 * 60 * 1000).getHours();
    const hours = currentHour < 10 ? `0${currentHour}` : currentHour;

    const repeatOptions: Option[] = [
        {
            text: {
                type: 'plain_text',
                text: lang.reminder.createModal.repeat_options.once,
            },
            value: JobType.ONCE,
        },
        {
            text: {
                type: 'plain_text',
                text: lang.reminder.createModal.repeat_options.daily,
            },
            value: JobType.DAILY,
        },
        {
            text: {
                type: 'plain_text',
                text: lang.reminder.createModal.repeat_options.weekdays,
            },
            value: JobType.WEEKDAYS,
        },
        {
            text: {
                type: 'plain_text',
                text: lang.reminder.createModal.repeat_options.weekly,
            },
            value: JobType.WEEKLY,
        },
        {
            text: {
                type: 'plain_text',
                text: lang.reminder.createModal.repeat_options.biweekly,
            },
            value: JobType.BIWEEKLY,
        },
        {
            text: {
                type: 'plain_text',
                text: lang.reminder.createModal.repeat_options.monthly,
            },
            value: JobType.MONTHLY,
        },
    ];

    const targetTypeOptions: Option[] = [
        {
            text: {
                type: 'plain_text',
                text: lang.reminder.createModal.target_type_options.self,
            },
            value: JobTargetType.SELF,
        },
    ];

    if (app.maxUserRemind && app.maxUserRemind > 0) {
        targetTypeOptions.push({
            text: {
                type: 'plain_text',
                text: lang.reminder.createModal.target_type_options.users,
            },
            value: JobTargetType.USER,
        });
    }

    if (app.enableRemindChannel) {
        targetTypeOptions.push({
            text: {
                type: 'plain_text',
                text: lang.reminder.createModal.target_type_options.channel,
            },
            value: JobTargetType.CHANNEL,
        });
    }

    // Display ref message
    if (refMessage) {
        const roomName = await getRoomName(read, refMessage.room);

        block.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: lang.reminder.createModal.ref_message_caption(truncate(roomName, 40)),
            },
        }, {
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: `
                    ${lang.reminder.createModal.ref_message_author(refMessage.sender.username)}
                    ${lang.reminder.createModal.ref_message_content(truncate(refMessage.text || '', 100))}`,
                },
            ],
        }, {
            type: 'divider',
        });
    }

    block.push({
        type: 'input',
        blockId: 'reminderData',
        label: {
            type: 'plain_text',
            text: lang.reminder.createModal.when,
        },
        element: {
            type: 'datepicker',
            appId: app.getID(),
            blockId: 'reminderData',
            actionId: 'whenDate',
            placeholder: {
                type: 'plain_text',
                text: 'yyyy-mm-dd',
            },
        }
    }, {
        type: 'input',
        blockId: 'reminderData',
        label: {
            type: 'plain_text',
            text: lang.reminder.createModal.time,
        },
        element: {
            type: 'time_picker',
            appId: app.getID(),
            blockId: 'reminderData',
            actionId: 'whenTime',
            placeholder: {
                type: 'plain_text',
                text: 'hh:mm',
            },
            initialTime: `${hours}:00`,
        }
    }, {
        type: 'input',
        blockId: 'reminderData',
        label: {
            type: 'plain_text',
            text: lang.reminder.createModal.repeat,
        },
        element: {
            type: 'static_select',
            appId: app.getID(),
            blockId: 'reminderData',
            actionId: 'repeat',
            placeholder: {
                type: 'plain_text',
                text: lang.reminder.createModal.repeat,
            },
            initialValue: 'once',
            options: repeatOptions,
        },
    }, {
        type: 'input',
        blockId: 'reminderData',
        label: {
            type: 'plain_text',
            text: lang.reminder.createModal.message,
        },
        element: {
            type: 'plain_text_input',
            appId: app.getID(),
            blockId: 'reminderData',
            actionId: 'message',
            placeholder: {
                type: 'plain_text',
                text: lang.reminder.createModal.message_placeholder,
            },
            multiline: true,
        }
    }, {
        type: 'divider',
    }, {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `**${lang.reminder.createModal.remind_to}:**`,
        },
    }, {
        type: 'actions',
        blockId: 'reminderData',
        elements: [
            {
                type: 'static_select',
                appId: app.getID(),
                blockId: 'reminderData',
                actionId: 'targetType',
                placeholder: {
                    type: 'plain_text',
                    text: lang.reminder.createModal.target_type,
                },
                initialValue: targetType || JobTargetType.SELF,
                options: targetTypeOptions,
            },
        ],
    });

    // Build user list
    if (targetType === JobTargetType.USER) {
        // Load members from cache
        await app.membersCache.getMembers();

        if (app.membersCache.members) {
            const users = app.membersCache.members;

            const userOptions = getMemberOptions(users);

            block.push({
                type: 'input',
                blockId: 'reminderData',
                label: {
                    type: 'plain_text',
                    text: lang.reminder.createModal.target_user(app.maxUserRemind),
                },
                element: {
                    type: 'multi_static_select',
                    appId: app.getID(),
                    blockId: 'reminderData',
                    actionId: 'targetUsers',
                    placeholder: {
                        type: 'plain_text',
                        text: lang.reminder.createModal.target_user_placeholder(app.maxUserRemind),
                    },
                    options: userOptions,
                },
            });
        }
    }

    if (targetType === JobTargetType.CHANNEL) {
        block.push({
            type: 'input',
            blockId: 'reminderData',
            label: {
                type: 'plain_text',
                text: lang.reminder.createModal.target_channel_placeholder,
            },
            element: {
                type: 'plain_text_input',
                appId: app.getID(),
                blockId: 'reminderData',
                actionId: 'targetChannel',
                placeholder: {
                    type: 'plain_text',
                    text: `#${app.defaultChannelName}`,
                },
            },
        });
    }

    return {
        type: UIKitSurfaceType.MODAL,
        id: `modal-reminder-create--${room.id}${refMessage ? `--${refMessage.id}` : ''}`,
        title: {
            type: 'plain_text',
            text: lang.reminder.createModal.heading,
        },
        submit: {
            appId: app.getID(),
            blockId: 'reminderDataSubmit',
            actionId: 'submit',
            type: 'button',
            text: {
                type: 'plain_text',
                text: lang.common.confirm,
            },
            style: ButtonStyle.PRIMARY,
        },
        close: {
            appId: app.getID(),
            blockId: 'reminderDataCancel',
            actionId: 'cancel',
            type: 'button',
            text: {
                type: 'plain_text',
                text: lang.common.cancel,
            },
        },
        blocks: block,
    };
}
