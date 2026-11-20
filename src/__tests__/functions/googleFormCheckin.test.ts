import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildFormBody,
  DEFAULT_ANSWERS,
  FIELDS,
  matchMajors,
  MissingFieldError,
  parseFormQuestions,
  pickEventOption,
  pickGender,
  resolveUfEmail,
  splitName,
  type FormMember,
} from '../../../supabase/functions/google-form-checkin/form';

// The SASE check-in form's embedded data, saved from its viewform page.
const formHtml = readFileSync(join(__dirname, 'fixtures/sase-checkin-form.txt'), 'utf8');

const member: FormMember = {
  ufid: '12345678',
  fullName: 'Alice Mei Reviewer',
  ufEmail: 'alice@ufl.edu',
  gender: null,
  gradYear: '2028',
  majors: ['Computer Science', 'Underwater Basket Weaving'],
  minors: ['Mathematics'],
  discordHandle: 'alice',
  instagramHandle: null,
};

const entry = (field: number) => `entry.${field}`;

describe('parseFormQuestions', () => {
  it('reads every field the app fills in, with its current options', () => {
    const questions = parseFormQuestions(formHtml);
    for (const field of Object.values(FIELDS)) {
      expect(questions.has(field)).toBe(true);
    }
    expect(questions.get(FIELDS.event)?.options.length).toBeGreaterThan(0);
    expect(questions.get(FIELDS.majors)?.hasOther).toBe(true);
    expect(questions.get(FIELDS.heardFrom)?.hasOther).toBe(true);
  });

  it('keeps the fixed answers in sync with the form options', () => {
    const questions = parseFormQuestions(formHtml);
    expect(questions.get(FIELDS.attendedThisYear)?.options).toEqual(['Yes', 'No']);
    expect(questions.get(FIELDS.gender)?.options).toContain(DEFAULT_ANSWERS.gender);
    expect(questions.get(FIELDS.mailingList)?.options).toContain(DEFAULT_ANSWERS.mailingList);
    expect(questions.get(FIELDS.discord)?.options).toEqual(
      expect.arrayContaining([DEFAULT_ANSWERS.discordYes, DEFAULT_ANSWERS.discordNo]),
    );
    expect(questions.get(FIELDS.instagram)?.options).toEqual(
      expect.arrayContaining([DEFAULT_ANSWERS.instagramYes, DEFAULT_ANSWERS.instagramNo]),
    );
  });

  it('rejects a page without form data', () => {
    expect(() => parseFormQuestions('<html></html>')).toThrow();
  });
});

describe('pickEventOption', () => {
  const options = ['11/18 GBM 4: SASECraft', '11/20 Study Night', 'Friendsgiving Potluck'];

  it('prefers an exact or contained match', () => {
    expect(pickEventOption('GBM 4: SASECraft', options)).toBe('11/18 GBM 4: SASECraft');
    expect(pickEventOption('friendsgiving potluck', options)).toBe('Friendsgiving Potluck');
  });

  it('falls back to the option sharing the most words', () => {
    expect(pickEventOption('Late Study Night @ Marston', options)).toBe('11/20 Study Night');
  });

  it('always fills the answer while the form has any option', () => {
    expect(pickEventOption('Completely Different Event', options)).toBe(options[0]);
    expect(pickEventOption('', options)).toBe(options[0]);
    expect(pickEventOption('Anything', [])).toBeNull();
  });
});

describe('splitName', () => {
  it('splits first and last names', () => {
    expect(splitName('  Alice Mei Reviewer ')).toEqual({ first: 'Alice', last: 'Mei Reviewer' });
    expect(splitName('Cher')).toEqual({ first: 'Cher', last: 'Cher' });
  });
});

describe('matchMajors', () => {
  it('ticks known majors and puts the rest in Other', () => {
    expect(matchMajors(['computer science', 'Art'], ['Computer Science'])).toEqual({
      selected: ['Computer Science'],
      other: 'Art',
    });
    expect(matchMajors([], ['Computer Science'])).toEqual({
      selected: [],
      other: DEFAULT_ANSWERS.noMajor,
    });
  });
});

