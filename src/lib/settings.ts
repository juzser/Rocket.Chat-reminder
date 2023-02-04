import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export const settings: Array<ISetting> = [
    {
        id: 'bot_username',
        type: SettingType.STRING,
        packageValue: 'rocket.cat',
        required: true,
        public: false,
        i18nLabel: 'bot_username',
        i18nDescription: 'bot_username_desc',
    },
    {
        id: 'default_channel',
        type: SettingType.STRING,
        packageValue: 'general',
        required: true,
        public: false,
        i18nLabel: 'default_channel',
        i18nDescription: 'default_channel_desc',
    },
    {
        id: 'enable_remindto_channel',
        type: SettingType.BOOLEAN,
        packageValue: true,
        required: false,
        public: false,
        i18nLabel: 'enable_remindto_channel',
        i18nDescription: 'enable_remindto_channel_desc',
    },
    {
        id: 'max_users_remind',
        type: SettingType.NUMBER,
        packageValue: 3,
        required: false,
        public: false,
        i18nLabel: 'max_users_remind',
        i18nDescription: 'max_users_remind_desc',
    }
];
