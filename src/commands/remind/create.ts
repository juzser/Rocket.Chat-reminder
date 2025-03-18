import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { reminderCreate } from '../../modals/reminderCreate';

// Open modal to request time off
export async function CreateCommand({ app, context, read, modify }: {
    app: AppClass;
    context: SlashCommandContext;
    read: IRead;
    modify: IModify
}): Promise<void> {
    const triggerId = context.getTriggerId();

    if (triggerId) {
        openCreateModal({ app, user: context.getSender(), room: context.getRoom(), read, modify, triggerId });
    }
}

// Open modal to request time off
export async function CreatePureCommand({ app, context, read, modify }: {
    app: AppClass;
    context: SlashCommandContext;
    read: IRead;
    modify: IModify
}): Promise<void> {
    const triggerId = context.getTriggerId();
    const user = context.getSender();

    if (user.roles.includes('admin')
        || user.roles.includes('owner')
        || user.roles.includes('moderator')
        || user.roles.includes('leader')
    ) {
        if (triggerId) {
            openCreateModal({ app, user: context.getSender(), room: context.getRoom(), read, modify, triggerId });
        }
    }
}

export async function openCreateModal({ app, user, room, read, modify, triggerId, refMessage }: {
    app: AppClass;
    user: IUser;
    room: IRoom;
    read: IRead;
    modify: IModify;
    triggerId: string;
    refMessage?: IMessage;
}) {
    const modal = await reminderCreate({
        app,
        user,
        room,
        read,
        modify,
        refMessage,
    });

    await modify.getUiController().openSurfaceView(modal, { triggerId }, user);
}
