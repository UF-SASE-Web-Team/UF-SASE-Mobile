import { space } from './sizes';

// Measurements shared by the Profile Page Draft 4 screens.
export const profileLayout = {
  avatarSize: 140,
  avatarImageSize: 123,
  pencilSize: 30,
  academicRowHeight: 42,
  socialRowHeight: 38,
  avatarOptionSize: 122,
  cardRadius: 30,
  gradientBorder: 5,
  actionHeight: 50,
  fieldHeight: space['800'],
  touchTarget: 44,
  bioHeight: 120,
  privacyHeight: 148,
  contentMaxWidth: 480,
  sheetMaxWidth: 560,
  grabberWidth: 60,
  pressedOpacity: 0.7,
  disabledOpacity: 0.5,
} as const;
