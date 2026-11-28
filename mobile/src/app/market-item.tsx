import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Badge, Button, Card, T } from '../components/ui';
import { MarketItem, marketDownload } from '../lib/api';
import { downloadAndShare } from '../lib/download';
import { useAuth } from '../lib/auth';
import { C } from '../lib/theme';

export default function MarketItemScreen() {
  const { item: raw } = useLocalSearchParams<{ item: string }>();
  const item: MarketItem | null = raw ? JSON.parse(raw) : null;
  const { me, refresh } = useAuth();
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  if (!item) return null;
  const dl = me?.downloads;

  async function download() {
    if (!item) return;
    setBusy(true);
    setMsg('');
    setOk(false);
    setProgress(0);
    try {
      const r = await marketDownload(item.id);
      await downloadAndShare(r.url, r.title || item.title, setProgress);
      setOk(true);
      setMsg('Downloaded. Use the share sheet to save or open it.');
      refresh();
    } catch (e: any) {
      setMsg(e?.message || 'Download failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: '#e9ebf3', width: width - 32, aspectRatio: 16 / 10 }}>
        {item.thumb ? <Image source={{ uri: item.thumb }} style={{ width: '100%', height: '100%' }} contentFit="contain" /> : null}
        <Badge pro={item.pro} />
      </View>

      <T w="bold" size={19} style={{ marginTop: 16 }}>
        {item.title}
      </T>
      {item.categories?.length ? (
        <T size={12.5} color={C.sub} style={{ marginTop: 4 }}>
          {item.categories.filter((c) => c !== 'Marketplace').join(' · ')}
        </T>
      ) : null}

      <Button
        title={busy ? (progress ? `Downloading ${Math.round(progress * 100)}%` : 'Preparing…') : 'Download'}
        icon="download-outline"
        onPress={download}
        loading={busy && !progress}
        style={{ marginTop: 20 }}
      />

      {msg ? (
        <T size={13} color={ok ? C.green : '#dc2626'} style={{ marginTop: 12 }}>
          {msg}
        </T>
      ) : null}

      {dl && (dl.limit_free || dl.limit_pro) ? (
        <Card style={{ padding: 14, marginTop: 20 }}>
          <T w="medium" size={13.5}>
            Today's downloads
          </T>
          <T size={12.5} color={C.sub} style={{ marginTop: 4 }}>
            Free items: {dl.used_free ?? 0} of {dl.limit_free ?? 0}
            {'   ·   '}Pro items: {dl.used_pro ?? 0} of {dl.limit_pro ?? 0}
          </T>
        </Card>
      ) : null}
    </ScrollView>
  );
}
