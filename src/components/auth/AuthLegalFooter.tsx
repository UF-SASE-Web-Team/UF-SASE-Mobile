import React from 'react';
import { Alert, Linking, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { legalLinks } from '@/lib/links';
import { space, type Colors } from '@/theme';

function openLegalLink(url: string) {
  Linking.openURL(url).catch(() =>
    Alert.alert('Could not open link', `Please visit ${url} in your browser.`),
  );
}

export function AuthLegalFooter() {
  const styles = useThemedStyles(createStyles);

  return (
    <Text variant="bodySm" style={styles.legalNotice}>
      By creating an account, you agree to the{' '}
      <Text
        variant="bodySmStrong"
        accessibilityRole="link"
        onPress={() => openLegalLink(legalLinks.terms)}
        style={styles.legalLink}
      >
        Terms of Service
      </Text>{' '}
      and{' '}
      <Text
        variant="bodySmStrong"
        accessibilityRole="link"
        onPress={() => openLegalLink(legalLinks.privacy)}
        style={styles.legalLink}
      >
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    legalNotice: {
      color: colors.content.onBase.secondary,
      textAlign: 'center',
      marginTop: space['300'],
      lineHeight: 20,
    },
    legalLink: {
      color: colors.content.onBase.brand,
      textDecorationLine: 'underline',
    },
  });
