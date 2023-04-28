import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { BlockBuilder, ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";

import { OeReminderApp as AppClass } from "../../OeReminderApp";
import { Lang } from "../lang/index";

export async function ReminderActionsMessage({ app, block }: {
    app: AppClass;
    block: BlockBuilder;
}) {
    const { lang } = new Lang(app.appLanguage);

    block.addSectionBlock({
        text: block.newMarkdownTextObject(lang.reminder.messageAction.caption),
    });

    block.addActionsBlock({
        elements: [
            block.newButtonElement({
                text: block.newPlainTextObject(lang.reminder.messageAction.button_create),
                actionId: 'reminder-create',
                style: ButtonStyle.PRIMARY,
            }),
            block.newButtonElement({
                text: block.newPlainTextObject(lang.reminder.messageAction.button_list),
                actionId: 'reminder-list',
            }),
        ],
    });
}