describe('resolveUfEmail', () => {
  it('uses the saved UF email, then a UF login email', () => {
    expect(resolveUfEmail('Alice@UFL.edu', 'alice@gmail.com')).toBe('alice@ufl.edu');
    expect(resolveUfEmail(null, 'alice@ufl.edu')).toBe('alice@ufl.edu');
    expect(resolveUfEmail(null, 'alice@gmail.com')).toBeNull();
  });
});

describe('pickGender', () => {
  const options = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

  it("uses the member's own answer, self-described as Other, or prefer not to say", () => {
    expect(pickGender('non-binary', options)).toEqual({ option: 'Non-binary', other: null });
    expect(pickGender('Genderfluid', options)).toEqual({
      option: '__other_option__',
      other: 'Genderfluid',
    });
    expect(pickGender(null, options)).toEqual({ option: 'Prefer not to say', other: null });
    expect(pickGender('  ', options)).toEqual({ option: 'Prefer not to say', other: null });
  });
});

describe('buildFormBody', () => {
  const majorOptions = parseFormQuestions(formHtml).get(FIELDS.majors)!.options;

  it('submits only the first page for returning attendees', () => {
    const body = buildFormBody({
      member,
      eventOption: '11/18 GBM 4: SASECraft',
      attendedThisYear: true,
      majorOptions,
    });

    expect(body.get(entry(FIELDS.ufid))).toBe('12345678');
    expect(body.get(entry(FIELDS.firstName))).toBe('Alice');
    expect(body.get(entry(FIELDS.lastName))).toBe('Mei Reviewer');
    expect(body.get(entry(FIELDS.event))).toBe('11/18 GBM 4: SASECraft');
    expect(body.get(entry(FIELDS.attendedThisYear))).toBe('Yes');
    expect(body.get('pageHistory')).toBe('0');
    expect(body.has(entry(FIELDS.ufEmail))).toBe(false);
  });

  it('fills the signup section for first-time attendees', () => {
    const body = buildFormBody({
      member,
      eventOption: '11/18 GBM 4: SASECraft',
      attendedThisYear: false,
      majorOptions,
    });

    expect(body.get(entry(FIELDS.attendedThisYear))).toBe('No');
    expect(body.get('pageHistory')).toBe('0,1');
    expect(body.get(entry(FIELDS.ufEmail))).toBe('alice@ufl.edu');
    expect(body.get(entry(FIELDS.gradYear))).toBe('2028');
    expect(body.getAll(entry(FIELDS.majors))).toEqual(['Computer Science', '__other_option__']);
    expect(body.get(`${entry(FIELDS.majors)}.other_option_response`)).toBe(
      'Underwater Basket Weaving',
    );
    expect(body.get(entry(FIELDS.minors))).toBe('Mathematics');
    expect(body.get(entry(FIELDS.gender))).toBe(DEFAULT_ANSWERS.gender);
    expect(body.get(entry(FIELDS.mailingList))).toBe(DEFAULT_ANSWERS.mailingList);
    expect(body.get(entry(FIELDS.discord))).toBe(DEFAULT_ANSWERS.discordYes);
    expect(body.get(entry(FIELDS.instagram))).toBe(DEFAULT_ANSWERS.instagramNo);
  });

  it('reports what is missing instead of sending an incomplete form', () => {
    const submission = { eventOption: 'GBM', majorOptions };
    expect(() =>
      buildFormBody({ ...submission, member: { ...member, ufid: '' }, attendedThisYear: true }),
    ).toThrow(new MissingFieldError('missing_ufid'));
    expect(() =>
      buildFormBody({
        ...submission,
        member: { ...member, ufEmail: null },
        attendedThisYear: false,
      }),
    ).toThrow(new MissingFieldError('missing_uf_email'));
  });
});
