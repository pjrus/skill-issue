import { NextResponse } from 'next/server';
import { meetService } from '@/services/meetService';

export async function POST() {
  try {
    // Check if credentials are set (optional but helpful for debugging)
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      console.warn('Google credentials not found. Falling back to mock link generation.');
      return NextResponse.json({ 
        error: 'Credentials not configured',
        details: 'Missing GOOGLE_APPLICATION_CREDENTIALS'
      }, { status: 400 });
    }

    const { meetingUri } = await meetService.createMeetingSpace();
    return NextResponse.json({ meetLink: meetingUri });
  } catch (error: any) {
    console.error('API Route Error [meet/create]:', error);
    return NextResponse.json({ 
      error: 'Failed to create meeting space',
      details: error.message 
    }, { status: 500 });
  }
}
