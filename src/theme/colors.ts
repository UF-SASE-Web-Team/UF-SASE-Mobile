import { palette as p } from './palette';

// create type for required fields for each mode
export type Colors = {
  surface: {
    base: { primary: string; secondary: string; tertiary: string };
    neutral: { primary: string; secondary: string; tertiary: string };
    saseBlue: { primary: string; secondary: string };
    accent: { primary: string; secondary: string; tertiary: string; quaternary: string };
  };
  // text, icons
  content: {
    onBase: { primary: string; secondary: string; tertiary: string };
    saseBlue: { primary: string };
    onSaseBlue: { primary: string; secondary: string };
    onNeutral: { primary: string; secondary: string; tertiary: string };
  };
  border: {
    base: { primary: string; secondary: string };
    saseBlue: { primary: string };
  };
};

export const lightColors: Colors = {
  surface: {
    base: { primary: p.gray[100], secondary: p.white[1000], tertiary: p.gray[200] },
    neutral: { primary: p.gray[800], secondary: p.gray[500], tertiary: p.gray[300] },
    saseBlue: { primary: p.sase.blueLight, secondary: p.sase.blueDark },
    accent: {
      primary: p.sase.orange,
      secondary: p.sase.green,
      tertiary: p.sase.yellow,
      quaternary: p.sase.pink,
    },
  },
  content: {
    onBase: { primary: p.gray[900], secondary: p.gray[500], tertiary: p.gray[400] },
    saseBlue: { primary: p.sase.blueDark },
    onSaseBlue: { primary: p.sase.blueDark, secondary: p.white[1000] },
    onNeutral: { primary: p.gray[100], secondary: p.gray[900], tertiary: p.gray[700] },
  },
  border: {
    base: { primary: p.gray[300], secondary: p.gray[500] },
    saseBlue: { primary: p.sase.blueDark },
  },
};

export const darkColors: Colors = {
  surface: {
    base: { primary: p.gray[1000], secondary: p.gray[900], tertiary: p.gray[700] },
    neutral: { primary: p.gray[100], secondary: p.gray[500], tertiary: p.gray[700] },
    saseBlue: { primary: p.sase.blueDark, secondary: p.sase.blueLight },
    accent: {
      primary: p.sase.orange,
      secondary: p.sase.green,
      tertiary: p.sase.yellow,
      quaternary: p.sase.pink,
    },
  },
  content: {
    onBase: { primary: p.white[1000], secondary: p.white[700], tertiary: p.white[400] },
    saseBlue: { primary: p.sase.blueLight },
    onSaseBlue: { primary: p.sase.blueLight, secondary: p.sase.blueDark },
    onNeutral: { primary: p.gray[1000], secondary: p.gray[100], tertiary: p.gray[100] },
  },
  border: {
    base: { primary: p.gray[600], secondary: p.gray[500] },
    saseBlue: { primary: p.sase.blueLight },
  },
};
