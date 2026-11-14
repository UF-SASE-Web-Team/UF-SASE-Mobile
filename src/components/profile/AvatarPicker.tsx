import { FlatList, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { ProfileSheet } from './ProfileSheet';
import { profileAvatars } from '@/lib/profileAvatars';
import { useTheme, useThemedStyles, type Colors, iconSize, radius, space } from '@/theme';

interface AvatarPickerProps {
  visible: boolean;
  selected: string | null;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

export function AvatarPicker({ visible, selected, onSelect, onClose }: AvatarPickerProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <ProfileSheet title="Profile Picture" visible={visible} onClose={onClose}>
      <FlatList
        data={profileAvatars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityState={{
              checked: selected === item.id || (!selected && item.id === 'sase-shark'),
            }}
            onPress={() => {
              onSelect(item.id);
              onClose();
            }}
            style={[styles.option, selected === item.id && styles.selected]}
          >
            <Image
              source={item.source}
              contentFit="contain"
              cachePolicy="memory-disk"
              style={styles.image}
              accessible={false}
            />
            <Text variant="bodyStrong" style={styles.label}>
              {item.label}
            </Text>
            {selected === item.id && (
              <Ionicons
                name="checkmark-circle"
                size={iconSize.md}
                color={colors.surface.saseBlue.primary}
              />
            )}
          </Pressable>
        )}
      />
    </ProfileSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: space['200'],
      borderRadius: radius.lg,
      marginBottom: space['200'],
      gap: space['400'],
    },
    selected: { backgroundColor: colors.surface.base.tertiary },
    image: { width: 122, height: 122 },
    label: { flex: 1 },
  });
