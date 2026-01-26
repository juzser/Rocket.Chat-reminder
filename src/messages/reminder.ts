import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage, IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { IJob, JobTargetType } from '../interfaces/IJob';
import { Lang } from '../lang/index';
import {
    convertTimestampToDate,
    convertTimestampToTime,
    formatMsgInAttachment,
    getRoomName,
    sendMessage,
    truncate
} from '../lib/helpers';

export async function ReminderMessage({ app, owner, jobData, read, modify, room, refMsg }: {
    app: AppClass;
    owner: IUser;
    jobData: IJob;
    read: IRead;
    modify: IModify;
    room: IRoom;
    refMsg?: IMessage;
}) {
    const { lang } = new Lang(app.appLanguage);
    let caption = lang.reminder.message.caption_self;

    if (jobData.targetType === JobTargetType.USER) {
        caption = lang.reminder.message.caption_user(owner.username);
    } else if (jobData.targetType === JobTargetType.CHANNEL) {
        caption = lang.reminder.message.caption_channel(owner.username);
    }

    let refMsgAttachment: IMessageAttachment | null = null;
    let dynamicLink = '';

    if (refMsg) {
        const siteUrlSetting = await read.getEnvironmentReader().getServerSettings().getValueById('Site_Url');
        const siteUrl = (siteUrlSetting || app.siteUrl).replace(/\/$/, '');

        const roomName = await getRoomName(read, refMsg.room);
        let roomPath = 'channel';

        if (refMsg.room.type === RoomType.DIRECT_MESSAGE) {
            roomPath = 'direct';
        } else if (refMsg.room.type === RoomType.PRIVATE_GROUP) {
            roomPath = 'group';
        }

        dynamicLink = `${siteUrl}/${roomPath}/${refMsg.room.id}?msg=${refMsg.id}`;

        const msgDate = refMsg.createdAt ? new Date(refMsg.createdAt).getTime() : '';
        const msgDateFormat = msgDate ? `${convertTimestampToTime(msgDate)} - ${convertTimestampToDate(msgDate)}` : '';
        const msgAvatar = refMsg.avatarUrl
            ? `${siteUrl}${refMsg.avatarUrl}`
            : `${siteUrl}/avatar/${refMsg.sender.username}`;

        caption += lang.reminder.message.caption_ref_msg(truncate(roomName, 40));

        refMsgAttachment = {
            color: '#E03C31',
            text: formatMsgInAttachment(refMsg.text || ''),
            title: {
                value: lang.reminder.message.title_ref_msg(msgDateFormat, roomName),
            },
            author: {
                name: refMsg.sender.username,
                icon: msgAvatar,
            },
        };
    }

    const userMessage = jobData.message.startsWith('[Pure]')
        ? jobData.message.split('[Pure]')[1].trim()
        : jobData.message;

    caption += `\n\n${userMessage}`;

    if (dynamicLink) {
        caption += `\n\n${dynamicLink}`;
    }

    return await sendMessage({
        app,
        modify,
        room,
        message: caption,
        attachments: refMsgAttachment ? [refMsgAttachment] : [],
        group: true,
    });
}
