# BF Karma Bot

The BF Karma Bot for Slack helps foster a positive work culture by encouraging employees for their contributions and support of their colleagues. Through the bot, users can award karma using Slack reactions and commands. The bot also allows viewing the history of all karma transactions and tracking team achievements through a leaderboard, promoting team spirit and motivation.

## Features

- **Award Karma**: Give karma to colleagues using reactions and commands.
- **Leaderboard**: View the leaderboard to see top contributors.
- **Transaction History**: Check the history of karma transactions.
- **Integrity Verification**: Verify the integrity of the karma history.
- **Burn Karma**: Burn karma from yourself and others, anonymously if desired.

## Prerequisites

- **Node.js** (version 12 or higher)
- **npm** or **yarn**
- A Slack workspace where you have permission to install apps.

## Setup Instructions

### 1. Create a Slack App Using a Manifest

You can set up the Slack app easily by using an app manifest.

1. **Visit the Slack App Manifest Documentation**: [https://api.slack.com/reference/manifests](https://api.slack.com/reference/manifests)

2. **Create a New App**:

   - Go to [Your Apps](https://api.slack.com/apps) on the Slack API website.
   - Click **"Create New App"**.
   - Select **"From an app manifest"**.

3. **Select Your Workspace**:

   - Choose the Slack workspace where you want to install the Karma Bot.

4. **Paste the Manifest**:

   - Copy the manifest from here `manifests`

5. **Review and Create**:

   - Click **"Next"**, review the app settings, and then click **"Create"**.

6. **Install the App**:
   - Navigate to **"OAuth & Permissions"** in the left sidebar.
   - Click **"Install App to Workspace"** and authorize the app.

### 2. Obtain Slack Tokens and Signing Secret

After setting up the app, you need to retrieve the following credentials:

- **SLACK_BOT_TOKEN**: Bot User OAuth Token
- **SLACK_APP_TOKEN**: App-Level Token for Socket Mode
- **SLACK_SIGNING_SECRET**: Used to verify incoming requests

#### Steps:

1. **Bot User OAuth Token (SLACK_BOT_TOKEN)**:

   - Go to **"OAuth & Permissions"** in your app settings.
   - Under **"OAuth Tokens for Your Workspace"**, find the **"Bot User OAuth Token"**.
   - Copy this token.

2. **App-Level Token (SLACK_APP_TOKEN)**:

   - Navigate to **"Socket Mode"** in the left sidebar.
   - Enable **"Enable Socket Mode"**.
   - Under **"App-Level Tokens"**, click **"Generate Token and Scopes"**.
   - Enter a name (e.g., `default`) and select the scope `connections:write`.
   - Click **"Generate"** and copy the token.

3. **Signing Secret (SLACK_SIGNING_SECRET)**:
   - Go to **"Basic Information"** in the left sidebar.
   - Under **"App Credentials"**, find the **"Signing Secret"**.
   - Click **"Show"** and copy the secret.

### 3. Set Up Environment Variables

Create a `.env` file in the root directory of your project and add the following:

```env
SLACK_BOT_TOKEN=your-bot-user-oauth-token
SLACK_APP_TOKEN=your-app-level-token
SLACK_SIGNING_SECRET=your-signing-secret
```

Replace the placeholders with the actual tokens and secret you copied earlier.

### 4. Install Dependencies

Run the following command to install all necessary dependencies:

```bash
npm install
```

or if you're using yarn:

```bash
yarn install
```

### 5. Run the Bot

Start the Karma Bot with:

```bash
npm run start
```

or with yarn:

```bash
yarn start
```

The bot should now be running and connected to your Slack workspace.

## Language

You can change language in `src/app.module.ts` file. Just change `en` to `ru`

If you want add another language:

1.  Copy `src/i18n/en` folder to `src/i18n/{short-language-name}`
2.  Translate all values in `karma.json`
3.  Change language in `src/app.module.ts` from `en` to `{short-language-name}`
4.  PROFIT!

## Usage

Once the bot is running, you can use the following slash commands in Slack:

- `/karma [@user]`: Check your own or another user's karma balance.
- `/karma_top`: View the leaderboard for karma points.
- `/karma_help`: Show all available commands and their descriptions.
- `/karma_history [@user]`: View the last 10 karma transactions for yourself or another user.
- `/karma_give @user amount [description]`: Give karma to another user with an optional reason.
- `/karma_verify [@user]`: Verify the integrity of the karma history.
- `/karma_burn @user amount [description]`: Burn karma from yourself and another user.
- `/karma_burn_anon @user amount [description]`: Anonymously burn karma from yourself and another user.

## Additional Resources

- **Slack App Manifest Documentation**: Learn more about setting up Slack apps using manifests [here](https://api.slack.com/reference/manifests).

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss changes.
