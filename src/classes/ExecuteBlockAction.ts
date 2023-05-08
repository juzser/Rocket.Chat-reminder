import { IModify, IRead, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitModalResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as AppClass } from '../../OeReminderApp';
import { openCreateModal } from '../commands/remind/create';
import { openListModal } from '../commands/remind/list';
import { IJob, JobStatus, JobTargetType } from '../interfaces/IJob';
import { reminderCreate } from '../modals/reminderCreate';
import { reminderList } from '../modals/reminderList';

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

        switch (actionId) {
            case 'targetType': {
                const refMsgId = container.id.split('--')[2];
                const refMsg = await this.read.getMessageReader().getById(refMsgId);

                const modal = await reminderCreate({
                    app: this.app,
                    room: room as IRoom,
                    user,
                    read: this.read,
                    modify: this.modify,
                    targetType: value as JobTargetType,
                    refMessage: refMsg,
                });

                return context.getInteractionResponder().updateModalViewResponse(modal);
            }

            case 'reminder-list-view': {
                const modal = await this.buildListModal({ actionValue: value as string, user });
                return context.getInteractionResponder().updateModalViewResponse(modal);
            }

            case 'reminder-create':
                await openCreateModal({ app: this.app, user, room: room as IRoom, read: this.read, modify: this.modify, triggerId: data.triggerId });
                break;

            case 'reminder-list':
                await openListModal({ app: this.app, user, modify: this.modify, triggerId: data.triggerId });
                break;
        }

        // Cancel a job
        if (actionId.startsWith('job-cancel')) {
            const id = actionId.split('--')[1];
            await this.app.reminder.cancel({ id, read: this.read, persis: this.persis, modify: this.modify });

            const [block, status, ...rest] = blockId.split('--');

            const modal = await this.buildListModal({ actionValue: status, user });
            return context.getInteractionResponder().updateModalViewResponse(modal);
        }

        if (actionId.startsWith('job-pause')) {
            const id = actionId.split('--')[1];
            await this.app.reminder.pause({ id, read: this.read, persis: this.persis, modify: this.modify });

            const [block, status, ...rest] = blockId.split('--');

            const modal = await this.buildListModal({ actionValue: status, user });
            return context.getInteractionResponder().updateModalViewResponse(modal);
        }

        if (actionId.startsWith('job-resume')) {
            const id = actionId.split('--')[1];
            await this.app.reminder.resume({ id, read: this.read, persis: this.persis, modify: this.modify });

            const [block, status, ...rest] = blockId.split('--');

            const modal = await this.buildListModal({ actionValue: status, user });
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

    private async buildListModal({ actionValue, user }: {
        actionValue: string;
        user: IUser;
    }): Promise<IUIKitModalViewParam> {
        let jobs: IJob[] = [];
        let pausedJobs: IJob[] = [];

        if (actionValue === 'active' || actionValue === 'paused') {
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
            status: actionValue as 'active' | 'finished' | 'paused',
        });
    }
}
