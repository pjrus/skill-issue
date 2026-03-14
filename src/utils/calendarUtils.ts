import { Appointment } from '@/types/matchTypes';

/**
 * Generates an iCalendar (.ics) format string for the given appointment.
 * Returns a base64 encoded string of the .ics file content.
 */
export function generateICS(appointment: Appointment): string {
  const { date, users, meetLink, teachingSkill, learningSkill } = appointment;
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startTime = formatDate(date);
  // Default duration: 1 hour
  const endDate = new Date(date.getTime() + 60 * 60 * 1000);
  const endTime = formatDate(endDate);

  const teacher = users[0];
  const learner = users[1];

  const summary = `Skill Swap: ${teachingSkill} / ${learningSkill}`;
  const description = `Skill Swap Session\n\n` +
    `Teaching: ${teachingSkill}\n` +
    `Learning: ${learningSkill}\n` +
    `Participants: ${users.map(u => u.username).join(', ')}\n\n` +
    `Google Meet: ${meetLink}`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillSwap//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${meetLink}`,
    `URL:${meetLink}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const icsContent = icsLines.join('\r\n');
  
  // Return base64 encoded content
  if (typeof btoa !== 'undefined') {
    return btoa(icsContent);
  } else {
    // Node.js fallback
    return Buffer.from(icsContent).toString('base64');
  }
}
