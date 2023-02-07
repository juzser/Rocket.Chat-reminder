import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { Lang } from '../../lang/index';
import { notifyUser } from '../../lib/helpers';
import { ReminderActionsMessage } from '../../messages/reminder-actions';

// Open modal to request time off
export async function HelpCommand({ app, context, modify }: {
    app: AppClass;
    context: SlashCommandContext;
    modify: IModify;
}): Promise<void> {
    // Send message
    const room = context.getRoom();
    const user = context.getSender();

    await sendHelp({ app, modify, user, room });
}

export async function sendHelp({ app, modify, user, room }: {
    app: AppClass;
    modify: IModify;
    user: IUser;
    room: IRoom;
}) {
    // Create message block
    const block = modify.getCreator().getBlockBuilder();
    await ReminderActionsMessage({ app, block });

    const { lang } = new Lang(user.settings?.preferences?.language);

    await notifyUser({
        app,
        message: lang.reminder.messageAction.caption,
        user,
        room,
        modify,
        blocks: block,
    });
}
