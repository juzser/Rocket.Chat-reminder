import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { BlockBuilder, IOptionObject, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OeReminderApp as appClass } from '../../OeReminderApp';
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
export async function getDirect(app: appClass, username: string, read: IRead, modify: IModify): Promise <IRoom | undefined > {
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
            const newRoom = modify.getCreator().startRoom()
                .setType(RoomType.DIRECT_MESSAGE)
                .setCreator(app.botUser)
                .setMembersToBeAddedByUsernames(usernames);
            const roomId = await modify.getCreator().finish(newRoom);
            return await read.getRoomReader().getById(roomId);
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
