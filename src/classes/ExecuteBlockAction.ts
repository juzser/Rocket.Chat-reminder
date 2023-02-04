import { IModify, IRead, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitModalResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { JobTargetType } from '../interfaces/IJob';
import { reminderCreate } from '../modals/reminderCreate';

export class ExecuteBlockAction {
    constructor(
        private readonly app: AppClass,
        private readonly modify: IModify,
        private readonly read: IRead,
        private readonly persis: IPersistence,
    ) {}

    public async run(context: UIKitBlockInteractionContext): Promise<IUIKitModalResponse | Record<string, any>> {
        const data = context.getInteractionData();
        const { user, actionId, value, container } = data;

        let roomId = this.app.defaultChannel.id;
        if (container.id.startsWith('modal-reminder-create')) {
            roomId = container.id.split('--')[1];
        }

        const room = await this.read.getRoomReader().getById(roomId);

        switch (actionId) {
            case 'targetType': {
                const modal = await reminderCreate({
                    app: this.app,
                    room: room as IRoom,
                    user,
                    modify: this.modify,
                    targetType: value as JobTargetType,
                });
                return context.getInteractionResponder().updateModalViewResponse(modal);
            }
        }

        return {
            success: true,
            user: data.user.username,
            action: data.actionId,
            value: data.value,
            triggerId: data.triggerId,
        };
    }
}
