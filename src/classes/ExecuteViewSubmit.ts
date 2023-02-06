import { IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUIKitErrorResponse, UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";

import { OeReminderApp as AppClass } from "../../OeReminderApp";
import { IJobFormData } from "../interfaces/IJob";

export class ExecuteViewSubmit {
    constructor(
        private readonly app: AppClass,
        private readonly modify: IModify,
        private readonly read: IRead,
        private readonly persis: IPersistence,
    ) {}

    public async run(context: UIKitViewSubmitInteractionContext): Promise<IUIKitErrorResponse | Record<string, any>> {
        const data = context.getInteractionData();

        const { state, id } = data.view;

        this.app.getLogger().log(data);

        // Create Reminder
        if (id.startsWith('modal-reminder-create')) {
            const roomId = id.split('--')[1];
            const room = await this.read.getRoomReader().getById(roomId);

            const { reminderData } = state as Record<'reminderData', IJobFormData>;

            try {
                await this.app.reminder.create({
                    formData: reminderData,
                    room: room as IRoom,
                    user: data.user,
                    read: this.read,
                    modify: this.modify,
                    persis: this.persis,
                });
            } catch(err) {
                return context.getInteractionResponder().viewErrorResponse({
                    viewId: id,
                    errors: err,
                });
            }
        }

        return {
            success: true,
            state,
            user: data.user.username,
        };
    }
}
