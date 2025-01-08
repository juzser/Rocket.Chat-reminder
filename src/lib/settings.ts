import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { AppConfig } from './config';

export const settings: Array<ISetting> = [
    {
        id: 'bot_username',
        type: SettingType.STRING,
        packageValue: 'oe-reminder.bot',
        required: true,
        public: false,
        i18nLabel: 'bot_username',
        i18nDescription: 'bot_username_desc',
    },
    {
        id: 'bot_name',
        type: SettingType.STRING,
        packageValue: 'Cukoo',
        required: true,
        public: false,
        i18nLabel: 'bot_name',
        i18nDescription: 'bot_name_desc',
    },
    {
        id: 'app_language',
        type: SettingType.SELECT,
        packageValue: 'en',
        values: [
            {
                key: 'en',
                i18nLabel: 'app_language_en',
            },
            {
                key: 'vi',
                i18nLabel: 'app_language_vi',
            },
            {
                key: 'br',
                i18nLabel: 'app_language_br',
            },
            {
                key: 'fr',
                i18nLabel: 'app_language_fr',
            },
	    {
		key: 'de',
		i18nLabel: 'app_language_de',
	    }

        ],
        required: true,
        public: false,
        i18nLabel: 'app_language',
        i18nDescription: 'app_language_desc',
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
