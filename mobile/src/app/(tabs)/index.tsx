import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, useWindowDimensions, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { DeckCard, MarketCard, ToolCard } from '../../components/Cards';
import { Card, T } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { Draft, getMarket, getMyPpts, MarketItem } from '../../lib/api';
import { TOOLS } from '../../lib/tools';
import { C } from '../../lib/theme';

export default function Home() {
  const { me, refresh } = useAuth();
  const { width } = useWindowDimensions();
  const [decks, setDecks] = useState<Draft[]>([]);
  const [free, setFree] = useState<MarketItem[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    await Promise.all([
      refresh(),
      getMyPpts(0).then((r) => setDecks(r.drafts.slice(0, 6))).catch(() => null),
      getMarket({ tier: 'free', category: 'powerpoint-templates' }).then((r) => setFree(r.items.slice(0, 8))).catch(() => null),
    ]);
    setBusy(false);
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const pad = 18;
  const half = (width - pad * 2 - 12) / 2;
  const first = (me?.user?.name || '').split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="DesignStager" />
      <ScrollView contentContainerStyle={{ padding: pad, paddingBottom: 30 }} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
        <T w="bold" size={22}>
          {first ? `Hi ${first} 👋` : 'Welcome 👋'}
        </T>
        <T size={13.5} color={C.sub} style={{ marginBottom: 16 }}>
          What would you like to create today?
        </T>

        <Card style={{ padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/account')}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff4dc', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="star" size={22} color={C.gold} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <T w="bold" size={18}>
              {me?.credits ?? '–'} credits
            </T>
            <T size={12.5} color={C.sub}>
              {me?.plan_label ? `${me.plan_label} plan` : ' '}
            </T>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.sub} />
        </Card>

        <Row title="Create with AI" onMore={() => router.push('/create')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {TOOLS.map((t) => (
            <ToolCard key={t.id} tool={t} width={half} />
          ))}
        </View>

        {decks.length ? (
          <>
            <Row title="Recent presentations" onMore={() => router.push('/creations')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -pad }} contentContainerStyle={{ paddingHorizontal: pad, gap: 12 }}>
              {decks.map((d) => (
                <DeckCard key={d.id} d={d} width={220} />
              ))}
            </ScrollView>
          </>
        ) : null}

        {free.length ? (
          <>
            <Row title="Free slide templates" onMore={() => router.push('/market')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -pad }} contentContainerStyle={{ paddingHorizontal: pad, gap: 12 }}>
              {free.map((m) => (
                <MarketCard key={m.id} item={m} width={190} />
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Row({ title, onMore }: { title: string; onMore?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
      <T w="bold" size={16.5} style={{ flex: 1 }}>
        {title}
      </T>
      {onMore ? (
        <Pressable onPress={onMore} hitSlop={8}>
          <T w="medium" size={13} color={C.orange}>
            See all
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}
