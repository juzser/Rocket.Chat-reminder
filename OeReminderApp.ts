import {
    IAppAccessors,
    IConfigurationExtend,
    IConfigurationModify,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { ReminderCommand } from './src/commands/remind/main';
import { Reminder } from './src/classes/Reminder';
import { settings } from './src/lib/settings';
import { MembersCache } from './src/services/cache-members';
import { IUIKitResponse, UIKitActionButtonInteractionContext, UIKitBlockInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { ExecuteBlockAction } from './src/classes/ExecuteBlockAction';
import { ExecuteViewSubmit } from './src/classes/ExecuteViewSubmit';
import { AppConfig } from './src/lib/config';
import { JobsCache } from './src/services/cache-jobs';
import { UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import { ExecuteActionButton } from './src/classes/ExecuteActionButton';

export class OeReminderApp extends App {
    public botUsername: string;
    public botUser: IUser;

    public botName: string;

    public defaultChannelName: string;
    public defaultChannel: IRoom;

    public enableRemindChannel: boolean;
    public maxUserRemind: number;
    public siteUrl: string;

    public reminder: Reminder;

    /**
     * Members cache
     */
    public membersCache: MembersCache;

    /**
     * Jobs cache
     */
    public jobsCache: JobsCache;

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    /**
     * Execute when an action triggered
     */
    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persis: IPersistence, modify: IModify) {
        try {
            const handler = new ExecuteBlockAction(this, modify, read, persis);
            return await handler.run(context);
        } catch (err) {
            this.getLogger().log(`${ err.message }`);
            return context.getInteractionResponder().errorResponse();
        }
    }

    /**
     * Execute when a action button on board clicked
     */
    public async executeActionButtonHandler(
        context: UIKitActionButtonInteractionContext,
        read: IRead,
        http: IHttp,
        persis: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        try {
            const handler = new ExecuteActionButton(this, modify, read);
            await handler.run(context);
        } catch (err) {
            this.getLogger().log(`${ err.message }`);
            return context.getInteractionResponder().errorResponse();
        }

        return context.getInteractionResponder().successResponse();
    }

    /**
     * Execute when a form submitted
     */
    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp, persis: IPersistence, modify: IModify) {
        try {
            const handler = new ExecuteViewSubmit(this, modify, read, persis);
            return await handler.run(context);
        } catch (err) {
            this.getLogger().log(`${ err.message }`);
            return context.getInteractionResponder().errorResponse();
        }
    }

    public async onEnable(environment: IEnvironmentRead, configurationModify: IConfigurationModify): Promise<boolean> {
        this.siteUrl = (await environment.getServerSettings().getValueById('Site_Url')).replace(/\/$/, '');
        this.membersCache = new MembersCache(this);
        this.jobsCache = new JobsCache(this);
        this.reminder = new Reminder(this);

        // Get bot user by bot username
        this.botUsername = await environment.getSettings().getValueById('bot_username');
        if (!this.botUsername) {
            return false;
        }
        this.botUser = await this.getAccessors().reader.getUserReader().getByUsername(this.botUsername) as IUser;

        this.botName = await environment.getSettings().getValueById('bot_name');

        this.defaultChannelName = await environment.getSettings().getValueById('default_channel');
        this.defaultChannel = await this.getAccessors().reader.getRoomReader().getByName(this.defaultChannelName) as IRoom;

        this.enableRemindChannel = await environment.getSettings().getValueById('enable_remindto_channel');
        this.maxUserRemind = +(await environment.getSettings().getValueById('max_users_remind')) || 0;

        return true;
    }

    /**
     * Update values when settings are updated
     *
     * @param setting
     * @param configModify
     * @param read
     * @param http
     */
    public async onSettingUpdated(setting: ISetting, configModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
       switch (setting.id) {
            case 'bot_username':
                this.botUsername = setting.value;
                if (this.botUsername) {
                    this.botUser = await read.getUserReader().getByUsername(this.botUsername) as IUser;
                }
                break;
            case 'bot_name':
                this.botName = setting.value;
                break;
            case 'default_channel':
                this.defaultChannelName = setting.value;
                if (this.defaultChannelName) {
                    this.defaultChannel = await read.getRoomReader().getByName(this.defaultChannelName) as IRoom;
                }
                break;
            case 'enable_remindto_channel':
                this.enableRemindChannel = setting.value;
                break;
            case 'max_users_remind':
                this.maxUserRemind = +setting.value || 0;
                break;
       }

       return;
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        // Settings
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));

        // Slash Command
        await configuration.slashCommands.provideSlashCommand(new ReminderCommand(this));

        configuration.ui.registerButton({
            actionId: 'reminder-trigger',
            labelI18n: 'reminder-trigger-label',
            context: UIActionButtonContext.MESSAGE_BOX_ACTION,
        });

        configuration.ui.registerButton({
            actionId: 'reminder-trigger-message',
            labelI18n: 'reminder-trigger-message-label',
            context: UIActionButtonContext.MESSAGE_ACTION,
        });

        await configuration.scheduler.registerProcessors([{
            id: AppConfig.jobKey,
            processor: async (job, read, modify, http, persis) => {
                await this.reminder.processor({ job, read, modify, persis });
            },
        }]);
    }
}
