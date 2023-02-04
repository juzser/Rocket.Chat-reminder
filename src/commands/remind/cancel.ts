import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { notifyUser } from '../../lib/helpers';

// Open modal to request time off
export async function CancelCommand({ app, context, read, persis, modify, params }: {
    app: AppClass;
    context: SlashCommandContext;
    read: IRead;
    persis: IPersistence;
    modify: IModify
    params: string[];
}): Promise<void> {
    const remindIds = params[0].split(',');

    const remindId = await modify.getScheduler().cancelJob(remindIds[0]);

    app.getLogger().log(`id ${remindId}`);

    await notifyUser({
        app,
        user: context.getSender(),
        room: context.getRoom(),
        message: `Remind id: ${remindId}`,
        modify,
    });
}

export async function CancelAllCommand({ app, context, read, persis, modify, params }: {
    app: AppClass;
    context: SlashCommandContext;
    read: IRead;
    persis: IPersistence;
    modify: IModify
    params: string[];
}): Promise<void> {
    const remindId = await modify.getScheduler().cancelAllJobs();

    app.getLogger().log(`id ${remindId}`);

    await notifyUser({
        app,
        user: context.getSender(),
        room: context.getRoom(),
        message: `Remind id: ${remindId}`,
        modify,
    });
}
