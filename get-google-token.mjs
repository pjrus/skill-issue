import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import enableDestroy from 'server-destroy';

dotenv.config({ path: '.env' });

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const TOKEN_PATH = 'token.json';

async function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    // Start a temporary local server to handle the OAuth2 callback
    const server = http.createServer(async (req, res) => {
      try {
        if (req.url.indexOf('/oauth2callback') > -1) {
          const qs = new url.URL(req.url, 'http://localhost:3001').searchParams;
          const code = qs.get('code');
          
          res.end('Authentication successful! Please return to the console.');
          
          // Give it a small delay to ensure the response is sent before destroying
          setTimeout(async () => {
            server.destroy();

            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
            console.log('\n[SUCCESS] Token stored to', TOKEN_PATH);
            console.log('Please grab your refresh_token from this file and put it in your .env');
            
            resolve(oAuth2Client);
          }, 1000);
        }
      } catch (e) {
        reject(e);
      }
    }).listen(3001, () => {
      // Open the browser to the authorize url to start the workflow
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Forces consent screen to get refresh token
      });
      console.log('--------------------------------------------------');
      console.log('Authorize this app by opening this URL in your browser:');
      console.log('\n' + authUrl + '\n');
      console.log('Waiting for authorization... (Listening on http://localhost:3001/oauth2callback)');
      console.log('--------------------------------------------------');
    });
    
    // Patch the server with destroy capability
    enableDestroy(server);
  });
}

async function authorize() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
    process.exit(1);
  }

  // Use a local server URI for the callback
  const redirectUri = 'http://localhost:3001/oauth2callback';
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token.toString()));
    return oAuth2Client;
  } catch (err) {
    return await getNewToken(oAuth2Client);
  }
}

async function start() {
    await authorize();
    console.log("Authorization complete. You can exit this script.");
    process.exit(0);
}

start();

