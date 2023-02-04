import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { BlockBuilder, ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { IJob, JobTargetType } from '../interfaces/IJob';
import { lang } from '../lang/index';
import { AppConfig } from '../lib/config';
import { sendMessage } from '../lib/helpers';

export async function ReminderMessage({ app, owner, jobData, modify, room }: {
    app: AppClass;
    owner: IUser;
    jobData: IJob;
    modify: IModify;
    room: IRoom;
}) {
    let caption = lang.reminder.message.caption_self;

    if (jobData.targetType === JobTargetType.USER) {
        caption = lang.reminder.message.caption_user(owner.username);
    }

    if (jobData.targetType === JobTargetType.CHANNEL) {
        caption = lang.reminder.message.caption_channel(owner.username);
    }

    const attachment: IMessageAttachment = {
        color: AppConfig.attachmentColor,
        text: jobData.message,
    };

    if (jobData.targetType === JobTargetType.SELF) {

    }

    // Send message to activity room
    const msg = await sendMessage({ app, modify, room, message: caption, attachments: [attachment], group: true });

    return msg;
}
