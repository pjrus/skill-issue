import { google } from 'googleapis';

export const meetService = {
  /**
   * Generates a Google Meet link via the Google Calendar API v3.
   * 
   * IMPORTANT SETUP REQUIRED:
   * 1. In Google Cloud Console, enable "Google Calendar API".
   * 2. Configure the OAuth consent screen.
   * 3. Create "OAuth client ID" credentials (Web application).
   * 4. Once you have the Client ID and Secret, run `node get-google-token.mjs` to generate a refresh token.
   * 5. Add all three to your .env file:
   *    - GOOGLE_CLIENT_ID
   *    - GOOGLE_CLIENT_SECRET
   *    - GOOGLE_REFRESH_TOKEN
   */
  createMeetingSpace: async () => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      
      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN must be set in .env.');
      }

      // Initialize the Google Auth client using User OAuth 2.0
      // We don't need a redirect URI here because we're just using the refresh token to get a new access token
      const auth = new google.auth.OAuth2(clientId, clientSecret);
      
      // We already have the refresh token, so we can set it directly
      auth.setCredentials({
        refresh_token: refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth });

      // Calculate start and end times for a generic 1-hour event
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5); // start 5 min from now
      const startTime = now.toISOString();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour later

      const event = {
        summary: 'Skill-Issue Meeting',
        description: 'Automatically generated meeting link for your Skill-Issue session.',
        start: {
          dateTime: startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime,
          timeZone: 'UTC',
        },
        conferenceData: {
          createRequest: {
            requestId: `skill-issue-meet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      console.log('[MeetService] Calling calendar.events.insert...');

      const response = await calendar.events.insert({
        calendarId: 'primary', // 'primary' resolves to the calendar of the user who authorized the app
        conferenceDataVersion: 1,
        requestBody: event,
      });

      const meetingUri = response.data.hangoutLink;

      if (!meetingUri) {
        throw new Error('Failed to retrieve meeting hangoutLink from Google Calendar API');
      }

      console.log('[MeetService] Event created with Meet link:', meetingUri);

      return {
        meetingUri: meetingUri,
        spaceName: response.data.summary || 'Skill-Issue Meeting',
      };
    } catch (error: any) {
      console.error('[MeetService] Error:', error);
      
      let errorMessage = error.message;
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = `${error.response.data.error.message || error.message}`;
      }
      
      console.warn(`[MeetService] Falling back to placeholder link due to error: ${errorMessage}`);
      return {
        meetingUri: 'https://meet.google.com/new',
        spaceName: 'fallback-space',
      };
    }
  },
};


