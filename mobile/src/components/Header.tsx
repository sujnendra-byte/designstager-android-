import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CreditsPill, T } from './ui';
import { useAuth } from '../lib/auth';
import { C } from '../lib/theme';

/** Navy page header: page title on the left, credits on the right. */
export default function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { me } = useAuth();
  return (
    <View style={{ backgroundColor: C.navy, paddingTop: insets.top + 8, paddingBottom: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' }}>
      <StatusBar style="light" />
      <T w="bold" size={20} color="#fff" style={{ flex: 1 }}>
        {title}
      </T>
      {right ?? <CreditsPill credits={me?.credits} />}
    </View>
  );
}
