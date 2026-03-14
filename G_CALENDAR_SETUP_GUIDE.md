# Google Calendar API OAuth Setup Guide

This guide will walk you through setting up User OAuth 2.0 to generate Google Meet links without needing a Workspace admin account.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top-left corner, click the project drop-down menu and select **New Project**.
3. Name it something like "SkillSwap Calendar Setup" and click **Create**.
4. Once created, make sure that project is selected in the top-left dropdown.

## Step 2: Enable the Calendar API

1. In the search bar at the very top, type **Google Calendar API**.
2. Click on the first result for the API.
3. Click the blue **Enable** button.

## Step 3: Configure the OAuth Consent Screen

1. In the left navigation menu, go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless you are part of a Google Workspace organization and only want users in your organization to use the app). Click **Create**.
3. Fill out the required fields:
   * **App name:** e.g., "SkillSwap Link Generator"
   * **User support email:** Select your email.
   * **Developer contact information:** Put your email again.
4. Click **Save and Continue**.
5. On the **Scopes** page, click **Add or Remove Scopes**.
6. At the bottom under "Manually add scopes", paste exactly this URL:
   `https://www.googleapis.com/auth/calendar.events`
   Then click **Add to table**, then **Update**.
7. Click **Save and Continue**.
8. On the **Test users** page, click **Add Users**.
9. **CRITICAL:** Add *your own* Google email address (the one you'll use to log in and generate links).
10. Click **Save and Continue**, then **Back to Dashboard**.

## Step 4: Create OAuth Credentials

1. In the left navigation menu, go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Under **Application type**, select **Desktop app**.
   *(Note: If you select Web application, you must add `http://localhost` or `urn:ietf:wg:oauth:2.0:oob` to the Authorized redirect URIs).*
4. Give it a name like "Meet Generator" and click **Create**.
5. A popup will appear with your **Client ID** and **Client Secret**. Keep this window open.

## Step 5: Update Your Environment Variables

1. Open your `.env` file in VS Code.
2. Add your Client ID and Client Secret from the popup:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## Step 6: Get Your Refresh Token

1. Open a terminal in VS Code inside your project folder (`skillswap-unihack-2026`).
2. Run the script I created for you:
   ```bash
   node get-google-token.mjs
   ```
3. The terminal will print a very long URL starting with `Authorize this app by visiting this url: https://accounts.google.com/...`.
4. **Command-Click** (or open it manually) to visit that URL in your browser.
5. Log in with the same Google Account you added to "Test Users" in Step 3.
6. You will see a "Google hasn't verified this app" warning. Click **Advanced**, then **Go to SkillSwap (unsafe)**.
7. Click **Continue / Allow** to grant it permission to edit your calendar.
8. Google will give you an **Authorization Code** (it usually provides a button to copy it).
9. Paste that code back into your VS Code terminal and press Enter.
10. The script will save a `token.json` file in your project folder.

## Step 7: Final Step!

1. Open the newly created `token.json` file in VS Code.
2. Find the line that says `"refresh_token": "..."` and copy the value inside the quotes.
3. Add it to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REFRESH_TOKEN=your-very-long-refresh-token-here
```

**You are done!** You can delete `token.json` if you want. Your Next.js app will now use this Refresh Token to automatically generate Google Meet links behind the scenes whenever someone creates a booking.
