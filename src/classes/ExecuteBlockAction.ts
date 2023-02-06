import { IModify, IRead, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitModalResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { IJob, JobStatus, JobTargetType } from '../interfaces/IJob';
import { reminderCreate } from '../modals/reminderCreate';
import { reminderList } from '../modals/reminderList';
import { getReminders } from '../services/reminder';

export class ExecuteBlockAction {
    constructor(
        private readonly app: AppClass,
        private readonly modify: IModify,
        private readonly read: IRead,
        private readonly persis: IPersistence,
    ) {}

    public async run(context: UIKitBlockInteractionContext): Promise<IUIKitModalResponse | Record<string, any>> {
        const data = context.getInteractionData();
        const { user, actionId, value, container, blockId } = data;

        let roomId = this.app.defaultChannel.id;
        if (container.id.startsWith('modal-reminder-create')) {
            roomId = container.id.split('--')[1];
        }

        const room = await this.read.getRoomReader().getById(roomId);

        this.app.getLogger().info(data);

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

            case 'reminder-list-view': {
                const modal = await this.buildListModal({ actionValue: value as string, user, context });
                return context.getInteractionResponder().updateModalViewResponse(modal);
            }
        }

        // Cancel a job
        if (actionId.startsWith('job-cancel')) {
            const id = actionId.split('--')[1];
            this.app.reminder.cancel({ id, read: this.read, persis: this.persis, modify: this.modify });

            const [block, status, ...rest] = blockId.split('--');

            const modal = await this.buildListModal({ actionValue: status, user, context });
            return context.getInteractionResponder().updateModalViewResponse(modal);
        }

        return {
            success: true,
            user: data.user.username,
            action: data.actionId,
            value: data.value,
            triggerId: data.triggerId,
        };
    }

    private async buildListModal({ actionValue, user, context }: {
        actionValue: string;
        user: IUser;
        context: UIKitBlockInteractionContext;
    }): Promise<IUIKitModalViewParam> {
        let jobs: IJob[] = [];
        let pausedJobs: IJob[] = [];

        if (actionValue === 'active') {
            jobs = await this.app.jobsCache.getOnUser(JobStatus.ACTIVE, user.id);
            pausedJobs = await this.app.jobsCache.getOnUser(JobStatus.PAUSED, user.id);
        }

        if (actionValue === 'finished') {
            jobs = await this.app.jobsCache.getOnUser(JobStatus.FINISHED, user.id);
        }

        return await reminderList({
            app: this.app,
            jobList: jobs,
            pausedJobs,
            user,
            modify: this.modify,
            status: actionValue as 'active' | 'finished',
        });
    }
}
