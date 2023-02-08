import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ButtonStyle, IOptionObject } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';

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
}): Promise<IUIKitModalViewParam> {
    const { lang } = new Lang(user.settings?.preferences?.language);

    const block = modify.getCreator().getBlockBuilder();

    const userTzOffset = user.utcOffset * 60 * 60 * 1000;

    const today = new Date().getTime() + userTzOffset;
    const todayFormated = convertTimestampToDate(today);
    const currentHour = new Date(today + 60 * 60 * 1000).getHours();
    const hours = currentHour < 10 ? `0${currentHour}` : currentHour;

    const repeatOptions = [
        {
            text: block.newPlainTextObject(lang.reminder.createModal.repeat_options.once),
            value: JobType.ONCE,
        },
        {
            text: block.newPlainTextObject(lang.reminder.createModal.repeat_options.daily),
            value: JobType.DAILY,
        },
        {
            text: block.newPlainTextObject(lang.reminder.createModal.repeat_options.weekdays),
            value: JobType.WEEKDAYS,
        },
        {
            text: block.newPlainTextObject(lang.reminder.createModal.repeat_options.weekly),
            value: JobType.WEEKLY,
        },
        {
            text: block.newPlainTextObject(lang.reminder.createModal.repeat_options.monthly),
            value: JobType.MONTHLY,
        },
    ];

    const targetTypeOptions: IOptionObject[] = [
        {
            text: block.newPlainTextObject(lang.reminder.createModal.target_type_options.self),
            value: JobTargetType.SELF,
        },
    ];

    if (app.maxUserRemind && app.maxUserRemind > 0) {
        targetTypeOptions.push({
            text: block.newPlainTextObject(lang.reminder.createModal.target_type_options.user),
            value: JobTargetType.USER,
        });
    }

    if (app.enableRemindChannel) {
        targetTypeOptions.push({
            text: block.newPlainTextObject(lang.reminder.createModal.target_type_options.channel),
            value: JobTargetType.CHANNEL,
        });
    }

    // Display ref message
    if (refMessage) {
        const roomName = await getRoomName(read, refMessage.room);

        block
            .addSectionBlock({
                text: block.newMarkdownTextObject(
                    lang.reminder.createModal.ref_message_caption(truncate(roomName, 40))
                ),
            })
            .addContextBlock({
                elements: [
                    block.newMarkdownTextObject(`
                    ${lang.reminder.createModal.ref_message_author(refMessage.sender.username)}
                    ${lang.reminder.createModal.ref_message_content(truncate(refMessage.text || '', 100))}`),
                ]
            })
            .addDividerBlock();
    }

    block
        .addInputBlock({
            blockId: 'reminderData',
            label: block.newMarkdownTextObject(`**${lang.reminder.createModal.when}:**`),
            element: block.newPlainTextInputElement({
                actionId: 'whenDate',
                placeholder: block.newPlainTextObject('dd/mm/yyyy'),
                initialValue: todayFormated,
            }),
        })
        .addInputBlock({
            blockId: 'reminderData',
            label: block.newPlainTextObject(lang.reminder.createModal.time),
            element: block.newPlainTextInputElement({
                actionId: 'whenTime',
                placeholder: block.newPlainTextObject('hh:mm'),
                initialValue: `${hours}:00`,
            }),
        })
        .addInputBlock({
            blockId: 'reminderData',
            label: block.newPlainTextObject(lang.reminder.createModal.repeat),
            element: block.newStaticSelectElement({
                actionId: 'repeat',
                placeholder: block.newPlainTextObject(lang.reminder.createModal.repeat),
                initialValue: 'once',
                options: repeatOptions,
            }),
        })
        .addInputBlock({
            blockId: 'reminderData',
            label: block.newPlainTextObject(lang.reminder.createModal.message),
            element: block.newPlainTextInputElement({
                actionId: 'message',
                placeholder: block.newPlainTextObject(lang.reminder.createModal.message_placeholder),
                multiline: true,
            })
        })
        .addDividerBlock()
        .addSectionBlock({
            text: block.newMarkdownTextObject(`**${lang.reminder.createModal.remind_to}:**`),
        })
        .addActionsBlock({
            blockId: 'reminderData',
            elements: [
                block.newStaticSelectElement({
                    actionId: 'targetType',
                    placeholder: block.newPlainTextObject(lang.reminder.createModal.target_type),
                    initialValue: targetType || JobTargetType.SELF,
                    options: targetTypeOptions,
                }),
            ],
        })

    // Build user list
    if (targetType === JobTargetType.USER) {
        // Load members from cache
        await app.membersCache.getMembers();

        if (app.membersCache.members) {
            const users = app.membersCache.members;

            const userOptions = getMemberOptions(users);

            block.addInputBlock({
                blockId: 'reminderData',
                label: block.newPlainTextObject(lang.reminder.createModal.target_user(app.maxUserRemind)),
                element: block.newMultiStaticElement({
                    actionId: 'targetUsers',
                    placeholder: block.newPlainTextObject(lang.reminder.createModal.target_user_placeholder(app.maxUserRemind)),
                    options: userOptions,
                }),
            });
        }
    }

    if (targetType === JobTargetType.CHANNEL) {
        block.addInputBlock({
            blockId: 'reminderData',
            label: block.newPlainTextObject(lang.reminder.createModal.target_channel_placeholder),
            element: block.newPlainTextInputElement({
                actionId: 'targetChannel',
                placeholder: block.newPlainTextObject(`#${app.defaultChannelName}`),
                // initialValue: `#${app.defaultChannelName}`,
            }),
        });
    }

    return {
        id: `modal-reminder-create--${room.id}${refMessage ? `--${refMessage.id}` : ''}`,
        title: block.newPlainTextObject(lang.reminder.createModal.heading),
        submit: block.newButtonElement({
            text: block.newPlainTextObject(lang.common.confirm),
            style: ButtonStyle.PRIMARY,
        }),
        close: block.newButtonElement({
            text: block.newPlainTextObject(lang.common.cancel),
        }),
        blocks: block.getBlocks(),

    };
}
