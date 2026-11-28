// Small building blocks shared by all screens.
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, R, shadow } from '../lib/theme';

export function T(props: TextProps & { w?: 'regular' | 'medium' | 'bold'; size?: number; color?: string }) {
  const { w = 'regular', size = 14, color = C.text, style, ...rest } = props;
  return <Text {...rest} style={[{ fontFamily: F[w], fontSize: size, color }, style]} />;
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'dark' | 'light';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg = kind === 'primary' ? C.orange : kind === 'dark' ? C.navy : C.chip;
  const fg = kind === 'light' ? C.text : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} /> : null}
          <T w="medium" size={15} color={fg}>
            {title}
          </T>
        </>
      )}
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && { backgroundColor: C.navy, borderColor: C.navy }]}>
      <T w="medium" size={12.5} color={on ? '#fff' : C.text}>
        {label}
      </T>
    </Pressable>
  );
}

export function Badge({ pro }: { pro: boolean }) {
  return (
    <View style={[s.badge, { backgroundColor: pro ? C.gold : C.green }]}>
      <T w="bold" size={10} color="#fff">
        {pro ? 'PRO' : 'FREE'}
      </T>
    </View>
  );
}

export function Empty({ icon, title, sub }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub?: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 40 }}>
      <Ionicons name={icon} size={44} color={C.sub} />
      <T w="medium" size={16} style={{ marginTop: 12, textAlign: 'center' }}>
        {title}
      </T>
      {sub ? (
        <T size={13} color={C.sub} style={{ marginTop: 6, textAlign: 'center' }}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator color={C.orange} />
    </View>
  );
}

export function CreditsPill({ credits }: { credits?: number }) {
  return (
    <View style={s.pill}>
      <Ionicons name="star" size={13} color={C.gold} />
      <T w="medium" size={13} color="#fff" style={{ marginLeft: 5 }}>
        {credits ?? '–'} cr
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.md, ...shadow },
  btn: { height: 50, borderRadius: R.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', marginRight: 8 },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,.14)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.pill },
});
