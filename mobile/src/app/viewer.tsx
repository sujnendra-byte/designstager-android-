import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../components/ui';
import { downloadAndShare } from '../lib/download';

/** Full-screen image with Save / Share. */
export default function Viewer() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="contain" />
      <View style={{ position: 'absolute', top: insets.top + 6, left: 10, right: 10, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 8 }}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
        <T w="medium" size={14} color="#fff" numberOfLines={1} style={{ flex: 1, marginLeft: 6 }}>
          {title}
        </T>
        <Pressable
          hitSlop={10}
          style={{ padding: 8 }}
          onPress={async () => {
            setBusy(true);
            await downloadAndShare(url, title || 'designstager-image').catch(() => null);
            setBusy(false);
          }}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="share-outline" size={24} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}
