import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage, IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { BlockBuilder, IOptionObject, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as appClass } from '../../OeReminderApp';
import { JobType } from '../interfaces/IJob';
import { Lang } from '../lang/index';
import { AppConfig } from './config';

/**
 * Sends a message using bot
 *
 * @param app
 * @param modify
 * @param room Where to send message to
 * @param message (optional) What to send
 * @param attachments (optional) Message attachments
 * @param blocks (optional) Message blocks
 *
 * @returns messageId
 */
export async function sendMessage({ app, modify, room, message, attachments, blocks, avatar, group }: {
    app: appClass,
    modify: IModify,
    room: IRoom,
    message?: string,
    attachments?: Array<IMessageAttachment>,
    blocks?: BlockBuilder,
    avatar?: string,
    group?: boolean,
}): Promise<string | undefined> {
    const msg = modify.getCreator().startMessage()
        .setGroupable(group || false)
        .setSender(app.botUser)
        .setUsernameAlias(AppConfig.alias)
        .setAvatarUrl(avatar || AppConfig.avatar)
        .setRoom(room);

    if (message && message.length > 0) {
        msg.setText(message);
    }
    if (attachments && attachments.length > 0) {
        msg.setAttachments(attachments);
    }
    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    try {
        return await modify.getCreator().finish(msg);
    } catch (error) {
        app.getLogger().log(error);
        return;
    }
}

/**
 * Notifies user using bot
 *
 * @param app
 * @param modify
 * @param user Who to notify
 * @param message What to send
 */
export async function notifyUser({ app, message, user, room, modify, blocks, attachments }: {
    app: appClass,
    message: string,
    user: IUser,
    room: IRoom,
    modify: IModify,
    attachments?: Array<IMessageAttachment>,
    blocks?: BlockBuilder,
}): Promise<void> {
    const msg = modify.getCreator().startMessage()
        .setSender(app.botUser)
        .setUsernameAlias(AppConfig.alias)
        .setAvatarUrl(AppConfig.avatar)
        .setText(message)
        .setRoom(room);

    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }
    if (attachments && attachments.length > 0) {
        msg.setAttachments(attachments);
    }

    const finalMsg = msg.getMessage();

    try {
        await modify.getNotifier().notifyUser(user, finalMsg);
    } catch (error) {
        app.getLogger().log(error);
    }
}

/**
 * Update a message using bot
 *
 * @param app
 * @param modify
 * @param messageId Update which message by id
 * @param message (optional) What to send
 * @param attachments (optional) Message attachments
 * @param blocks (optional) Message blocks
 *
 * @returns messageId
 */
export async function updateMessage({ app, modify, messageId, sender, message, attachments, blocks }: {
    app: appClass,
    modify: IModify,
    messageId: string,
    sender?: IUser,
    message?: string,
    attachments?: Array<IMessageAttachment>,
    blocks?: BlockBuilder,
}): Promise<void> {
    const msg = await modify.getUpdater().message(messageId, sender ? sender : app.botUser);
    msg.setEditor(msg.getSender());

    if (message && message.length > 0) {
        msg.setText(message);
    }
    if (attachments && attachments.length > 0) {
        msg.setAttachments(attachments);
    }
    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    try {
        return await modify.getUpdater().finish(msg);
    } catch (error) {
        app.getLogger().log(error);
        return;
    }
}

/**
 * Gets a direct message room between bot and another user, creating if it doesn't exist
 *
 * @param app
 * @param read
 * @param modify
 * @param username the username to create a direct with bot
 * @returns the room or undefined if botUser or botUsername is not set
 */
export async function getDirect(app: appClass, username: string, read: IRead, modify: IModify): Promise <IRoom | undefined> {
    if (app.botUsername) {
        const usernames = [app.botUsername, username];
        let room;
        try {
            room = await read.getRoomReader().getDirectByUsernames(usernames);
        } catch (error) {
            app.getLogger().log(error);
            return;
        }

        if (room) {
            return room;
        } else if (app.botUser) {
            // Create direct room between botUser and username
            try {
                const newRoom = modify.getCreator().startRoom()
                    .setType(RoomType.DIRECT_MESSAGE)
                    .setCreator(app.botUser)
                    .setMembersToBeAddedByUsernames(usernames);
                const roomId = await modify.getCreator().finish(newRoom);
                return await read.getRoomReader().getById(roomId);
            } catch (error) {
                app.getLogger().log(error);
                return;
            }
        }
    }
    return;
}

/**
 * Get current room's members except BOTS
 */
export async function getMembersByRoom(app: appClass, room: IRoom, read: IRead): Promise<Array<IUser>> {
    let members;
    try {
        members = await read.getRoomReader().getMembers(room.id);
    } catch (error) {
        app.getLogger().log(error);
    }

    return members.filter((member) => {
        return !(/(rocket\.cat|app\.|\.bot|bot\.)/gi.test(member.username))
            && member.roles.indexOf('guest') === -1
            && member.isEnabled;
    }) || [];
}

/**
 * Convert members array to the list member used in form
 *
 * @param members
 */
export function getMemberOptions(members: Array<IUser>): Array<IOptionObject> {
    const targets: Array<IOptionObject> = members
        .sort((a, b) => {
            return a.username.toUpperCase() < b.username.toUpperCase() ? -1 : 1;
        })
        .map((target) => {
            return {
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: target.username,
                },
                value: target.username,
            };
        });

    return targets;
}

/**
 * Convert timestamp to date format dd/mm/yyyy
 */
