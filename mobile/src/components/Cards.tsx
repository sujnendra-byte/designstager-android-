import React from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Badge, Card, T } from './ui';
import { Draft, MarketItem } from '../lib/api';
import { Tool } from '../lib/tools';
import { C, R } from '../lib/theme';

export function openWeb(path: string, title: string) {
  router.push({ pathname: '/web', params: { path, title } });
}

export function ToolCard({ tool, width }: { tool: Tool; width: number }) {
  return (
    <Card style={{ width, padding: 14, marginBottom: 12 }} onPress={() => openWeb(tool.path, tool.title)}>
      <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: tool.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={tool.icon} size={24} color={tool.tint} />
      </View>
      <T w="medium" size={14.5} style={{ marginTop: 12 }} numberOfLines={1}>
        {tool.title}
      </T>
      <T size={12} color={C.sub} numberOfLines={1}>
        {tool.sub}
      </T>
    </Card>
  );
}

export function openDeck(d: Draft) {
  openWeb(`/ai-presentation/?ds_load_ppt=${encodeURIComponent(d.id)}`, d.title || 'Presentation');
}

export function DeckCard({ d, width }: { d: Draft; width: number }) {
  const img = d.first_slide?.image_data;
  return (
    <Card style={{ width, marginBottom: 14, overflow: 'hidden' }} onPress={() => openDeck(d)}>
      <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#e9ebf3' }}>
        {img ? (
          <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="easel-outline" size={28} color={C.sub} />
          </View>
        )}
      </View>
      <View style={{ padding: 10 }}>
        <T w="medium" size={13} numberOfLines={1}>
          {d.title || 'Untitled'}
        </T>
        <T size={11.5} color={C.sub}>
          {d.slides_count} slides · {timeAgo(d.updated)}
        </T>
      </View>
    </Card>
  );
}

export function MarketCard({ item, width }: { item: MarketItem; width: number }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/market-item', params: { item: JSON.stringify(item) } })}
      style={({ pressed }) => [{ width, marginBottom: 14, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={{ borderRadius: R.sm, overflow: 'hidden', backgroundColor: '#e9ebf3', aspectRatio: 16 / 10 }}>
        {item.thumb ? <Image source={{ uri: item.thumb }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} /> : null}
        <Badge pro={item.pro} />
      </View>
      <T w="medium" size={12.5} numberOfLines={2} style={{ marginTop: 6 }}>
        {item.title}
      </T>
    </Pressable>
  );
}

export function timeAgo(ts: number | string) {
  const t = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(ts);
  if (!t || isNaN(t)) return '';
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} d ago`;
  return new Date(t).toLocaleDateString();
}
