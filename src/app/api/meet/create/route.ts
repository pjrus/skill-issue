import { NextResponse } from 'next/server';
import { meetService } from '@/services/meetService';

export async function POST() {
  try {
    const { meetingUri } = await meetService.createMeetingSpace();
    return NextResponse.json({ meetLink: meetingUri });
  } catch (error: any) {
    console.error('API Route Error [meet/create]:', error.message);
    return NextResponse.json({ 
      error: 'Failed to create meeting space',
      details: error.message 
    }, { status: 500 });
  }
}
