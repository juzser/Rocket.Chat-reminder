import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { CancelAllCommand, CancelCommand } from './cancel';
import { CreateCommand } from './create';
import { ListCommand } from './list';
import { MigrateCommand } from './migrate';

export class ReminderCommand implements ISlashCommand {
    public command = 'remind';
    public i18nParamsExample = 'remind_params';
    public i18nDescription = 'remind_desc';
    public providesPreview = false;

    private CommandEnum = {
        Create: 'create',
        Cancel: 'cancel',
        CancelAll: 'cancel-all',
        List: 'list',
        Migrate: 'migrate',
    };

    constructor(private readonly app: AppClass) {}

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        const [command, ...params] = context.getArguments();

        switch (command) {
            case this.CommandEnum.Create:
                await CreateCommand({ app: this.app, context, read, persis, modify, params });
                break;

            case this.CommandEnum.Cancel:
                await CancelCommand({ app: this.app, context, read, persis, modify, params });
                break;

            case this.CommandEnum.CancelAll:
                await CancelAllCommand({ app: this.app, context, read, persis, modify, params });
                break;

            case this.CommandEnum.List:
                await ListCommand({ app: this.app, context, read, persis, modify, params });
                break;

            case this.CommandEnum.Migrate:
                await MigrateCommand({ app: this.app, context, read, persis, modify });
                break;

            default:
                await CreateCommand({ app: this.app, context, read, persis, modify, params });
        }
    }
}
