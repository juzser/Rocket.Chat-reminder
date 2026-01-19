import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
import { LayoutBlock } from "@rocket.chat/ui-kit";

import { OeReminderApp as AppClass } from "../../OeReminderApp";
import { Lang } from "../lang/index";

export async function ReminderActionsMessage({ app }: {
    app: AppClass;
}): Promise<LayoutBlock[]> {
    const { lang } = new Lang(app.appLanguage);

    return [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: lang.reminder.message.caption,
            },
        },
        {
            type: 'actions',
            elements: [
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: lang.reminder.messageAction.button_create,
                    },
                    appId: app.getID(),
                    blockId: 'reminderActions',
                    actionId: 'reminder-create',
                    style: ButtonStyle.PRIMARY,
                },
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: lang.reminder.messageAction.button_list,
                    },
                    appId: app.getID(),
                    blockId: 'reminderActions',
                    actionId: 'reminder-list',
                },
            ],
        }
    ];
}
