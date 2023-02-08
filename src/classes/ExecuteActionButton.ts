import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitActionButtonInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { openCreateModal } from '../commands/remind/create';
import { sendHelp } from '../commands/remind/help';

export class ExecuteActionButton {
    constructor(
        private readonly app: AppClass,
        private readonly modify: IModify,
        private readonly read: IRead,
    ) {}

    public async run(context: UIKitActionButtonInteractionContext): Promise<void> {
        // Send message
        const { room, user, actionId, triggerId } = context.getInteractionData();

        if (actionId === 'reminder-trigger') {
            await sendHelp({ app: this.app, modify: this.modify, user, room });
        }

        if (actionId === 'reminder-trigger-message') {
            const { message } = context.getInteractionData();

            await openCreateModal({
                app: this.app,
                user,
                room,
                read: this.read,
                modify: this.modify,
                triggerId,
                refMessage: message,
            })
        }
    }
}
