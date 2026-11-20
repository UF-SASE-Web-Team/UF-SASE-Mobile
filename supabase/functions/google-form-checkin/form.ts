// Pure helpers for filling out the SASE Google check-in form.
//
// No Deno or network APIs here, so Jest can test this file directly.

/** Field IDs of the SASE check-in form ("entry.<id>" in the submission). */
export const FIELDS = {
  ufid: 660476112,
  firstName: 1770806887,
  lastName: 415482174,
  event: 436374457,
  attendedThisYear: 630238735,
  // The signup section, only shown to people who answer "No" above.
  ufEmail: 503071130,
  gender: 1512533453,
  gradYear: 1470436288,
  majors: 1158091356,
  minors: 1768527205,
  heardFrom: 979729436,
  mailingList: 1502800290,
  discord: 1801978627,
  instagram: 243752196,
} as const;

/**
 * Answers to signup questions the app has no data for. These are the only
 * made-up answers in a submission, so they live in one place.
 */
export const DEFAULT_ANSWERS = {
  // Only used when the member hasn't set a gender in their private profile details.
  gender: 'Prefer not to say',
  heardFromOther: 'SASE app',
  noMajor: 'Undeclared',
  // Never subscribe someone to email without their consent.
  mailingList: 'No thank you!',
  discordYes: 'Yes!',
  discordNo: "No, I don't have Discord",
  instagramYes: 'Yes!',
  instagramNo: "No, I'll click this link and follow you now!",
} as const;

const OTHER_OPTION = '__other_option__';

export type FormQuestion = { options: string[]; hasOther: boolean };
/** Questions keyed by field ID. */
export type FormQuestions = Map<number, FormQuestion>;

/**
 * Reads every question's current options out of a form's viewform page.
 * Google embeds the whole form as JSON in `FB_PUBLIC_LOAD_DATA_`.
 */
export function parseFormQuestions(html: string): FormQuestions {
  const match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);\s*<\/script>/);
  if (!match) throw new Error('Form data not found');

  const data: unknown = JSON.parse(match[1]);
  const items = (data as unknown[][])?.[1]?.[1];
  if (!Array.isArray(items)) throw new Error('Form data has no questions');

  const questions: FormQuestions = new Map();
  for (const item of items) {
    const inputs = Array.isArray(item) ? item[4] : null;
    if (!Array.isArray(inputs)) continue;
    for (const input of inputs) {
      if (!Array.isArray(input) || typeof input[0] !== 'number') continue;
      const rawOptions = Array.isArray(input[1]) ? input[1] : [];
      const options: string[] = [];
      let hasOther = false;
      for (const option of rawOptions) {
        if (!Array.isArray(option)) continue;
        // An option flagged at index 4 is the free-text "Other" choice.
        if (option[4] === 1) hasOther = true;
        else if (typeof option[0] === 'string' && option[0]) options.push(option[0]);
      }
      questions.set(input[0], { options, hasOther });
    }
  }
  return questions;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function words(text: string): Set<string> {
  return new Set(normalize(text).split(' ').filter(Boolean));
}

/**
 * Chooses the form's event answer for an app event. The form's option changes
 * every event and must always be filled, so this never returns empty while the
 * form has any option: exact match, then containment, then most shared words,
 * then the first option.
 */
export function pickEventOption(eventTitle: string, options: string[]): string | null {
  if (options.length === 0) return null;
  const title = normalize(eventTitle);
  if (!title) return options[0];

  const exact = options.find((option) => normalize(option) === title);
  if (exact) return exact;

  const contains = options.find((option) => {
    const candidate = normalize(option);
    return candidate.length > 0 && (candidate.includes(title) || title.includes(candidate));
  });
  if (contains) return contains;

  const titleWords = words(eventTitle);
  let best = options[0];
  let bestScore = 0;
  for (const option of options) {
    let score = 0;
    for (const word of words(option)) if (titleWords.has(word)) score += 1;
    if (score > bestScore) {
      best = option;
      bestScore = score;
    }
  }
  return best;
}

/** Splits a full name into the form's first and last name fields. */
export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/** Matches profile majors to the form's checkbox options; the rest go in "Other". */
export function matchMajors(
  majors: string[],
  options: string[],
): { selected: string[]; other: string | null } {
  const byKey = new Map(options.map((option) => [normalize(option), option]));
  const selected: string[] = [];
  const unmatched: string[] = [];
  for (const major of majors.map((m) => m.trim()).filter(Boolean)) {
    const option = byKey.get(normalize(major));
    if (option) {
      if (!selected.includes(option)) selected.push(option);
    } else {
      unmatched.push(major);
    }
  }
  if (selected.length === 0 && unmatched.length === 0) {
    return { selected, other: DEFAULT_ANSWERS.noMajor };
  }
  return { selected, other: unmatched.length > 0 ? unmatched.join(', ') : null };
}

