import React from 'react';
import { Linking, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/context/ThemeContext';
import { space } from '@/theme';

export type FaqCategory = 'academic' | 'professional' | 'extracurricular' | 'miscellaneous';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: React.ReactNode;
}

export interface FaqCategoryConfig {
  key: FaqCategory;
  label: string;
  heading: string;
  icon: 'school-outline' | 'briefcase-outline' | 'people-outline' | 'help-circle-outline';
}

/**
 * Clickable inline link for FAQ answers.
 */
export function FaqLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { colors } = useTheme();

  const handlePress = () => {
    Linking.openURL(href).catch((err) => console.error('Could not open link:', err));
  };

  return (
    <Text
      variant="bodySmStrong"
      color={colors.surface.saseBlue.primary}
      style={{ textDecorationLine: 'underline' }}
      onPress={handlePress}
      accessibilityRole="link"
    >
      {children}
    </Text>
  );
}

/**
 * Standard text paragraph within FAQ answers with bottom margin.
 */
export function FaqParagraph({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors } = useTheme();
  return (
    <Text
      variant="bodySm"
      color={colors.content.onBase.secondary}
      style={[{ marginBottom: space['200'] }, style]}
    >
      {children}
    </Text>
  );
}

/**
 * Bullet point row for lists in FAQ answers.
 */
export function FaqBullet({
  indent = 0,
  children,
}: {
  indent?: number;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingLeft: indent * space['400'],
        marginBottom: space['100'],
      }}
    >
      <Text
        variant="bodySm"
        color={colors.content.onBase.secondary}
        style={{ marginRight: space['150'], lineHeight: 20 }}
      >
        •
      </Text>
      <Text
        variant="bodySm"
        color={colors.content.onBase.secondary}
        style={{ flex: 1, lineHeight: 20 }}
      >
        {children}
      </Text>
    </View>
  );
}

export const FAQ_CATEGORIES: FaqCategoryConfig[] = [
  {
    key: 'academic',
    label: 'Academic',
    heading:
      'Your first 2 years of college can be somewhat of an adjustment academically. Use this time to build essential skills, form effective study habits, and build a solid foundation for your upper-level classes. By having a good understanding of your degree/college requirements, you will be better able to plan the rest of your college career.',
    icon: 'school-outline',
  },
  {
    key: 'professional',
    label: 'Professional',
    heading:
      'Don’t underestimate your abilities as a freshman to take advantage of professional opportunities. It might not seem like it, but a lot of people around you have imposter syndrome! Professional opportunities in college offer real-world experience, networking, and skill development. They bridge academic learning with practical application, enhancing career readiness. Internships, workshops, and job fairs connect students to industries, mentors, and potential employers.',
    icon: 'briefcase-outline',
  },
  {
    key: 'extracurricular',
    label: 'Extracurricular',
    heading:
      'Extracurriculars in college foster personal growth, develop leadership skills and build well-rounded individuals. They enhance social networks, provide practical experiences, and show commitment beyond academics. These activities cultivate character, time management, and diverse perspectives.',
    icon: 'people-outline',
  },
  {
    key: 'miscellaneous',
    label: 'Miscellaneous',
    heading: '',
    icon: 'help-circle-outline',
  },
];

