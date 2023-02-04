export const vi = {
    common: {
        confirm: 'Xác nhận',
        cancel: 'Hủy',
    },
    reminder: {
        createModal: {
            heading: 'Tạo Reminder',
            when: 'Remind vào ngày',
            time: 'Lúc',
            repeat: 'Lặp lại',
            repeat_options: {
                once: 'Một lần',
                daily: 'Hàng ngày',
                weekly: 'Hàng tuần',
                weekdays: 'Ngày thường (không tính thứ 7 và chủ nhật)',
                monthly: 'Hàng tháng',
            },
            message: 'Message',
            message_placeholder: 'Trả tiền ăn trưa tháng này :sushi:',
            remind_to: 'Remind đến',
            target_type: 'Channel hoặc cá nhân',
            target_type_options: {
                self: 'Bản thân',
                user: 'Người khác',
                channel: 'Channel',
            },
            target_user: (max: number) => `Người nhận (Tối đa ${max} người)`,
            target_user_placeholder: (max: number) => `Tối đa ${max} người nhận`,
            target_channel: 'Channel',
            target_channel_placeholder: 'Tên Channel',
            create_success: 'Ok, reminder đã được tạo. Yên tâm tôi sẽ nhắc bạn :+1: ',
        },

        message: {
            caption_self: ':rotating_light: Ê, bạn đã nhờ tôi nhắc bạn:',
            caption_user: (owner: string) => `:rotating_light: Này, @${owner} nhờ tôi nhắc bạn:`,
            caption_channel: (owner: string) => `:rotating_light: Alo alo, @${owner} nhờ tôi nhắc mọi người:`,
        }
    },
};

