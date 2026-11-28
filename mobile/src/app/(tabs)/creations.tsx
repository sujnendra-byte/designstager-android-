import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { DeckCard, timeAgo } from '../../components/Cards';
import { Card, Chip, Empty, Loading, T } from '../../components/ui';
import { AiImage, Draft, getMyAudio, getMyImages, getMyPpts, getMyVideos, MediaItem } from '../../lib/api';
import { downloadAndShare } from '../../lib/download';
import { C } from '../../lib/theme';

type Kind = 'ppt' | 'img' | 'audio' | 'video';
const KINDS: { k: Kind; label: string }[] = [
  { k: 'ppt', label: 'Presentations' },
  { k: 'img', label: 'Images' },
  { k: 'audio', label: 'Audio' },
  { k: 'video', label: 'Videos' },
];

export default function Creations() {
  const { width } = useWindowDimensions();
  const [kind, setKind] = useState<Kind>('ppt');
  const [rows, setRows] = useState<any[]>([]);
  const [next, setNext] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const req = useRef(0);

  const load = useCallback(
    async (offset: number) => {
      const id = ++req.current;
      setLoading(true);
      setErr('');
      try {
        let items: any[] = [];
        let nx = 0;
        let tot = 0;
        if (kind === 'ppt') {
          const r = await getMyPpts(offset);
          items = r.drafts; nx = r.next_offset; tot = r.total;
        } else if (kind === 'img') {
          const r = await getMyImages(offset);
          items = r.images; nx = r.next_offset; tot = r.total;
        } else if (kind === 'audio') {
          const r = await getMyAudio(offset);
          items = (r.audios || r.items || []).filter((a) => a.url && !a.is_expired); nx = r.next_offset; tot = r.total;
        } else {
          const r = await getMyVideos(offset);
          items = (r.videos || []).filter((v) => v.url && !v.is_expired); nx = r.next_offset; tot = r.total;
        }
        if (id !== req.current) return;
        setRows((prev) => (offset === 0 ? items : [...prev, ...items]));
        setNext(nx);
        setTotal(tot);
      } catch (e: any) {
        if (id === req.current) setErr(e.message);
      } finally {
        if (id === req.current) setLoading(false);
      }
    },
    [kind]
  );

  useEffect(() => {
    setRows([]);
    load(0);
  }, [load]);

  const pad = 16;
  const cols = kind === 'img' ? 3 : kind === 'ppt' ? 2 : 1;
  const colW = (width - pad * 2 - (cols - 1) * 10) / cols;

  const render = ({ item }: { item: any }) => {
    if (kind === 'ppt') return <DeckCard d={item as Draft} width={colW} />;
    if (kind === 'img') {
      const im = item as AiImage;
      return (
        <Pressable
          onPress={() => router.push({ pathname: '/viewer', params: { url: im.url, title: im.prompt?.slice(0, 40) || 'AI image' } })}
          style={{ width: colW, aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e9ebf3', marginBottom: 10 }}
        >
          <Image source={{ uri: im.url }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
        </Pressable>
      );
    }
    const m = item as MediaItem;
    const title = m.label || m.prompt || (kind === 'audio' ? 'Audio' : 'Video');
    return (
      <Card style={{ padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }} onPress={() => Linking.openURL(m.url)}>
        <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: kind === 'audio' ? '#fdf0d9' : '#fce4ef', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={kind === 'audio' ? 'musical-notes' : 'play'} size={20} color={kind === 'audio' ? '#d97706' : '#db2777'} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <T w="medium" size={14} numberOfLines={1}>
            {title}
          </T>
          <T size={12} color={C.sub}>
            {[m.kind, m.duration ? `${Math.round(m.duration)}s` : '', m.date ? timeAgo(m.date) : ''].filter(Boolean).join(' · ')}
          </T>
        </View>
        <Pressable hitSlop={10} onPress={() => downloadAndShare(m.url, title).catch(() => null)}>
          <Ionicons name="share-outline" size={21} color={C.sub} />
        </Pressable>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="My Creations" />
      <View style={{ flexDirection: 'row', paddingHorizontal: pad, paddingVertical: 12 }}>
        {KINDS.map((k) => (
          <Chip key={k.k} label={k.label} on={kind === k.k} onPress={() => setKind(k.k)} />
        ))}
      </View>
      <FlatList
        key={kind}
        data={rows}
        keyExtractor={(r, i) => String(r.id || r.key || i)}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? { gap: 10 } : undefined}
        contentContainerStyle={{ paddingHorizontal: pad, paddingBottom: 30 }}
        renderItem={render}
        onRefresh={() => load(0)}
        refreshing={false}
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (!loading && rows.length < total && next > 0) load(next);
        }}
        ListEmptyComponent={
          loading ? (
            <Loading />
          ) : err ? (
            <Empty icon="cloud-offline-outline" title="Couldn't load your creations" sub={err} />
          ) : (
            <Empty icon="sparkles-outline" title="Nothing here yet" sub="Things you create with the AI tools appear here." />
          )
        }
        ListFooterComponent={loading && rows.length ? <Loading /> : undefined}
      />
    </View>
  );
}
