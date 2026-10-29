import { palette as p } from './palette';

// create type with required fields for each mode
export type Colors = {
  surface: {
    base: { primary: string; secondary: string; tertiary: string; quaternary: string };
    inverse: { primary: string };
    saseBlue: { primary: string; secondary: string };
    accent: { primary: string; secondary: string; tertiary: string; quaternary: string };
    success: { primary: string };
    warning: { primary: string };
    danger: { primary: string };
    media: { scrim: string };
  };
  // text, icons
  content: {
    onBase: { primary: string; secondary: string };
    onInverse: { primary: string };
    saseBlue: { primary: string };
    onSaseBlue: { primary: string; secondary: string };
    onAccent: { primary: string };
    onSuccess: { primary: string };
    onWarning: { primary: string };
    onDanger: { primary: string };
    onMedia: { primary: string };
  };
  border: {
    base: { subtle: string; strong: string };
    saseBlue: { primary: string };
    success: { primary: string };
    warning: { primary: string };
    danger: { primary: string };
  };
};

export const lightColors: Colors = {
  surface: {
    base: {
      primary: p.white[1000],
      secondary: p.gray[100],
      tertiary: p.gray[200],
      quaternary: p.gray[300],
    },
    inverse: { primary: p.gray[800] },
    saseBlue: { primary: p.sase.blueLight, secondary: p.sase.blueDark },
    accent: {
      primary: p.sase.orange,
      secondary: p.sase.green,
      tertiary: p.sase.yellow,
      quaternary: p.sase.pink,
    },
    success: { primary: p.green[500] },
    warning: { primary: p.yellow[400] },
    danger: { primary: p.red[600] },
    media: { scrim: p.black[600] },
  },
  content: {
    onBase: { primary: p.gray[900], secondary: p.gray[600] },
    onInverse: { primary: p.gray[100] },
    saseBlue: { primary: p.sase.blueDark },
    onSaseBlue: { primary: p.sase.blueDark, secondary: p.white[1000] },
    onAccent: { primary: p.sase.blueDark },
    onSuccess: { primary: p.green[800] },
    onWarning: { primary: p.yellow[800] },
    onDanger: { primary: p.red[100] },
    onMedia: { primary: p.white[1000] },
  },
  border: {
    base: { subtle: p.gray[300], strong: p.gray[800] },
    saseBlue: { primary: p.sase.blueDark },
    success: { primary: p.green[800] },
    warning: { primary: p.yellow[900] },
    danger: { primary: p.red[700] },
  },
};

export const darkColors: Colors = {
  surface: {
    base: {
      primary: p.gray[1000],
      secondary: p.gray[900],
      tertiary: p.gray[700],
      quaternary: p.gray[600],
    },
    inverse: { primary: p.gray[100] },
    saseBlue: { primary: p.sase.blueDark, secondary: p.sase.blueLight },
    accent: {
      primary: p.sase.orange,
      secondary: p.sase.green,
      tertiary: p.sase.yellow,
      quaternary: p.sase.pink,
    },
    success: { primary: p.green[700] },
    warning: { primary: p.yellow[400] },
    danger: { primary: p.red[600] },
    media: { scrim: p.black[600] },
  },
  content: {
    onBase: { primary: p.white[1000], secondary: p.white[700] },
    onInverse: { primary: p.gray[1000] },
    saseBlue: { primary: p.sase.blueLight },
    onSaseBlue: { primary: p.sase.blueLight, secondary: p.sase.blueDark },
    onAccent: { primary: p.sase.blueDark },
    onSuccess: { primary: p.white[1000] },
    onWarning: { primary: p.yellow[800] },
    onDanger: { primary: p.red[100] },
    onMedia: { primary: p.white[1000] },
  },
  border: {
    base: { subtle: p.gray[600], strong: p.gray[100] },
    saseBlue: { primary: p.sase.blueLight },
    success: { primary: p.green[700] },
    warning: { primary: p.yellow[400] },
    danger: { primary: p.red[600] },
  },
};
