# Rocket.Chat Reminder App

![3](https://user-images.githubusercontent.com/5735071/217137978-ad1de7e9-9868-4348-b0ff-f031b32197b1.jpg)


Awesome Reminder app for Rocket.Chat.
I have created this app for my own use, but I thought it might be useful for others as well.
If you need English version, just let me know, I prepared translation feature, so it should be easy to translate.

## Features

- One time & frequency remind.
- View active, completed reminders.
- Pause/Resume reminders.
- Remind to yourself, channel or other users.
- Quote a message in reminder.
- Easy to use & fully performance optimization.

## Installation

1. Go to Admin > Settings > General.
2. Open the Apps section.
3. Turn on the `Enable Development Mode` option.

<img width="652" alt="Screenshot 2023-02-08 at 08 58 06" src="https://user-images.githubusercontent.com/5735071/217410671-4b9ad29f-778b-4d22-873e-8c8c32f20898.png">

4. Go to [Release Page here](https://github.com/juzser/Rocket.Chat-reminder/releases).
5. Download the package as zip file.
6. Go to your Admin > Apps > Click on `Upload Apps` button at the top-right corner.
7. Upload the zip file you've downloaded.
8. Enjoy!

## Remind to other users & channels

To get users or channels list, you have to go to **Settings** then change the `Default Channel` to your general channel name.
Then disable ~> re-enable the app to get effect.

## Migration

The migration command to migrate if the schedule jobs are missing or the time is not correct.
Only available for admin users.

```bash
/cukoo-remind migrate
```

## Translation

To translation the app, you have to pull the repo to your local.
Take focus on `i18n` & `src/lang` directory, create a file with the name as your language code (e.g: fr, it,...)
Then translate the text in these by your language.

Update the `src/lang/index.ts`
Then run `rc-apps deploy ...` to deploy the app to your server.

## Package

1. Install [rc-apps](https://developer.rocket.chat/docs/apps-engine-cli) 
2. Link dependencies
    * `npm link typescript`
    * `npm link @rocket.chat/apps-engine`
    * `npm link @rocket.chat/ui-kit`
    * `npm link @rocket.chat/icons`
    * `npm install @types/node --save-dev`
3. Package app `rc-apps package`

---

Feel free to let me know if you have any issue.
Make the Rocket.Chat great as usual.




