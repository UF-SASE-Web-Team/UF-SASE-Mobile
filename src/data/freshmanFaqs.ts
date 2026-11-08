export type FaqCategory = 'academic' | 'professional' | 'community' | 'general';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export interface FaqCategoryConfig {
  key: FaqCategory;
  label: string;
  icon: 'school-outline' | 'briefcase-outline' | 'people-outline' | 'help-circle-outline';
}

export const FAQ_CATEGORIES: FaqCategoryConfig[] = [
  { key: 'academic', label: 'Academic', icon: 'school-outline' },
  { key: 'professional', label: 'Professional', icon: 'briefcase-outline' },
  { key: 'community', label: 'Community', icon: 'people-outline' },
  { key: 'general', label: 'General', icon: 'help-circle-outline' },
];

export const FRESHMAN_FAQS: FaqItem[] = [
  // Academic
  {
    id: 'acad-1',
    category: 'academic',
    question: 'How do I find study groups for STEM classes?',
    answer:
      'SASE hosts regular Study Hours throughout the semester and maintains the Class Connector sheet where you can connect with peers taking the same engineering, science, and math courses.',
  },
  {
    id: 'acad-2',
    category: 'academic',
    question: 'Where is the SASE Pi Room / Marston study room?',
    answer:
      'The Pi Room is located in the Marston Science Library. SASE members can reserve it for study sessions and group projects using the Pi Room Booking link in Resources.',
  },
  {
    id: 'acad-3',
    category: 'academic',
    question: 'How can I get involved in undergraduate research?',
    answer:
      'UF SASE provides a Research Guide with tips on cold emailing professors, finding lab openings across Herbert Wertheim College of Engineering, and applying for research programs like CUR.',
  },
  {
    id: 'acad-4',
    category: 'academic',
    question: 'What are Design Teams and how do I join?',
    answer:
      'Design Teams are hands-on student engineering project teams (e.g. Solar Gators, Swamp Launch, GRiP). Check our Design Team List resource for recruitment cycles and meeting times.',
  },

  // Professional
  {
    id: 'prof-1',
    category: 'professional',
    question: 'What is the SASE Resume Template?',
    answer:
      'Our resume template is curated by upperclassmen and industry mentors, specifically tailored for engineering and tech students applying to internships and Career Showcase.',
  },
  {
    id: 'prof-2',
    category: 'professional',
    question: 'How can I prepare for the UF Career Showcase?',
    answer:
      'SASE hosts resume review sessions, elevator pitch workshops, and mock interview prep before Career Showcase. Be sure to check the Events tab for upcoming sessions.',
  },
  {
    id: 'prof-3',
    category: 'professional',
    question: 'How do I connect with SASE alumni?',
    answer:
      'We connect students with alumni working across top tech and engineering companies through our Alumni Panel events, mentorship program, and our LinkedIn network.',
  },
  {
    id: 'prof-4',
    category: 'professional',
    question: 'What should I track in the Experience Tracker?',
    answer:
      'Use the Experience Tracker to log technical projects, hackathons, volunteer work, and skills so you can easily reference them when applying for jobs and writing cover letters.',
  },

  // Community
  {
    id: 'comm-1',
    category: 'community',
    question: 'What is the SASE Mentorship Program?',
    answer:
      'Our Big/Little Mentorship Program pairs freshmen and new members with experienced upperclassmen to help guide you through academics, campus life, and career goals.',
  },
  {
    id: 'comm-2',
    category: 'community',
    question: 'How often are General Body Meetings (GBMs)?',
    answer:
      'GBMs are held bi-weekly on campus! They feature guest speakers, fun team activities, announcements for upcoming events, and free food.',
  },
  {
    id: 'comm-3',
    category: 'community',
    question: 'What sports or intramurals does SASE participate in?',
    answer:
      'SASE fields intramural teams each semester for volleyball, soccer, basketball, and flag football. All members of any skill level are welcome to join!',
  },
  {
    id: 'comm-4',
    category: 'community',
    question: 'How do I join SASE committees?',
    answer:
      'Committee applications open at the start of each semester for roles in marketing, web development, event planning, and fundraising. Details are shared at GBMs and on Discord.',
  },

  // General
  {
    id: 'gen-1',
    category: 'general',
    question: 'How do I become an active UF SASE member?',
    answer:
      'Attend GBMs, socials, and workshops, and check in via the SASE Mobile app to earn attendance points towards active membership perks and end-of-semester banquet recognition.',
  },
  {
    id: 'gen-2',
    category: 'general',
    question: 'Where can I find the SASE calendar and social links?',
    answer:
      'All links including our Google Calendar, Discord server, Instagram, and Linktree are available right in the Resources tab of this app.',
  },
  {
    id: 'gen-3',
    category: 'general',
    question: 'Who do I contact if I have questions?',
    answer:
      'You can reach out to board officers during Board Office Hours, message officers on Discord, or DM @ufsase on Instagram.',
  },
];
