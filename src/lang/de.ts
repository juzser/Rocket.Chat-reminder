export const de = {
    common: {
        confirm: 'OK',
        cancel: 'Abbruch',
        close: 'Schließen',
    },
    date: {
        day: 'Tag',
        monday: 'Montag',
        tuesday: 'Dienstag',
        wednesday: 'Mittwoch',
        thursday: 'Donnerstag',
        friday: 'Freitag',
        saturday: 'Samstag',
        sunday: 'Sonntag',
    },
    reminder: {
        createModal: {
            heading: 'Erstelle Erinnerung',
            ref_message_caption: (channel?: string) => `Du erstellst eine Erinnerung für ${ channel ? ` from channel **#${channel}**` : '' }:`,
            ref_message_author: (author: string) => `**Autor:in**: ${author}`,
            ref_message_content: (content: string) => `**Nachricht**: ${content || 'Die Nachricht kann nicht angezeigt werden...'}`,
            when: 'Erinnere mich am',
            time: 'Uhrzeit',
            repeat: 'Wiederholung',
            repeat_options: {
                once: 'Keine Wiederholung',
                daily: 'Täglich',
                weekly: 'Wöchentlich',
                biweekly: 'Zwei-Wöchentlich (2 Wochen)',
                weekdays: 'Werktags (Mo-Fr)',
                weekdays_pure: 'Werktags',
                monthly: 'Monatlich',
            },
            message: 'Nachricht',
            message_placeholder: 'Die Happy hour beginnt! :tada: :sushi:',
            remind_to: 'Erinnere',
            target_type: 'Kanal oder Nutzer:innen',
            target_type_options: {
                self: 'Mich selber',
                user: 'Andere Nutzer:innen',
                channel: 'Kanal',
            },
            target_user: (max: number) => `Empfänger:innen (Max: ${max} Nutzer:innen)`,
            target_user_placeholder: (max: number) => `Max ${max} Nutzer:innen`,
            target_channel: 'Kanal',
            target_channel_placeholder: 'Kanal-Name',
            create_success: 'Erinnerung erfolgreich erstellt! :tada:',
        },

        listModal: {
            heading: 'Erinnerungen anzeigen',
            caption_active: (count: number, paused: number) => `Du hast **${count}** aktive Erinnerungen${paused ? ` und **${paused}** pausierte Erinnerungen` : ''}.`,
            caption_finished: (count: number) => `Du hast **${count}** abgeschlossene Erinnerungen.`,
            no_reminders: 'Erstelle eine Erinnerung durch die Eingabe von `/cukoo-remind`',
            list_active: ':fire: **Aktive Erinnerungen:**',
            list_paused: ':pause_button: **Pausierte Erinnerungen:**',
            list_finished: ':white_check_mark: **Abgeschlossene Erinnerungen:**',
            view_finished: 'Zeige abgeschlossene Erinnerungen',
            view_active: 'Zeige aktive Erinnerungen',
        },

        jobBlock: {
            title_once: (time: string, target?: string) => `:small_blue_diamond: Erinnere ${target ? target : 'mich'} um *${time}*`,
            title_repeat: (time: string, repeat: string, target?: string) => `:small_orange_diamond: Erinnere ${target ? target : 'mich'} um *${time}* (${repeat})`,
            next_run_at: (time: string) => `Nächste Erinnerung um *${time}*`,
            message: 'Nachricht',
            button_pause: 'Pause',
            button_resume: ':arrow_forward: Wiederaufnahme',
            button_cancel: 'Abbruch',
            button_remove: 'Löschen',
        },

        message: {
            caption_self: ':rotating_light: Ich soll dich erinnern',
            caption_user: (owner: string) => `:rotating_light: @${owner} hat mich beauftragt dich zu erinnern`,
            caption_channel: (owner: string) => `:rotating_light: @${owner} hat mich beauftragt diesen Kanal zu erinnern`,
            caption_ref_msg: (msgLink: string, channel?: string) => ` bzgl. der Nachricht ${channel ? ` von #${channel}` : ''}`,
            title_ref_msg: (time: string, channel?: string) => `Nachricht${channel ? ` in #${channel}` : ''} erstellt um ${time}`,
        },

        messageAction: {
            caption: '- Erstelle Erinnerung: `/cukoo-remind create`\n- Zeige Erinnerungen: `/cukoo-remind list` \n\n Du kannst dich auch an eine Nachricht erinnern lassne. Klicke hierzu auf den Button `⏰ Erinnerung erstellen` im Aktions-Menü der Nachricht.',
            button_create: 'Erinnerung erstellen',
            button_list: 'Zeige Erinnerungen',
        },
    },
};