export type FormMember = {
  ufid: string;
  fullName: string;
  ufEmail: string | null;
  /** Private, optional. Never inferred from pronouns. */
  gender: string | null;
  gradYear: string | null;
  majors: string[];
  minors: string[];
  discordHandle: string | null;
  instagramHandle: string | null;
};

export type FormSubmission = {
  member: FormMember;
  eventOption: string;
  attendedThisYear: boolean;
  /** Current major options on the form, used to tick the right boxes. */
  majorOptions: string[];
  /** Current gender options on the form. */
  genderOptions?: string[];
};

export class MissingFieldError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

/**
 * The gender answer: the member's own choice when it is one of the form's
 * options, their self-described text as "Other", or "Prefer not to say".
 */
export function pickGender(
  gender: string | null,
  options: string[],
): { option: string; other: string | null } {
  const value = gender?.trim();
  if (!value) return { option: DEFAULT_ANSWERS.gender, other: null };
  const match = options.find((option) => normalize(option) === normalize(value));
  if (match) return { option: match, other: null };
  return { option: OTHER_OPTION, other: value };
}

/** Builds the `formResponse` POST body for one check-in. */
export function buildFormBody({
  member,
  eventOption,
  attendedThisYear,
  majorOptions,
  genderOptions = [DEFAULT_ANSWERS.gender],
}: FormSubmission): URLSearchParams {
  if (!member.ufid) throw new MissingFieldError('missing_ufid');
  const { first, last } = splitName(member.fullName);
  if (!first) throw new MissingFieldError('missing_name');

  const body = new URLSearchParams();
  const set = (field: number, value: string) => body.append(`entry.${field}`, value);

  set(FIELDS.ufid, member.ufid);
  set(FIELDS.firstName, first);
  set(FIELDS.lastName, last);
  set(FIELDS.event, eventOption);

  if (attendedThisYear) {
    set(FIELDS.attendedThisYear, 'Yes');
    // "Yes" submits straight from the first page.
    body.append('pageHistory', '0');
    return body;
  }

  if (!member.ufEmail) throw new MissingFieldError('missing_uf_email');
  if (!member.gradYear?.trim()) throw new MissingFieldError('missing_grad_year');

  set(FIELDS.attendedThisYear, 'No');
  set(FIELDS.ufEmail, member.ufEmail);
  const gender = pickGender(member.gender, genderOptions);
  set(FIELDS.gender, gender.option);
  if (gender.other) body.append(`entry.${FIELDS.gender}.other_option_response`, gender.other);
  set(FIELDS.gradYear, member.gradYear.trim());

  const majors = matchMajors(member.majors, majorOptions);
  for (const option of majors.selected) set(FIELDS.majors, option);
  if (majors.other) {
    set(FIELDS.majors, OTHER_OPTION);
    body.append(`entry.${FIELDS.majors}.other_option_response`, majors.other);
  }

  const minors = member.minors.map((m) => m.trim()).filter(Boolean);
  if (minors.length > 0) set(FIELDS.minors, minors.join(', '));

  set(FIELDS.heardFrom, OTHER_OPTION);
  body.append(`entry.${FIELDS.heardFrom}.other_option_response`, DEFAULT_ANSWERS.heardFromOther);

  set(FIELDS.mailingList, DEFAULT_ANSWERS.mailingList);
  set(
    FIELDS.discord,
    member.discordHandle?.trim() ? DEFAULT_ANSWERS.discordYes : DEFAULT_ANSWERS.discordNo,
  );
  set(
    FIELDS.instagram,
    member.instagramHandle?.trim() ? DEFAULT_ANSWERS.instagramYes : DEFAULT_ANSWERS.instagramNo,
  );

  // The member saw the first page and the signup section.
  body.append('pageHistory', '0,1');
  return body;
}

/** The UF email to send: the saved one, or the login email if it is already a UF address. */
export function resolveUfEmail(saved: string | null, loginEmail: string | null): string | null {
  const isUf = (email: string | null | undefined) => !!email && /^[^@\s]+@ufl\.edu$/i.test(email);
  if (isUf(saved)) return saved!.trim().toLowerCase();
  if (isUf(loginEmail)) return loginEmail!.trim().toLowerCase();
  return null;
}