export function convertTimestampToDate(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const pad = (n: number) => n < 10 ? `0${n}` : n;

    return `${pad(day)}/${pad(month)}/${year}`;
}

/**
 * Convert date format dd/mm/yyyy to timestamp
 * @param date
 * @returns timestamp
 * @throws Error if date is invalid
 */
export function convertDateToTimestamp(date: string): number {
    const dateParts = date.split('/');
    if (dateParts.length !== 3) {
        throw new Error('Invalid date format');
    }
    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const year = parseInt(dateParts[2]);
    return new Date(year, month, day).getTime();
}

/**
 * Convert timestamp to time format hh:mm
 * @param timestamp
 * @returns time
 */
export function convertTimestampToTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const pad = (n: number) => n < 10 ? `0${n}` : n;

    return `${pad(hours)}:${pad(minutes)}`;
}

/**
 * Get when date time
 */
export function getWhenDateTime({ whenDate, whenTime, offset }: {
    whenDate: string,
    whenTime: string,
    offset: number,
}) {
    const [day, month, year] = whenDate.split('/');
    const [hour, minute] = whenTime.split(':');

    const whenDateTime = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hour, 10) - offset,
        parseInt(minute, 10),
    );

    return whenDateTime;
}

/**
 * Get week day name from lang
 */
export function getWeekDayName(date: string): string {
    const ts = convertDateToTimestamp(date);
    const day = new Date(ts).getDay();

    const { lang } = new Lang();

    switch(day) {
        case 0:
            return lang.date.sunday;
        case 1:
            return lang.date.monday;
        case 2:
            return lang.date.tuesday;
        case 3:
            return lang.date.wednesday;
        case 4:
            return lang.date.thursday;
        case 5:
            return lang.date.friday;
        case 6:
            return lang.date.saturday;
    }

    return '';
}

export function getNextRunAt({ type, whenDate, whenTime, offset }: {
    type: JobType;
    whenDate: string;
    whenTime: string;
    offset: number; // user timezone offset
}): Date {
    // Calculate the next run base on the last run
    // But the time should be correct as whenDate & whenTime
    const nextRunAt = getWhenDateTime({ whenDate, whenTime, offset });
    const currentDate = new Date();

    nextRunAt.setMonth(currentDate.getMonth());
    nextRunAt.setFullYear(currentDate.getFullYear());

    const currentHoursMinutes = currentDate.getHours() * 60 + currentDate.getMinutes() + 1;
    const originHoursMinutes = nextRunAt.getHours() * 60 + nextRunAt.getMinutes();

    // Get next run base on the current time
    if (type === JobType.DAILY || type === JobType.WEEKDAYS) {
        // Compare hours & minutes with original hours & minutes
        // If current hh:mm greater than original, then next run is tomorrow
        // Otherwise, next run is today
        nextRunAt.setDate(currentHoursMinutes > originHoursMinutes
            ? currentDate.getDate() + 1
            : currentDate.getDate()
        );

        if (type === JobType.WEEKDAYS) {
            // Skip weekend
            while (nextRunAt.getDay() === 0 || nextRunAt.getDay() === 6) {
                nextRunAt.setDate(nextRunAt.getDate() + 1);
            }
        }

        return nextRunAt;
    }

    if (type === JobType.WEEKLY) {
        // Compare day minutes with origin day minutes in week
        // If current is greater than origin, then next run is the origin day of next week
        // Otherwise, next run is the origin day of this week
        const current = currentDate.getDay() * 24 * 60 + currentHoursMinutes;
        const origin = nextRunAt.getDay() * 24 * 60 + originHoursMinutes;

        const weekDay = currentDate.getDate() - currentDate.getDay() + nextRunAt.getDay();

        nextRunAt.setDate(current > origin ? weekDay + 7 : weekDay);

        return nextRunAt;
    }

    if (type === JobType.MONTHLY) {
        // Compare date minutes with origin date minutes in month
        // If current is greater than origin, then next run is the origin date of next month
        // Otherwise, next run is the origin date of this month
        const current = currentDate.getDate() * 24 * 60 + currentHoursMinutes;
        const origin = nextRunAt.getDate() * 24 * 60 + originHoursMinutes;

        if (current > origin) {
            nextRunAt.setMonth(currentDate.getMonth() + 1);
        }

        return nextRunAt;
    }

    return nextRunAt;
}

/**
 * Truncate a string
 */
export function truncate(str: string, length: number): string {
    if (str.length > length) {
        return `${str.substring(0, length)}...`;
    }

    return str;
}

/**
 * Generate message link
 */
export async function generateMsgLink(app: appClass, message: IMessage): Promise<string> {
    if (message.room.type === RoomType.CHANNEL) {
        return `${app.siteUrl}/channel/${message.room.slugifiedName}?msg=${message.id}`;
    }

    if (message.room.type === RoomType.PRIVATE_GROUP) {
        return `${app.siteUrl}/group/${message.room.slugifiedName}?msg=${message.id}`;
    }

    return `${app.siteUrl}/direct/${message.room.id}?msg=${message.id}`;
}

/**
 * Get room name
 */
export async function getRoomName(read: IRead, room: IRoom): Promise<string> {
    if (room.type === RoomType.DIRECT_MESSAGE && room.userIds) {
        // const userNames: string[] = [];
        // for (const userId of room.userIds) {
        //     const user = await read.getUserReader().getById(userId);
        //     userNames.push(user.username);
        // }

        // return `direct (${userNames.join(', ')})`;
        return 'direct';
    }

    return room.displayName || room.slugifiedName || room.id;
}
