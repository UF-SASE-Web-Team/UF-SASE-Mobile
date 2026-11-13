import { RedHatText_400Regular } from '@expo-google-fonts/red-hat-text/400Regular';
import { RedHatText_500Medium } from '@expo-google-fonts/red-hat-text/500Medium';
import { RedHatText_600SemiBold } from '@expo-google-fonts/red-hat-text/600SemiBold';
import { RedHatText_700Bold } from '@expo-google-fonts/red-hat-text/700Bold';
import { Oswald_700Bold } from '@expo-google-fonts/oswald/700Bold';
import Ionicons from '@expo/vector-icons/Ionicons';

export const fontAssets = {
  ...Ionicons.font,
  RedHatText_400Regular,
  RedHatText_500Medium,
  RedHatText_600SemiBold,
  RedHatText_700Bold,
  Oswald_700Bold,
};

export const fonts = {
  sans: {
    regular: 'RedHatText_400Regular',
    medium: 'RedHatText_500Medium',
    semibold: 'RedHatText_600SemiBold',
    bold: 'RedHatText_700Bold',
  },
  display: { bold: 'Oswald_700Bold' },
} as const;

export const textStyles = {
  display: { fontFamily: fonts.display.bold, fontSize: 38, lineHeight: 44 },
  title: { fontFamily: fonts.sans.bold, fontSize: 24, lineHeight: 30 },
  body: { fontFamily: fonts.sans.regular, fontSize: 17, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.sans.bold, fontSize: 17, lineHeight: 26 },
  bodySm: { fontFamily: fonts.sans.regular, fontSize: 15, lineHeight: 20 },
  bodySmStrong: { fontFamily: fonts.sans.semibold, fontSize: 15, lineHeight: 20 },
} as const;
