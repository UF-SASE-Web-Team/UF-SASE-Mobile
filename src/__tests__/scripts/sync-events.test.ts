import {
  classifyEventType,
  parseLinkTitle,
  processDescription,
  toTitleCase,
} from '../../../scripts/sync-events';

describe('sync-events link & description processing', () => {
  describe('toTitleCase', () => {
    it('converts all-caps strings to Title Case while preserving known acronyms', () => {
      expect(toTitleCase('INTEREST FORM FOR COMPANY PREFERENCE')).toBe(
        'Interest Form for Company Preference',
      );
      expect(toTitleCase('POTLUCK FORM')).toBe('Potluck Form');
      expect(toTitleCase('COMPLETE SC GUIDE & FAQ')).toBe('Complete SC Guide & FAQ');
      expect(toTitleCase('SASE ICBR LAB TOUR')).toBe('SASE ICBR Lab Tour');
    });
  });

  describe('parseLinkTitle', () => {
    it('handles user-provided test examples accurately', () => {
      // 1. RSVP HERE
      expect(parseLinkTitle('HERE', '🔗 RSVP', 'https://forms.gle/bfgG2WY9QVq5Hi45A')).toBe(
        'RSVP Form',
      );

      // 2. Mentor signup
      expect(
        parseLinkTitle('HERE', '👥 Want to mentor? Sign up', 'https://forms.gle/JZx3K1k78Q6z7QtV7'),
      ).toBe('Mentor Signup');

      // 3. ICBR Lab Tour Sign Up Form
      expect(
        parseLinkTitle(
          'ICBR Lab Tour Sign Up Form',
          '🔗 Sign Up:',
          'https://forms.gle/DYyJGDvjjELD35Bc6',
        ),
      ).toBe('ICBR Lab Tour Sign Up Form');

      // 4. Carpool Sheet: Here
      expect(
        parseLinkTitle(
          'Here',
          '🚗 Carpool Sheet:',
          'https://docs.google.com/spreadsheets/d/1ZNL1CM3aQivkIVrh6W7VHXYA1DsfGvnCtFEUJic5qP4/edit?usp=sharing',
        ),
      ).toBe('Carpool Form');

      // 5. INTEREST FORM FOR COMPANY PREFERENCE HERE!
      expect(
        parseLinkTitle(
          'INTEREST FORM FOR COMPANY PREFERENCE HERE!',
          '',
          'https://forms.gle/NH53zQkc1RwUo5Mq9',
        ),
      ).toBe('Interest Form for Company Preference');

      // 6. Complete SC Guide & FAQ
      expect(
        parseLinkTitle(
          'Complete SC Guide & FAQ',
          '🔔 For more detailed information on the conference details, registration, travel, hotel, and professional prep, please review the',
          'https://docs.google.com/document/d/1E2XdWtpnZo-8Mh9bSmdWbdPehBhKJnjB7l0CElDxJAg/edit?usp=sharing',
        ),
      ).toBe('Complete SC Guide & FAQ');

      // 7. Join the STEM Connect Discord
      expect(
        parseLinkTitle('STEM Connect Discord', '💬 Join the', 'https://discord.gg/MhUXWjUsF2'),
      ).toBe('STEM Connect Discord');

      // 8. Complete the Registration Form
      expect(
        parseLinkTitle(
          'Registration Form',
          '📋 Complete the',
          'https://forms.gle/rh9yQYkt6huz9TjK7',
        ),
      ).toBe('RSVP Form');

      // 9. Roommate Preferences Form & Carpool Sheet
      expect(
        parseLinkTitle('Roommate Preferences Form', '🏨', 'https://forms.gle/LHcmSwc8B4d6mZtb7'),
      ).toBe('Roommate Preferences Form');
      expect(
        parseLinkTitle(
          'Carpool Sheet',
          '&',
          'https://docs.google.com/spreadsheets/d/1DN07D2VX_uGdqnH5cH2-yCe0JVivbO4K9XHOeT7_Ksk/edit?gid=0#gid=0',
        ),
      ).toBe('Carpool Form');

      // 10. POTLUCK FORM
      expect(
        parseLinkTitle(
          'POTLUCK FORM',
          '🍗',
          'https://docs.google.com/spreadsheets/d/1xztnw03llrGrYT9EkL7l2u2pIsWxpNvaLEh5Os5BbI0/edit?gid=0#gid=0',
        ),
      ).toBe('Potluck Form');
    });

    it('handles generic RSVP / sign-up variations', () => {
      expect(
        parseLinkTitle('here', 'RSVP form can be found', 'https://forms.gle/G6o8qNfP5dWZGsSS7'),
      ).toBe('RSVP Form');
      expect(
        parseLinkTitle(
          'HERE',
          'Please RSVP through the link',
          'https://forms.gle/pGyYc5ShyqRyykBz5',
        ),
      ).toBe('RSVP Form');
      expect(
        parseLinkTitle(
          'HERE !',
          'The form to sign up can be found',
          'https://docs.google.com/forms/d/123/viewform',
        ),
      ).toBe('RSVP Form');
    });
  });

  describe('processDescription', () => {
    it('strips date, time, location, removes link lines, and moves bottom content up for Class Scheduling Workshop', () => {
      const rawHtml = `<h1><b>📚 Class Scheduling Workshop</b></h1>Not sure what classes to take next semester? Come plan your schedule with upperclassmen from a wide range of majors who have already been through it! You'll get the chance to work <strong><b>1-on-1 with an upperclassman in your major</b></strong> to build your schedule and get advice! Free popsicles at the event! 🧊&nbsp;<br><br>📆 Date: Wednesday, October 14th&nbsp;<br>🕚 Time: 6PM&nbsp;<br>📍 Location: MCCA A 1142&nbsp;<br><br>&nbsp;💻 <strong><b><u>Bring your laptop</u></b></strong> and have your degree audit/current courses ready so we can help you make the most of your time! All majors and years welcome!&nbsp;<br><br>🔗 RSVP <strong><b><a href="https://forms.gle/bfgG2WY9QVq5Hi45A" target="_blank">HERE</a></b></strong> by October 12th @ 11:59PM so that we can plan accordingly!&nbsp;<br>👥 Want to mentor? Sign up <strong><b><a href="https://forms.gle/JZx3K1k78Q6z7QtV7" target="_blank">HERE</a></b></strong> by October 12th @ 11:59PM!`;

      const result = processDescription(rawHtml);

      // Verify date, time, location lines are removed
      expect(result.description).not.toContain('Date:');
      expect(result.description).not.toContain('Time:');
      expect(result.description).not.toContain('Location:');
      expect(result.description).not.toContain('MCCA A 1142');

      // Verify link lines are removed from description
      expect(result.description).not.toContain('RSVP HERE');
      expect(result.description).not.toContain('Want to mentor?');
      expect(result.description).not.toContain('https://forms.gle/');

      // Verify bottom content moved up into description
      expect(result.description).toContain('Bring your laptop');
      expect(result.description).toContain(
        'Not sure what classes to take next semester? Come plan your schedule',
      );

      // Verify extracted links
      expect(result.links).toEqual([
        {
          title: 'RSVP Form',
          url: 'https://forms.gle/bfgG2WY9QVq5Hi45A',
        },
        {
          title: 'Mentor Signup',
          url: 'https://forms.gle/JZx3K1k78Q6z7QtV7',
        },
      ]);
    });

    it('handles multiple links on a single line and plain parenthesized URLs', () => {
      const plainText = `Join us at STEM Connect!
🏨 Roommate Preferences Form (https://forms.gle/LHcmSwc8B4d6mZtb7) & Carpool Sheet (https://docs.google.com/spreadsheets/d/1DN07D2VX/edit)
See you there!`;

      const result = processDescription(plainText);

      expect(result.description).not.toContain('Roommate Preferences Form');
      expect(result.description).not.toContain('Carpool Sheet');
      expect(result.description).toContain('Join us at STEM Connect!');
      expect(result.description).toContain('See you there!');

      expect(result.links).toEqual([
        {
          title: 'Roommate Preferences Form',
          url: 'https://forms.gle/LHcmSwc8B4d6mZtb7',
        },
        {
          title: 'Carpool Form',
          url: 'https://docs.google.com/spreadsheets/d/1DN07D2VX/edit',
        },
      ]);
    });
  });

  describe('classifyEventType', () => {
    describe('gbm', () => {
      it('categorizes general body meetings as gbm even with sponsors or aftersocials', () => {
        expect(
          classifyEventType(
            'SASE GBM 1: Avatar the Last SASEBender',
            "Come to GBM1: Avatar the Last SASEbender and get ready to master all the elements of SASE... FREE food: dumplings and fried rice. Aftersocial: Huey Magoo's",
          ),
        ).toBe('gbm');

        expect(
          classifyEventType(
            'SASE GBM 3 w/ J&J',
            'GBM 3 ft. Johnson & Johnson. Join us for our third GBM of the semester, Cooking Mama: SASE Appétit!, featuring Johnson & Johnson (J&J)! Hear about career opportunities...',
          ),
        ).toBe('gbm');

        expect(
          classifyEventType(
            'SASE GBM 4',
            'GBM4: SASE#2026 has invited you to SASEcraft! How Did We Get Here? One block at a time...',
          ),
        ).toBe('gbm');

        expect(classifyEventType('General Body Meeting #2', null)).toBe('gbm');
      });
    });

    describe('service', () => {
      it('categorizes community service, blood drives, and cleanups as service', () => {
        expect(classifyEventType('SASE x HEAL Adopt-A-Street', null)).toBe('service');

        expect(
          classifyEventType(
            'SASE x HEAL Adopt-A-Street',
            'If you have any questions, please contact Maryanne Anderson Lee (@Maryanne | Community Outreach) on Discord!',
          ),
        ).toBe('service');

        expect(
          classifyEventType(
            'SASE Blood Drive',
            'What if you had the power to save three lives in just one hour? Service Committee is partnering with LifeSouth to host a blood drive... There will be a social beforehand... All donations will be made to local hospitals...',
          ),
        ).toBe('service');

        expect(
          classifyEventType(
            'Campus Cleanup & Tree Planting',
            'Volunteer with SASE to clean up the campus grounds!',
          ),
        ).toBe('service');
      });
    });

    describe('sports', () => {
      it('categorizes sports events even when titled with social or workshop', () => {
        expect(
          classifyEventType(
            'SASE Pickleball Social',
            "🎾 Pickleball Social 🎾 Start working on your serve, because SASE's Pickleball Social is coming in hot at Flavet Field Pickleball Courts! Contact Andrew Lo (@Andrew Lo | Sports Coordinator)",
          ),
        ).toBe('sports');

        expect(
          classifyEventType('Pickleball Social', 'Do we all miss pickleball? SASEsports got you!'),
        ).toBe('sports');

        expect(
          classifyEventType(
            'Mens Ultimate Frisbee x SASE',
            '🥏Ultimate Frisbee Social🥏 SASE is teaming up with UF Men’s Ultimate Frisbee Club for scores and sprints! Contact Carol Shang (@Carol Shang | Sports Coordinator)',
          ),
        ).toBe('sports');

        expect(
          classifyEventType(
            'Volleyball Workshop & Tourney',
            'Volleyball workshop + Tournament 🏐 Get ready to bump, set, and spike! Join us for an action-packed day of volleyball featuring a skill-building workshop followed by an exciting tournament.',
          ),
        ).toBe('sports');

        expect(classifyEventType('JSA x SASE x CASA Volleyball Workshop', null)).toBe('sports');
        expect(classifyEventType('FES Field Day', null)).toBe('sports');

        expect(
          classifyEventType(
            'SASE-ian Games',
            'Asian Games-themed Field Day! High-stakes games: Ultimate Frisbee, Dodgeball, Tug of War, Relay Races, Casual Sports & Lawn Games. Contact Andrew Lo (@Andrew Lo | Sports Coordinator)',
          ),
        ).toBe('sports');
      });
    });

    describe('career', () => {
      it('categorizes career fairs, workshops, research, info sessions, and internship prep as career', () => {
        expect(
          classifyEventType(
            'ExxonMobil Info Session',
            'Interested in starting your career with one of the world’s largest energy companies? Connect directly with ExxonMobil representatives!',
          ),
        ).toBe('career');

        expect(
          classifyEventType(
            'Resume/Career Fair Workshop',
            '🚀 Resume & Career Fair Prep Workshop 📄💼 Career Week is coming up! A strong resume is one of the most important tools...',
          ),
        ).toBe('career');

        expect(
          classifyEventType(
            'Apply-A-Thon',
            'Happy internship application season! Join your fellow SASE members at our annual Apply-a-thon to mass apply to internships, research positions...',
          ),
        ).toBe('career');

        expect(
          classifyEventType(
            'ICBR Lab Tour',
            'Join SASE Science for an exclusive tour of the Interdisciplinary Center for Biotechnology Research (ICBR)! Explore cutting-edge biotech equipment and see high-level research in action!',
          ),
        ).toBe('career');

        expect(
          classifyEventType(
            'SASE Research & Project Poster Symposium',
            'An evening dedicated to highlighting academic research, capstone designs, and hands-on engineering projects crafted by our members!',
          ),
        ).toBe('career');

        expect(
          classifyEventType(
            'Class Scheduling Workshop',
            'Not sure what classes to take next semester? Come plan your schedule with upperclassmen from a wide range of majors!',
          ),
        ).toBe('career');

        expect(
          classifyEventType(
            'Professional Headshot Fundraiser',
            'Want to add the finishing touches to your professional profile before career week? SASE has you covered with our annual Professional Headshot Fundraiser!',
          ),
        ).toBe('career');

        expect(
          classifyEventType(
            'SpaceXAI Grok Student Build Night',
            'Come experiment, build, and connect with other students while exploring what you can create with artificial intelligence.',
          ),
        ).toBe('career');

        expect(classifyEventType('Project Captain Info Zoom', null)).toBe('career');
        expect(classifyEventType('Resume Review/Mock Interview Week', null)).toBe('career');
        expect(classifyEventType('P&G Info Session', null)).toBe('career');
      });
    });

    describe('social', () => {
      it('categorizes socials, trips, banquets, and cultural food workshops as social', () => {
        expect(
          classifyEventType(
            'CASA x HEAL x SASE x KUSA Beach Trip',
            "Join CASA, HEAL, SASE, and KUSA for Single's Inferno: Summer Beach Trip! 🏖️ Take on exciting beach challenges, compete for prizes, make new connections...",
          ),
        ).toBe('social');

        expect(
          classifyEventType(
            'Gimbap Making Workshop',
            'Have YOU ever thought that you might be a master chef? Find out at our GIMBAP WORKSHOP! We will be locking in on how to make gimbap, a staple from Korean culture!',
          ),
        ).toBe('social');

        expect(
          classifyEventType(
            'New Member Welcome',
            "Trying to get involved on campus? Wondering what SASE is all about? Come explore all of SASE's programs... Afterwards, we'll walk together to Tea Moment for our aftersocial!",
          ),
        ).toBe('social');

        expect(
          classifyEventType(
            'SASE Midtown Munch & Mingle',
            "Ready for good food and great vibes? Join SASE for our Midtown Munch + Mingle! We'll be gathering at Plaza of the Americas and walking over to Midtown together...",
          ),
        ).toBe('social');

        expect(
          classifyEventType(
            "SASE's Ultimate Game Night",
            'An evening of high energy, epic board games, and nonstop competition!',
          ),
        ).toBe('social');

        expect(
          classifyEventType(
            'CASA x VSO x SASE x FLP Potluck',
            'Grab your chef hats and get ready for good food, great vibes, and zero kitchen fires. Bring a dish to share...',
          ),
        ).toBe('social');

        expect(
          classifyEventType(
            'Plants Vs. Zombies: Mentor-Mentee Showdown',
            'Gather your M&M groups and prepare to go head-to-head in a series of minigames and challenges to defend your garden... EARN POINTS TOWARD THE M&M CUP!!',
          ),
        ).toBe('social');

        expect(
          classifyEventType(
            "'24-'25 Interns Reunion",
            'Were you an SASE Intern in the 2024 - 2025 school year? Come out to our exclusive reunion event, exploring Devils Millhopper and then 4th Ave for food.',
          ),
        ).toBe('social');

        expect(
          classifyEventType(
            'SASEGIVING',
            'Fall is here, and so is SASEGIVING! Reflect on what we are grateful for through our variety of activities and potluck.',
          ),
        ).toBe('social');

        expect(classifyEventType('M&M Scavenger Hunt', null)).toBe('social');
        expect(classifyEventType('M&M Picnic', null)).toBe('social');
        expect(classifyEventType('SASE Winter Banquet', null)).toBe('social');
      });
    });

    describe('organizer contact footer resilience', () => {
      it('does not misclassify networking panels as service when contact is Community Outreach coordinator', () => {
        expect(
          classifyEventType(
            'SASE X InternSHPE Panel',
            'SASE x SHPE Intern Speed Networking Event. Curious about what it is like to work in different industries? If you have any questions, please contact Kayla Chen (@Kayla | External VP) or Maryanne Anderson Lee (@Maryanne | Community Outreach) on Discord.',
          ),
        ).toBe('career');
      });
    });
  });
});
