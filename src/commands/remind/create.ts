import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { notifyUser } from '../../lib/helpers';
import { reminderCreate } from '../../modals/reminderCreate';

// Open modal to request time off
export async function CreateCommand({ app, context, read, persis, modify, params }: {
    app: AppClass;
    context: SlashCommandContext;
    read: IRead;
    persis: IPersistence;
    modify: IModify
    params: string[];
}): Promise<void> {
    const triggerId = context.getTriggerId();

    if (triggerId) {
        const modal = await reminderCreate({
            app,
            user: context.getSender(),
            room: context.getRoom(),
            modify,
        });

        await modify.getUiController().openModalView(modal, { triggerId }, context.getSender());
    }
}
