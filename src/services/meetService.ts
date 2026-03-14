import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export const meetService = {
  /**
   * Creates a real Google Meet space using the Meet REST API.
   * Requires GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS 
   * environment variable to be set with a Service Account that has the Meet API enabled.
   */
  createMeetingSpace: async () => {
    try {
      // Initialize the Google Auth client
      // The library automatically looks for credentials in environment variables
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/meetings.space.created'],
      });

      const client = await auth.getClient();
      const meet = google.meet({ version: 'v2', auth: client as any });

      // Create a new meeting space
      const response = await meet.spaces.create({
        requestBody: {
          config: {
            accessType: 'OPEN', // Or 'TRUSTED' depending on needs
          },
        },
      });

      if (!response.data || !response.data.meetingUri) {
        throw new Error('Failed to retrieve meeting URI from Google Meet API');
      }

      return {
        meetingUri: response.data.meetingUri,
        spaceName: response.data.name,
      };
    } catch (error: any) {
      console.error('Error creating Google Meet space:', error);
      // Detailed logging for debugging API issues
      if (error.response) {
        console.error('API Response Error:', error.response.data);
      }
      throw error;
    }
  },
};
