# **App Name**: SkillSwap

## Core Features:

- Secure User Authentication: Users can log in and sign up securely using a username and password, with placeholder options for 'Continue with Google' and 'Continue with Apple'.
- AI-Powered Skill Input: A chat-like interface where users describe their skills and needs in natural language, utilizing an AI tool to extract 'skillsOffered' and 'skillsWanted' tags for their profile.
- Skill Profile Management: Users can view and edit their profile details including skills offered, skills wanted, learning style preferences, and bio. These details are persisted in Firestore.
- Dynamic User Matching: A matchmaking service identifies and displays potential learning partners by finding intersecting skills offered and wanted, using a loading animation to simulate processing time.
- AI-Generated Match Summaries: For each matched user, an AI tool provides a concise, 2-sentence summary explaining how the two students can benefit from exchanging skills, enhancing clarity and connection.
- Appointment Scheduling: Users can select a date and time for a session from a calendar-style selector, which then generates a placeholder Google Meet link and saves the appointment details to Firestore.
- Appointment Confirmation & Details: A dedicated page to display match names, a summary of the skill exchange, confirmed date/time, and a clickable link to join the Google Meet session.

## Style Guidelines:

- This application utilizes a dark mode color scheme, evoking a modern, intelligent, and collaborative atmosphere appropriate for a learning platform. The primary brand color is a deep indigo (#643DFF), providing a strong yet balanced presence. The background color is a very dark, subtly purple-grey (#17161F), ensuring optimal contrast and readability in dark environments. A vibrant cyan (#64CCFF) serves as the accent color, drawing attention to interactive elements and highlights, ensuring good visual hierarchy and user engagement.
- The application employs 'Inter', a grotesque-style sans-serif font for both headlines and body text. Its modern, machined, and neutral aesthetic aligns perfectly with a clean, objective 'modern student SaaS' interface, ensuring excellent readability and a contemporary feel across all content.
- Utilize simple, clean line-art icons that complement the modern SaaS aesthetic. Icons should be clear and universally recognizable, such as those indicating profile settings, skill tags, calendar dates, and chat messages.
- The layout features a 'modern student SaaS' style, characterized by a clean and intuitive structure. Key elements are organized within Tailwind CSS-styled cards and rounded panels, featuring soft shadows to add depth. Dark mode support is global, providing a consistent user experience.
- Implement subtle loading skeletons for data fetching and soft transition animations, especially on the 'Processing Page', to enhance user experience during waiting times, creating a smooth and professional feel. Elements such as card expansions or modal displays should also feature smooth, understated transitions.