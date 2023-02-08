import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage, IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { IJob, JobTargetType, JobType } from '../interfaces/IJob';
import { Lang } from '../lang/index';
import { AppConfig } from '../lib/config';
import { convertTimestampToDate, convertTimestampToTime, generateMsgLink, getRoomName, sendMessage, truncate } from '../lib/helpers';

export async function ReminderMessage({ app, owner, jobData, read, modify, room, refMsg }: {
    app: AppClass;
    owner: IUser;
    jobData: IJob;
    read: IRead;
    modify: IModify;
    room: IRoom;
    refMsg?: IMessage;
}) {
    const { lang } = new Lang(owner.settings?.preferences?.language);

    let caption = lang.reminder.message.caption_self;

    if (jobData.targetType === JobTargetType.USER) {
        caption = lang.reminder.message.caption_user(owner.username);
    }

    if (jobData.targetType === JobTargetType.CHANNEL) {
        caption = lang.reminder.message.caption_channel(owner.username);
    }

    let refMsgAttachment: IMessageAttachment | null = null;
    if (refMsg) {
        const msgLink = await generateMsgLink(app, refMsg);
        const roomName = await getRoomName(read, refMsg.room);
        const msgDate = refMsg.createdAt ? new Date(refMsg.createdAt).getTime() : '';
        // hh:mm - dd/mm/yyyy
        const msgDateFormat = msgDate ? `${convertTimestampToTime(msgDate)} - ${convertTimestampToDate(msgDate)}` : '';
        const msgAvatar = refMsg.avatarUrl
            ? `${app.siteUrl}${refMsg.avatarUrl}`
            : `${app.siteUrl}avatar/${refMsg.sender.username}`;

        caption += lang.reminder.message.caption_ref_msg(truncate(roomName, 40));
        refMsgAttachment = {
            color: AppConfig.attachmentColor,
            text: refMsg.text,
            title: {
                link: msgLink,
                value: lang.reminder.message.title_ref_msg(msgDateFormat, roomName),
            },
            author: {
                name: refMsg.sender.username,
                icon: msgAvatar,
                // link: `${app.siteUrl}/direct/${refMsg.sender.username}`,
            },
        };
    }

    caption += ':';

    // const attachment: IMessageAttachment = {
    //     color: AppConfig.attachmentColor,
    //     text: jobData.message,
    // };

    caption += `\n\n${jobData.message}`;

    if (jobData.message.startsWith('[Pure]')) {
        const pureMsg = jobData.message.split('[Pure]')[1];
        // Trim msg
        caption = pureMsg.trim();
    }

    // Send message to activity room
    const msg = await sendMessage({
        app,
        modify,
        room,
        message: caption,
        attachments: refMsgAttachment ? [refMsgAttachment] : [],
        group: true,
    });

    return msg;
}
