import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { JobStatus } from '../../interfaces/IJob';
import { notifyUser } from '../../lib/helpers';
import { reminderList } from '../../modals/reminderList';
import { getReminders } from '../../services/reminder';

// Open modal to request time off
export async function MigrateCommand({ app, context, read, persis, modify }: {
    app: AppClass;
    context: SlashCommandContext;
    read: IRead;
    persis: IPersistence;
    modify: IModify
}): Promise<void> {
    // Check if user is admin
    const user = context.getSender();

    if (!user.roles.includes('admin')) {
        return;
    }

    await app.reminder.migrate({ read, persis, modify });

    return await notifyUser({
        app,
        message: 'Migration completed',
        user,
        modify,
        room: context.getRoom(),
    });
}