export const FRESHMAN_FAQS: FaqItem[] = [
  // ==========================================
  // 1. ACADEMIC
  // ==========================================
  {
    id: 'acad-1',
    category: 'academic',
    question: '1.1 - How do I find my academic advisor?',
    answer: (
      <>
        <FaqParagraph>
          Advisors can vary depending on your college/major. It’s recommended you meet with your
          advisor once a semester. This is required if you are in the College of Engineering. You
          can discuss your 4-year plan, how to possibly change your major, how drop/add works, or
          how to apply to take transient classes.
        </FaqParagraph>
        <FaqParagraph>Find advising contacts:</FaqParagraph>
        <FaqBullet>
          For your{' '}
          <FaqLink href="https://www.ufadvising.ufl.edu/college-advising-contacts/">
            specific college
          </FaqLink>
        </FaqBullet>
        <FaqBullet>
          For{' '}
          <FaqLink href="https://www.ufadvising.ufl.edu/college-advising-contacts/">
            Pre-Health
          </FaqLink>
        </FaqBullet>
        <FaqBullet>
          For <FaqLink href="https://cals.ufl.edu/current-students/undergraduate/">CALS</FaqLink>{' '}
          (College of Agriculture and Life Sciences)
        </FaqBullet>
        <FaqBullet>
          For{' '}
          <FaqLink href="https://www.advising.ufl.edu/advising/who-is-my-advisor/">CLAS</FaqLink>{' '}
          (College of Liberal Arts and Sciences)
        </FaqBullet>
        <FaqBullet>
          For{' '}
          <FaqLink href="https://www.eng.ufl.edu/students/advising/who-is-my-advisor/">
            College of Engineering
          </FaqLink>
        </FaqBullet>
        <FaqBullet indent={1}>
          Note: Freshmen do have a specific first-year advisor based on your last name
        </FaqBullet>
        <FaqBullet indent={1}>
          You will also have a Canvas course which includes specific assignments (I.e. Resume,
          goals, 4-year plan, etc.) you should complete before your advising appointment every
          semester
        </FaqBullet>
        <FaqParagraph style={{ marginTop: space['200'] }}>
          Also, don’t forget to consult SASE members using #study-chat. In general, upperclassmen
          are great for advice since they have gone through your program themselves!
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'acad-2',
    category: 'academic',
    question: '1.2 - How do I decide which classes I need to take?',
    answer: (
      <>
        <FaqParagraph>
          As a baseline, you can start off by making your schedule similar to the model semester
          plan listed for your major (I.e. the Industrial Engineering one looks like{' '}
          <FaqLink href="https://catalog.ufl.edu/UGRD/colleges-schools/UGENG/ISE_BSIS/#modelsemesterplantext">
            this
          </FaqLink>
          ).
        </FaqParagraph>
        <FaqParagraph>ONE.UF is also useful to see your requirements.</FaqParagraph>
        <FaqBullet>To see your major’s requirements listed in categories:</FaqBullet>
        <FaqBullet indent={1}>Academics &gt; Degree Audit</FaqBullet>
        <FaqBullet>You can see which classes your AP/IB/AICE credit has covered:</FaqBullet>
        <FaqBullet indent={1}>Transcripts &gt; Transfer Credit Report</FaqBullet>
        <FaqBullet>
          To explore the requirements of another major or see the requirements of a double major:
        </FaqBullet>
        <FaqBullet indent={1}>Academics &gt; Degree Shopping</FaqBullet>
        <FaqParagraph style={{ marginTop: space['200'] }}>
          Your college will offer different electives (technical, interdisciplinary, etc). These are
          usually listed on your respective college’s page. Also, if you have time, try to take
          classes outside of your major to gain perspective and develop interdisciplinary skills. Or
          just take a class for fun if you have the space for it.
        </FaqParagraph>
        <FaqParagraph>
          If you&apos;re still confused about your requirements, you&apos;re not alone! You can
          reach out to both upperclassmen and your advisor.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'acad-3',
    category: 'academic',
    question: '1.3 - How do I fill out my 4-year plan?',
    answer: (
      <>
        <FaqParagraph>
          Now that you have a basic understanding of your requirements from 1.2, you can start
          filling out your 4-year plan. Your 4-year plan is a document that lists out 8 semesters
          and the specific classes/credits you plan to take each semester. Don’t forget to keep
          track of required prereqs. Upperclassmen/mentors can help a lot, especially with professor
          recommendations and maintaining a balanced schedule.
        </FaqParagraph>
        <FaqParagraph>
          Note that it is normal if your 4-year plan deviates a little from the model semester plan
          or changes a lot as you progress.
        </FaqParagraph>
        <FaqParagraph>Here are some templates you can use:</FaqParagraph>
        <FaqBullet>
          <FaqLink href="https://docs.google.com/spreadsheets/d/1O2eng0m9MGHD-fDHwCFaK5gZUZGy0CUb/edit#gid=1895010424">
            Engineering Academic Planner
          </FaqLink>{' '}
          (Can be used by other majors as well)
        </FaqBullet>
        <FaqBullet>
          <FaqLink href="https://docs.google.com/spreadsheets/d/1FzavR3c4GmiwVGL4BcYpwR0r1wa7_NWkHNZLouCm9fg/edit#gid=592550897">
            Less congested general
          </FaqLink>{' '}
          4-year planner
        </FaqBullet>
        <FaqBullet>
          <FaqLink href="https://docs.google.com/spreadsheets/d/1aHeObHxpVZzfjTR-6ygXvFS2Z--1RU_OSXR3jHtIXUY/template/preview">
            Simplest and great overall view
          </FaqLink>{' '}
          4-year planner
        </FaqBullet>
      </>
    ),
  },
  {
    id: 'acad-4',
    category: 'academic',
    question: '1.4 - How does registration work?',
    answer: (
      <>
        <FaqParagraph>
          A few weeks out from registration, your registration date will be available on ONE.UF.
          Usually, upperclassmen get priority and get an earlier date.
        </FaqParagraph>
        <FaqParagraph>
          On the date and time listed, your registration will open up. Beforehand be prepared with
          what classes you want to take. Reference your major requirements and 4-year plan for this.
          You can create a mock schedule using{' '}
          <FaqLink href="https://www.coursicle.com/ufl/courses/">Coursicle</FaqLink> or{' '}
          <FaqLink href="http://www.registr-uf.com/">Registr-UF</FaqLink> to work out the timings of
          your classes. Also, it&apos;s very important to include backups as some classes fill up
          fast.
        </FaqParagraph>
        <FaqParagraph>
          If possible reach out to an upperclassman (or someone who has an earlier date than you)
          because they are able to access how many seats are left for a specific class/section
          starting from their registration date.
        </FaqParagraph>
        <FaqParagraph>
          On the day of, log in at your given time (usually 9 AM or 2 PM) and select your classes
          relatively quickly. If you don’t get a class you need, don’t stress out yet. More seats
          may open later on (so keep checking). Also, schedules change a lot during add/drop week,
          so getting a seat then is another possibility. Sometimes, it doesn’t hurt to email an
          advisor/professor.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'acad-5',
    category: 'academic',
    question: '1.5 - What resources do I have for my classes?',
    answer: (
      <>
        <FaqParagraph>
          Actually, go to Office Hours! Going to your professor/TA’s office hours can save you a lot
          of time on your assignments. Also, professors sometimes share unique information about the
          class/exam during office hours. It’s a great chance to get to know your professor which is
          helpful for rec letters or other professional development opportunities.
        </FaqParagraph>
        <FaqParagraph>
          In addition, there is{' '}
          <FaqLink href="https://academicresources.clas.ufl.edu/tutoring/">
            free tutoring offered by CLAS
          </FaqLink>{' '}
          for Chemistry 1/2, Physics 1/2, and various math classes (pre-calc to Calc 3). You can
          schedule an appointment or drop in to ask a question during the specified time.
        </FaqParagraph>
        <FaqParagraph>
          You can use the #study-chat or reach out to people using the{' '}
          <FaqLink href="https://docs.google.com/spreadsheets/d/1ghaMRvGG6REIy-O5AMCLGbVD2blTlxPOUayYd4kddIA/edit#gid=1369741976">
            Class Connector
          </FaqLink>{' '}
          (Fall 2023) as well.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'acad-6',
    category: 'academic',
    question: '1.6 - Where is free printing on campus?',
    answer: (
      <FaqParagraph>
        You can print up to 250 pages for free at the Reitz Student Union (on the lowest floor).
        Also, Newell Hall has free printing.
      </FaqParagraph>
    ),
  },
  {
    id: 'acad-7',
    category: 'academic',
    question: '1.7 - Where can I find xxx equipment for free?',
    answer: (
      <>
        <FaqParagraph>
          Marston (sometimes LibWest) has a bunch of equipment/hardware you can rent for free. This
          is especially handy if you forgot your calculator for your macro exam (totally didn’t
          happen to me).
        </FaqParagraph>
        <FaqParagraph>
          All sorts of things like tripods, GoPros, MacBook chargers, binoculars, Arduinos,
          Raspberry Pis, a Computer Mouse, DAD, drawing tablets, drill sets, extension cords, HDMI
          cables, headphones, laser presenters, projectors, sewing machines can be rented out.
        </FaqParagraph>
        <FaqParagraph>
          Note these items can be rented anywhere from 3 hours to 7 days depending on the item.
        </FaqParagraph>
        <FaqParagraph>
          Here’s the <FaqLink href="https://uflib.ufl.edu/find/tech-tools/">link</FaqLink>.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'acad-8',
    category: 'academic',
    question: '1.8 - Do I need to actually buy textbooks?',
    answer: (
      <>
        <FaqParagraph>
          It depends. Talk to people who have taken the class before to get more information.
        </FaqParagraph>
        <FaqParagraph>
          Sometimes your assignments are embedded within the online textbooks, so in that case yes.
          Also, some textbooks can be found online. Sometimes, finding used textbooks on eBay or FB
          marketplace can be a cheap alternative too.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'acad-9',
    category: 'academic',
    question: '1.9 - Where can I find access to free/cheaper software?',
    answer: (
      <>
        <FaqParagraph>
          UF provides Office 365 and some OneDrive storage for free. Other software is discounted.
          For example, Adobe Creative Cloud is $65 for 6 months, and Grammarly Premium is $35.
        </FaqParagraph>
        <FaqParagraph>
          Check it out <FaqLink href="https://software.ufl.edu/">here</FaqLink>.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'acad-10',
    category: 'academic',
    question: '1.10 - What should I do if I’m considering changing my major?',
    answer: (
      <>
        <FaqParagraph>
          This is completely normal and happens to a lot of people. Talk to your advisor since they
          need to approve the switch. Also, try to talk to as many people as possible in both your
          current and exploratory major.
        </FaqParagraph>
        <FaqParagraph>
          Check out this{' '}
          <FaqLink href="https://career.ufl.edu/gain-experience/student-outcomes/">link</FaqLink>,
          if you want to see some data based on major and career outcomes (median/average salary,
          internship percentage, etc.).
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'acad-11',
    category: 'academic',
    question: '1.11 - Where are some good study spots?',
    answer: (
      <>
        <FaqParagraph>It depends on your vibe.</FaqParagraph>
        <FaqParagraph style={{ fontWeight: '600', marginTop: space['100'] }}>
          Common spots:
        </FaqParagraph>
        <FaqBullet>Marston</FaqBullet>
        <FaqBullet>Lib West</FaqBullet>
        <FaqBullet>Newell Hall</FaqBullet>

        <FaqParagraph style={{ fontWeight: '600', marginTop: space['300'] }}>
          Underrated spots:
        </FaqParagraph>
        <FaqBullet>Fine Arts Library</FaqBullet>
        <FaqBullet>2nd floor of the Hub</FaqBullet>
        <FaqBullet>Health Sciences Library</FaqBullet>
        <FaqBullet>Education Library</FaqBullet>
        <FaqBullet>Picnic tables in front of the lake at the Reitz</FaqBullet>
      </>
    ),
  },
  {
    id: 'acad-12',
    category: 'academic',
    question: '1.12 - How does transient credit work?',
    answer: (
      <>
        <FaqParagraph>
          Transient credit is a great way to knock out some gen-ed requirements over the summer at
          your local Community College/ Florida university. Classes like Calc 2 or Physics 2 are
          commonly taken at CCs like Santa Fe/ Broward College, or Florida universities in your
          hometown (i.e. UNF in Jacksonville).
        </FaqParagraph>
        <FaqParagraph>
          The transient credit does not count toward your overall UF GPA but does count toward your
          critical tracking GPA. Bright Futures also applies to these classes.
        </FaqParagraph>
        <FaqParagraph>
          Get started at this{' '}
          <FaqLink href="https://www.floridashines.org/succeed-in-college/take-a-course-at-another-school">
            link
          </FaqLink>
          . After filling out the application, inform your advisor for their approval. After a
          couple more approvals, you will receive a login link from the other state
          college/university to register for classes.
        </FaqParagraph>
        <FaqParagraph>
          Note, start this process relatively early in the Spring semester as seats do fill up for
          popular classes like Physics 2. Don’t forget to also send your transcript back to UF once
          the course is finished. Account for the time needed to send/process transcripts especially
          when taking prerequisite classes.
        </FaqParagraph>
      </>
    ),
  },

  // ==========================================
  // 2. PROFESSIONAL
  // ==========================================
  {
    id: 'prof-1',
    category: 'professional',
    question: '2.1 - Can I get an internship as a Freshman?',
    answer: (
      <FaqParagraph>
        Yes! Companies value enthusiasm and your willingness to learn. Come out to our How to Get an
        Internship workshop (September) to learn more!
      </FaqParagraph>
    ),
  },
  {
    id: 'prof-2',
    category: 'professional',
    question:
      '2.2 - Should I attend a career fair and/or professional conferences? How should I prepare?',
    answer: (
      <>
        <FaqParagraph>
          Yes! Attending conferences early on will only boost your confidence in talking to
          recruiters about your professional goals. It’s really important to do your research prior
          to the conference. For companies you are interested in, learn about their mission
          statement, open positions, and how they create value in their space.
        </FaqParagraph>
        <FaqParagraph>
          You can really impress a company by asking thoughtful questions. Even if a company isn’t
          looking for freshmen, it’s still a great chance to talk about what skills they recommend
          you focus on or the attributes of a stand-out applicant.
        </FaqParagraph>
        <FaqParagraph>
          There are many more conferences than the Fall/Spring Career Fairs. Some others include:
        </FaqParagraph>
        <FaqBullet>UF Diversity Meet-up (Fall & Spring)</FaqBullet>
        <FaqBullet>SASE National Convention (October)</FaqBullet>
        <FaqBullet>SASE Southeast Regional Conference (Spring)</FaqBullet>
        <FaqBullet>UF Society of Women Engineers Evening with Industry</FaqBullet>
        <FaqBullet>Grace Hopper Conference</FaqBullet>
        <FaqParagraph style={{ marginTop: space['200'] }}>
          Check out more career events on{' '}
          <FaqLink href="https://www.instagram.com/ufcareercenter/">@ufcareercenter</FaqLink>&apos;s
          Instagram page. They host some more specific events like some centered around AI and how
          to prepare for showcases.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'prof-3',
    category: 'professional',
    question: '2.3 - Can freshmen do research?',
    answer: (
      <>
        <FaqParagraph>
          Yes! Freshmen can do research across multiple disciplines from computer science to botany.
        </FaqParagraph>
        <FaqParagraph>
          From the researcher’s perspective, they don’t have to pay you because you’re an undergrad
          (although some labs might provide a stipend). Also, sometimes they might prefer an
          underclassman because they train you once early on and you can continue working at the lab
          for longer than an upperclassman.
        </FaqParagraph>
        <FaqParagraph>
          The number 1 tip is to be persistent when reaching out to professors. Sometimes, you just
          get ghosted.
        </FaqParagraph>
        <FaqParagraph>Here are some resources to find professors/projects:</FaqParagraph>
        <FaqBullet>
          <FaqLink href="https://cur.aa.ufl.edu/research-search/">CURBS</FaqLink> (Center for
          Undergraduate Research Board of Students)
        </FaqBullet>
        <FaqBullet>
          <FaqLink href="https://www.eng.ufl.edu/graduate/about-us/undergraduate-research/research-projects/">
            Research Projects
          </FaqLink>{' '}
          organized by engineering discipline
        </FaqBullet>
        <FaqBullet>
          <FaqLink href="https://www.eng.ufl.edu/students/students/international/research-abroad/">
            Research Abroad
          </FaqLink>
        </FaqBullet>
        <FaqBullet>
          <FaqLink href="https://cur.aa.ufl.edu/peer-advising/">CURBS peer advising</FaqLink>
        </FaqBullet>
      </>
    ),
  },
  {
    id: 'prof-4',
    category: 'professional',
    question: '2.4 - How do I set up my LinkedIn?',
    answer: (
      <FaqParagraph>
        Use LinkedIn to start growing your network and reaching out for coffee chats. Check out our{' '}
        <FaqLink href="https://drive.google.com/file/d/1XkbIRZqIvvK6jzDUSSJegL-1w1vZeRj2/view?usp=sharing">
          LinkedIn guide
        </FaqLink>{' '}
        to learn how to get started on LinkedIn as well as some more helpful tips.
      </FaqParagraph>
    ),
  },
  {
    id: 'prof-5',
    category: 'professional',
    question: '2.5 - How do I update my resume for college?',
    answer: (
      <>
        <FaqParagraph>
          For your first year, it’s okay to keep stuff from high school. Focus on rewording your
          experiences in a way that quantifies them and is impact-driven. Also, you can start
          updating your resume with your new involvements in student organizations or design teams.
        </FaqParagraph>
        <FaqParagraph>
          Check out our resume template{' '}
          <FaqLink href="https://docs.google.com/document/d/1aRuKSidAX1rXyCNmivHesHYHh0MbUcE2/edit">
            here
          </FaqLink>
          . Also, stay tuned for a resume + interview workshop in September!
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'prof-6',
    category: 'professional',
    question: '2.6 - How can I get my resume reviewed?',
    answer: (
      <>
        <FaqParagraph>Getting as many eyes as possible on your resume is ideal.</FaqParagraph>
        <FaqParagraph>
          Early in the fall, board will host Resume Office Hours where you can drop by Nye and have
          a board member review your resume. You can also submit your resume on a Google form. Check
          out our Instagram (<FaqLink href="https://www.instagram.com/ufsase">@ufsase</FaqLink>) to
          find out when these will be hosted. Also, you can post your resume in #resume-roasts to
          receive feedback from your fellow SASE members.
        </FaqParagraph>
        <FaqParagraph>
          You can also get your resume reviewed at the{' '}
          <FaqLink href="https://career.ufl.edu/services-resources/express-drop-in/">
            Career Connections Center
          </FaqLink>{' '}
          in the Reitz.
        </FaqParagraph>
        <FaqParagraph>
          UF provides the Quinncia tool for free. Quinncia is a virtual tool that provides
          personalized feedback for resumes and mock interviews using artificial intelligence (AI)
          technology:
        </FaqParagraph>
        <FaqBullet>
          Go to <FaqLink href="http://www.quinncia.io">http://www.quinncia.io</FaqLink>
        </FaqBullet>
        <FaqBullet>Click the &quot;Sign In/Up&quot; button</FaqBullet>
        <FaqBullet>Sign in using your UFL Email and GatorLink login information</FaqBullet>
      </>
    ),
  },
  {
    id: 'prof-7',
    category: 'professional',
    question: '2.7 - How do I prepare for interviews?',
    answer: (
      <>
        <FaqParagraph>
          Positions may have different types of behavioral and technical interviews. For behavioral
          interviews, frame your answers in the STAR format:
        </FaqParagraph>
        <FaqBullet>Situation ( S ): Describe the event or situation that you were in.</FaqBullet>
        <FaqBullet>Task ( T ): Explain the task you had to complete.</FaqBullet>
        <FaqBullet>
          Actions ( A ): Describe the specific actions you took to complete the task.
        </FaqBullet>
        <FaqBullet>Results ( R ): Close with the result of your efforts.</FaqBullet>
        <FaqParagraph style={{ marginTop: space['200'] }}>
          Also, stay tuned for a resume + interview workshop in September!
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'prof-8',
    category: 'professional',
    question: '2.8 - What are coffee chats?',
    answer: (
      <FaqParagraph>
        Coffee chats are short networking meetings generally from 15 to 30 minutes long. In these
        calls, you can receive advice, create new professional relationships, and potentially get
        referrals. People are generally excited to help those just starting their careers, so the
        hardest step is usually taking the initiative to set up the call. LinkedIn is a great place
        to get started!
      </FaqParagraph>
    ),
  },

  // ==========================================
  // 3. EXTRACURRICULAR
  // ==========================================
  {
    id: 'extra-1',
    category: 'extracurricular',
    question: '3.1 - How can I get more involved in SASE?',
    answer: (
      <>
        <FaqParagraph>
          SASE offers multiple opportunities to get more involved throughout the year.
        </FaqParagraph>
        <FaqParagraph>
          Early in the fall, SASE intern applications will open. Through SASE interns you can gain a
          behind-the-scenes look into how an org like SASE operates by being on a committee to
          organize your own event. This is a great chance to work with others on a team, build
          leadership skills, and meet other SASE members. Contact our MICs on Discord, @justind1 and
          @bananna4756, to learn more!
        </FaqParagraph>
        <FaqParagraph>
          Joining SASE intramurals is a great way to stay active and connect with new people as
          well. The sports offered include ultimate frisbee, indoor soccer, volleyball, rock league,
          flag football, and kickball. Contact our Sports Coordinators on Discord, @.brea.d and
          @thebluesummon, to learn more!
        </FaqParagraph>
        <FaqParagraph>
          Also, at the start of the fall/spring semester, you can join the mentor-mentee program.
          Mentors can help guide you academically, professionally, and just be a friend. We
          encourage you to get to know your fellow mentees and mentor by participating in Mentorship
          Cup challenges.
        </FaqParagraph>
        <FaqParagraph>
          Put your engineering skills to the test by joining SASE’s design team SET. Last spring,
          during SET&apos;s beta semester, our team created SET Bro, a fully functional robot with
          the ability to converse with SASE members. This year, we are looking to expand SET much
          more. Don&apos;t be afraid to apply if you think you lack experience. Contact our
          Technical Chairs on Discord, @kevintf2 and @mannvika, to learn more!
        </FaqParagraph>
        <FaqParagraph>
          You can sign up to help out with the winter/spring banquet committee if you’re looking for
          a shorter-term commitment. The different committees you can apply for include programming,
          logistics, marketing, and decorations.
        </FaqParagraph>
        <FaqParagraph>
          Also, being active in Discord, going to Nye in Marston, and attending SASE events (GBMs,
          workshops, socials, and service events) are always great ways to get involved.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'extra-2',
    category: 'extracurricular',
    question: '3.2 - How can I get more involved on campus?',
    answer: (
      <>
        <FaqParagraph>
          There are over 1000+ organizations on campus, so it definitely can be overwhelming. Here
          is a{' '}
          <FaqLink href="https://orgs.studentinvolvement.ufl.edu/Organizations">huge list</FaqLink>{' '}
          of some clubs (some listed may not be active). A couple of club categories include
          professional/design teams, social, dance, hobby-centered, religious, volunteering, and
          more.
        </FaqParagraph>
        <FaqParagraph>
          In general, keep an open mind. Try to explore any clubs that possibly pique your interest!
          Professional clubs outside of your major are a great way to gain perspective too. There
          are also unique clubs you can join. Some examples include the Ukulele club, Gator salsa,
          Gator Humans vs. Zombies, and the Archery club.
        </FaqParagraph>
        <FaqParagraph>
          Take advantage of organization fairs and tabling in Turlington to speak directly with club
          officers. You can also have a meeting with someone from the{' '}
          <FaqLink href="https://studentinvolvement.ufl.edu/join-us/iteam/">
            Involvement team
          </FaqLink>{' '}
          to talk about where you can find organizations that meet your interests.
        </FaqParagraph>
        <FaqParagraph>
          Here is a <FaqLink href="https://discord.com/invite/9vGrg9ZvPT">discord link</FaqLink>{' '}
          with multiple student organizations.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'extra-3',
    category: 'extracurricular',
    question: '3.3 - What design teams are at UF?',
    answer: (
      <FaqParagraph>
        Design teams (like SASE’s SET) are a great way to practically apply your skills. Here is a
        list of some{' '}
        <FaqLink href="https://docs.google.com/document/d/1QMs7zF-ljbNrEw0aq8p3U26PrWxs_58jtVS-cOvT6N4/edit">
          design teams at UF
        </FaqLink>
        .
      </FaqParagraph>
    ),
  },
  {
    id: 'extra-4',
    category: 'extracurricular',
    question: '3.4 - Are there jobs available on campus?',
    answer: (
      <>
        <FaqParagraph>
          Yes. However, some of them are popular making them somewhat difficult to get. The jobs
          listed below have openings at different times of the year, so keep checking to see when
          they open up.
        </FaqParagraph>
        <FaqBullet>
          <FaqLink href="https://recsports.ufl.edu/about/student-employment/how-to-apply/">
            UF Recreational Sports
          </FaqLink>
        </FaqBullet>
        <FaqBullet>
          <FaqLink href="https://labs.at.ufl.edu/learning-spaces/jobs/">UF AT Lab</FaqLink>{' '}
          (Printing labs)
        </FaqBullet>
        <FaqBullet>
          <FaqLink href="https://it.ufl.edu/internships/#opportunities">UF IT Internships</FaqLink>{' '}
          (Shows you what’s currently open)
        </FaqBullet>
        <FaqBullet>
          Marston is also hiring (as of 8/22), you can get an application at the front desk
        </FaqBullet>
      </>
    ),
  },

  // ==========================================
  // 4. MISCELLANEOUS
  // ==========================================
  {
    id: 'misc-1',
    category: 'miscellaneous',
    question: '4.1 - Rec Sports Live Feed',
    answer: (
      <FaqParagraph>
        Check out this <FaqLink href="https://recsports.ufl.edu/cameras-counts-2/">link</FaqLink> to
        see live footage of different rooms at South West to see how crowded it is. If you scroll
        down you can find the stats for how crowded both SWRC and Student Rec are.
      </FaqParagraph>
    ),
  },
  {
    id: 'misc-2',
    category: 'miscellaneous',
    question: '4.2 - Setting up doctor’s appointments on campus',
    answer: (
      <FaqParagraph>
        Got the Gainesville plague? Call (352) 265-5555 to schedule an appointment at the infirmary
        (located near Student Rec). They’re open from 8 a.m. - 5 p.m., Monday - Friday. It’s
        recommended you call at 8 a.m. to get a same-day appointment.
      </FaqParagraph>
    ),
  },
  {
    id: 'misc-3',
    category: 'miscellaneous',
    question: '4.3 - Where are the free things?',
    answer: (
      <>
        <FaqParagraph>
          The different organization fairs are a great way to grab some freebies early on in the
          semester. Usually, at the Reitz you’ll find a bunch of events too. The events put on by
          Gatordays and Gatornights usually have fun activities and free food. The off-campus
          housing fair has some of the best freebies.
        </FaqParagraph>
        <FaqParagraph>
          Check your student email and follow these accounts on Instagram to keep up with some
          events on campus:
        </FaqParagraph>
        <FaqBullet>
          <FaqLink href="https://www.instagram.com/ufstudentgov/">@ufstudentgov</FaqLink>
        </FaqBullet>
        <FaqBullet>
          <FaqLink href="https://www.instagram.com/ufgatornights/">@ufgatornights</FaqLink>
        </FaqBullet>
      </>
    ),
  },
  {
    id: 'misc-4',
    category: 'miscellaneous',
    question: '4.4 - Getting around on campus/close to campus',
    answer: (
      <>
        <FaqParagraph>Here are some ways to get around on campus.</FaqParagraph>
        <FaqParagraph>
          The{' '}
          <FaqLink href="https://taps.ufl.edu/alternative-transportation/campus-connector/">
            Campus Connector
          </FaqLink>{' '}
          is a fixed-route walk-on shuttle service. The Connector operates Monday through Friday
          from 6:30 am - 5:30 pm with shuttles arriving at each stop at 15-20 minute intervals
          throughout the day. To get started download the Passio Go app.
        </FaqParagraph>
        <FaqParagraph>
          <FaqLink href="https://taps.ufl.edu/alternative-transportation/snap/">SNAP</FaqLink> is a
          free, nightly, campus safety and transportation service. SNAP operates four to seven
          15-passenger vans (depending on demand) seven nights a week from 6:30 PM – 3 AM during the
          Fall and Spring semesters. It basically works like Uber pool. Download the UF SNAP by
          Spare app to get started. Note that wait times and when you’ll actually get to your
          destination can vary depending on how many people need rides.
        </FaqParagraph>
        <FaqParagraph>
          UF also has the{' '}
          <FaqLink href="https://taps.ufl.edu/alternative-transportation/uf-safe-rides/">
            Safe Rides program with Lyft
          </FaqLink>
          . It is available Wednesday through Sunday from 9 PM – 3 AM. A 50% discount is applied to
          qualifying Lyft Standard rides. Rides must begin and end within the service area to
          qualify.
        </FaqParagraph>
        <FaqParagraph>
          UF uses the{' '}
          <FaqLink href="https://taps.ufl.edu/alternative-transportation/rts/">
            RTS bus service
          </FaqLink>{' '}
          around campus and Gainesville. To see bus routes you can download the GNVRideRTS app or
          use the website{' '}
          <FaqLink href="https://riderts.app/home">https://riderts.app/home</FaqLink>.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'misc-5',
    category: 'miscellaneous',
    question: '4.5 - Getting cheap stuff for your apartment/dorm',
    answer: (
      <FaqParagraph>
        <FaqLink href="https://surplus.ufl.edu/">UF Surplus</FaqLink> sells surplus property to
        students and the public through Buy Now sales and auctions. UF Surplus sales to the public
        include desktop and laptop computers, iPads, tablets, monitors, projectors, printers,
        furniture, bikes, and a varied array of scientific and medical equipment.
      </FaqParagraph>
    ),
  },
  {
    id: 'misc-6',
    category: 'miscellaneous',
    question: '4.6 - Restaurant Recommendations',
    answer: (
      <>
        <FaqParagraph style={{ fontWeight: '600', marginTop: space['100'] }}>
          On Campus / Close to Campus:
        </FaqParagraph>
        <FaqBullet>Chick-fil-A (the Hub)</FaqBullet>
        <FaqBullet>Rotating restaurants in the Reitz</FaqBullet>
        <FaqBullet>
          <FaqLink href="https://krishnalunch.com/krishna-lunch/">Krishna Lunch</FaqLink> (Plaza)
        </FaqBullet>
        <FaqBullet>Cava (Mediterranean)</FaqBullet>
        <FaqBullet>Chipotle (don’t go when busy)</FaqBullet>
        <FaqBullet>Paris Banh Mi</FaqBullet>
        <FaqBullet>Pokebowl Station</FaqBullet>
        <FaqBullet>Bolay</FaqBullet>
        <FaqBullet>Just Salad</FaqBullet>

        <FaqParagraph style={{ fontWeight: '600', marginTop: space['300'] }}>
          Other restaurants:
        </FaqParagraph>
        <FaqBullet>La Tienda (Mexican)</FaqBullet>
        <FaqBullet>Indian Street Food</FaqBullet>
        <FaqBullet>Momoyaki (Korean)</FaqBullet>
        <FaqBullet>Satchel’s (pizza)</FaqBullet>
        <FaqBullet>Nine Spice Fondue (hot pot)</FaqBullet>
        <FaqBullet>Seoul Pocha (Korean)</FaqBullet>
        <FaqBullet>4th Ave Food Park</FaqBullet>
        <FaqBullet>Piesanos</FaqBullet>
      </>
    ),
  },
  {
    id: 'misc-7',
    category: 'miscellaneous',
    question: '4.7 - Important Bike info',
    answer: (
      <>
        <FaqParagraph>
          If you’re bringing a bike to campus, get it{' '}
          <FaqLink href="https://bikes.ufl.edu/bike-registration/">registered with UF PD</FaqLink>!
          A registered bike is more likely to be recovered if stolen and is less likely to be
          targeted for theft. To register your bike, you can stop by the UF Public Safety Office at
          1521 Museum Rd. on campus and simply ask to register your bike at the front desk. Also,
          don’t forget to use a U-lock/D-lock since they are more difficult to cut.
        </FaqParagraph>
        <FaqParagraph>
          <FaqLink href="https://sg.ufl.edu/services/bike-repair/">SG Bike Repair</FaqLink> offers
          free service for UF students and sales of bike necessities like locks, tubes, and parts.
          They are located on the Ground level in the Reitz Union.
        </FaqParagraph>
      </>
    ),
  },
  {
    id: 'misc-8',
    category: 'miscellaneous',
    question: '4.8 - Free Legal Services',
    answer: (
      <FaqParagraph>
        A variety of legal services are free for students. Legal Services can help you out with any
        landlord disputes, traffic citations, property damage, and more. Check out their contact
        info and the other services they offer{' '}
        <FaqLink href="https://sg.ufl.edu/services/legal-services/">here</FaqLink>.
      </FaqParagraph>
    ),
  },
  {
    id: 'misc-9',
    category: 'miscellaneous',
    question: '4.9 - UF Student Discounts and Other Perks',
    answer: (
      <>
        <FaqBullet>
          Free tickets for every sport other than football (gymnastics, baseball, basketball, and
          volleyball)
        </FaqBullet>
        <FaqBullet>Free access to LinkedIn Learning</FaqBullet>
        <FaqBullet>
          At Lake Wauburg, UF students have free access to rock climbing and other activities
        </FaqBullet>
        <FaqBullet>
          The Molm Family Career Closet (
          <FaqLink href="https://career.ufl.edu/services-resources/molm-family-gator-career-closet/">
            Borrow professional clothing
          </FaqLink>
          )
        </FaqBullet>
        <FaqBullet>
          <FaqLink href="https://ufl-flvc.primo.exlibrisgroup.com/discovery/collectionDiscovery?vid=01FALSC_UFL:UFL&collectionId=81747318570006597&lang=en">
            Marston Tools and Technology Lending
          </FaqLink>
        </FaqBullet>
        <FaqBullet>The Marston Makerspace</FaqBullet>
        <FaqBullet>Free admission to the Harn and FL Natural History Museum</FaqBullet>
        <FaqBullet indent={1}>
          The Harn Museum membership also allows you to enter lots of North American museums for
          free (like the Dalí in Tampa and Pérez in Miami)
        </FaqBullet>
        <FaqBullet>
          Free access to movies and documentaries through{' '}
          <FaqLink href="https://www.kanopy.com/en/ufl">Kanopy</FaqLink>
        </FaqBullet>
        <FaqBullet>Kanapaha Botanical Gardens (at a reduced student price)</FaqBullet>
        <FaqBullet>
          The{' '}
          <FaqLink href="https://animal.ifas.ufl.edu/facilities/meat-processing-center/">
            Meat Processing Center
          </FaqLink>{' '}
          (Eat UF-grown proteins)
        </FaqBullet>
        <FaqBullet>GitHub Student Developer Pack</FaqBullet>
        <FaqBullet>Academic journals and publications like the NYT</FaqBullet>
      </>
    ),
  },
  {
    id: 'misc-10',
    category: 'miscellaneous',
    question: '4.10 - Check how crowded the libraries are',
    answer: (
      <FaqParagraph>
        See the capacity percentage at Marston, LibWest, and the other libraries here:{' '}
        <FaqLink href="https://www.uflib.ufl.edu/status/">
          https://www.uflib.ufl.edu/status/
        </FaqLink>
        .
      </FaqParagraph>
    ),
  },
  {
    id: 'misc-11',
    category: 'miscellaneous',
    question: '4.11 - When should I start looking for apartments for next year?',
    answer: (
      <>
        <FaqParagraph>
          In general, the sooner the better! It’s important to start doing research, touring
          apartments, and signing your lease ideally by November or December. You can also check
          reviews and talk to people who are currently living in that complex.
        </FaqParagraph>
        <FaqParagraph>
          Keep in mind that the longer you wait (especially after the new year), rental rates will
          increase and spots become more limited.
        </FaqParagraph>
      </>
    ),
  },
];
