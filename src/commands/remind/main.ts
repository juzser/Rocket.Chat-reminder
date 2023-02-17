import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { OeReminderApp as AppClass } from '../../../OeReminderApp';
import { CreateCommand, CreatePureCommand } from './create';
import { HelpCommand } from './help';
import { ListCommand } from './list';
import { MigrateCommand } from './migrate';

export class ReminderCommand implements ISlashCommand {
    public command = 'cukoo-remind';
    public i18nParamsExample = 'remind_params';
    public i18nDescription = 'remind_desc';
    public providesPreview = false;

    private CommandEnum = {
        Create: 'create',
        CreatePure: 'create-pure',
        Cancel: 'cancel',
        Help: 'help',
        List: 'list',
        Migrate: 'migrate',
    };

    constructor(private readonly app: AppClass) {}

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        const [command, ...params] = context.getArguments();

        switch (command) {
            case this.CommandEnum.Create:
                await CreateCommand({ app: this.app, context, read, modify });
                break;

            case this.CommandEnum.CreatePure:
                await CreatePureCommand({ app: this.app, context, read, modify });
                break;

            case this.CommandEnum.List:
                await ListCommand({ app: this.app, context, read, persis, modify, params });
                break;

            case this.CommandEnum.Migrate:
                await MigrateCommand({ app: this.app, context, read, persis, modify });
                break;

            case this.CommandEnum.Help:
                await HelpCommand({ app: this.app, context, modify });
                break;

            default:
                await HelpCommand({ app: this.app, context, modify });
        }
    }
}
