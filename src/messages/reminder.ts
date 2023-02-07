import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage, IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { IJob, JobTargetType, JobType } from '../interfaces/IJob';
import { Lang } from '../lang/index';
import { AppConfig } from '../lib/config';
import { generateMsgLink, getRoomName, sendMessage, truncate } from '../lib/helpers';

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

    // let refMsgAttachment: IMessageAttachment | null = null;
    if (refMsg) {
        const msgLink = await generateMsgLink(app, refMsg);
        const roomName = await getRoomName(read, refMsg.room);

        caption += lang.reminder.message.caption_ref_msg(msgLink, truncate(roomName, 40));
        caption += ':';

        // refMsgAttachment = {
        //     color: AppConfig.attachmentColor,
        //     text: refMsg?.text,
        //     author: {
        //         name: refMsg.sender.username,
        //         icon: `${app.siteUrl}${refMsg.avatarUrl}`,
        //     },
        // };
    }

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
        // attachments: refMsgAttachment ? [refMsgAttachment] : [],
        group: true,
    });

    return msg;
}
