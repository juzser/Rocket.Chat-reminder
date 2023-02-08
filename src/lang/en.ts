export const en = {
    common: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        close: 'Close',
    },
    date: {
        day: 'Day',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
    },
    reminder: {
        createModal: {
            heading: 'Create Reminder',
            ref_message_caption: (channel?: string) => `You're creating reminder for message ${ channel ? ` from channel **#${channel}**` : '' }:`,
            ref_message_author: (author: string) => `**Sender**: ${author}`,
            ref_message_content: (content: string) => `**Message**: ${content || 'Cannot display message...'}`,
            when: 'Remind at',
            time: 'Time',
            repeat: 'Repeat',
            repeat_options: {
                once: 'No repeat',
                daily: 'Daily',
                weekly: 'Weekly',
                weekdays: 'Weekdays (Mon-Fri)',
                weekdays_pure: 'Weekdays',
                monthly: 'Monthly',
            },
            message: 'Message',
            message_placeholder: 'Happy hour start! :tada: :sushi:',
            remind_to: 'Remind to',
            target_type: 'Channel or Users',
            target_type_options: {
                self: 'Yourself',
                user: 'Other Users',
                channel: 'Channel',
            },
            target_user: (max: number) => `Receivers (Max: ${max} users)`,
            target_user_placeholder: (max: number) => `Max ${max} users`,
            target_channel: 'Channel',
            target_channel_placeholder: 'Channel name',
            create_success: 'Reminder created successfully! :tada: Be calm and wait for the reminder.',
        },

        listModal: {
            heading: 'List Reminder',
            caption_active: (count: number, paused: number) => `You have total **${count}** active reminder(s)${paused ? ` and **${paused}** paused reminder(s)` : ''}.`,
            caption_finished: (count: number) => `You have total **${count}** completed reminder(s).`,
            no_reminders: 'Create reminder by typing `/reminder`',
            list_active: ':fire: **Active reminders:**',
            list_paused: ':pause_button: **Paused reminders:**',
            list_finished: ':white_check_mark: **Completed reminders:**',
            view_finished: 'View completed reminders',
            view_active: 'View active reminders',
        },

        jobBlock: {
            title_once: (time: string, target?: string) => `:small_blue_diamond: Remind ${target ? target : 'me'} at *${time}*`,
            title_repeat: (time: string, repeat: string, target?: string) => `:small_orange_diamond: Remind ${target ? target : 'me'} at *${time}* (${repeat})`,
            next_run_at: (time: string) => `Next remind at: *${time}*`,
            message: 'Message',
            button_pause: 'Pause',
            button_resume: ':arrow_forward: Resume',
            button_cancel: 'Cancel',
            button_remove: 'Remove',
        },

        message: {
            caption_self: ':rotating_light: You asked me to remind you',
            caption_user: (owner: string) => `:rotating_light: @${owner} asked me to remind you`,
            caption_channel: (owner: string) => `:rotating_light: @${owner} asked me to remind this channel`,
            caption_ref_msg: (msgLink: string, channel?: string) => ` about the message${channel ? ` from #${channel}` : ''}`,
            title_ref_msg: (time: string, channel?: string) => `Message${channel ? ` in #${channel}` : ''} sent at ${time}`,
        },

        messageAction: {
            caption: '- Create reminder: `/remind create`\n- View reminder list: `/remind list` \n\n You also can create reminder to quote a message, by click on the button `⏰ Create reminder` in the action menu beside a message.',
            button_create: 'Create reminder',
            button_list: 'View reminder list',
        },
    },
};

