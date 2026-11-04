import { palette as p } from './palette';

// create type with required fields for each mode
export type Colors = {
  surface: {
    base: { primary: string; secondary: string; tertiary: string; quaternary: string };
    inverse: { primary: string };
    saseBlue: { primary: string; secondary: string };
    accent: { primary: string; secondary: string; tertiary: string; quaternary: string };
    accentSubtle: { primary: string; secondary: string; tertiary: string; quaternary: string };
    success: { primary: string };
    warning: { primary: string };
    danger: { primary: string };
    media: { scrim: string };
  };
  // text, icons
  content: {
    onBase: { primary: string; secondary: string };
    onInverse: { primary: string };
    onSaseBlue: { primary: string; secondary: string };
    onAccentSubtle: { primary: string; secondary: string; tertiary: string; quaternary: string };
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
    saseBlue: { primary: p.sase.blue[500], secondary: p.sase.blue[1000] },
    accent: {
      primary: p.sase.orange[500],
      secondary: p.sase.green[500],
      tertiary: p.sase.yellow[500],
      quaternary: p.sase.pink[500],
    },
    accentSubtle: {
      primary: p.sase.orange[100],
      secondary: p.sase.green[100],
      tertiary: p.sase.yellow[100],
      quaternary: p.sase.pink[100],
    },
    success: { primary: p.green[500] },
    warning: { primary: p.yellow[400] },
    danger: { primary: p.red[600] },
    media: { scrim: p.black[600] },
  },
  content: {
    onBase: { primary: p.gray[900], secondary: p.gray[600] },
    onInverse: { primary: p.gray[100] },
    onSaseBlue: { primary: p.sase.blue[1000], secondary: p.white[1000] },
    onAccentSubtle: {
      primary: p.sase.orange[800],
      secondary: p.sase.green[800],
      tertiary: p.sase.yellow[800],
      quaternary: p.sase.pink[800],
    },
    onSuccess: { primary: p.green[800] },
    onWarning: { primary: p.yellow[800] },
    onDanger: { primary: p.red[100] },
    onMedia: { primary: p.white[1000] },
  },
  border: {
    base: { subtle: p.gray[300], strong: p.gray[800] },
    saseBlue: { primary: p.sase.blue[1000] },
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
    saseBlue: { primary: p.sase.blue[500], secondary: p.sase.blue[1000] },
    accent: {
      primary: p.sase.orange[500],
      secondary: p.sase.green[500],
      tertiary: p.sase.yellow[500],
      quaternary: p.sase.pink[500],
    },
    accentSubtle: {
      primary: p.sase.orange[900],
      secondary: p.sase.green[900],
      tertiary: p.sase.yellow[900],
      quaternary: p.sase.pink[900],
    },
    success: { primary: p.green[800] },
    warning: { primary: p.yellow[400] },
    danger: { primary: p.red[600] },
    media: { scrim: p.black[600] },
  },
  content: {
    onBase: { primary: p.white[700], secondary: p.white[1000] },
    onInverse: { primary: p.gray[1000] },
    onSaseBlue: { primary: p.sase.blue[500], secondary: p.sase.blue[1000] },
    onAccentSubtle: {
      primary: p.sase.orange[200],
      secondary: p.sase.green[200],
      tertiary: p.sase.yellow[200],
      quaternary: p.sase.pink[200],
    },
    onSuccess: { primary: p.white[1000] },
    onWarning: { primary: p.yellow[800] },
    onDanger: { primary: p.red[100] },
    onMedia: { primary: p.white[1000] },
  },
  border: {
    base: { subtle: p.white[100], strong: p.gray[100] },
    saseBlue: { primary: p.sase.blue[500] },
    success: { primary: p.green[700] },
    warning: { primary: p.yellow[400] },
    danger: { primary: p.red[600] },
  },
};
