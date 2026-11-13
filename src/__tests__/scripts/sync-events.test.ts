import { parseLinkTitle, processDescription, toTitleCase } from '../../../scripts/sync-events';

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
});
