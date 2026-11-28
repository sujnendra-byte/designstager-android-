import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, TextInput, useWindowDimensions, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { MarketCard } from '../../components/Cards';
import { Chip, Empty, Loading, T } from '../../components/ui';
import { getMarket, getMarketCats, MarketCat, MarketItem } from '../../lib/api';
import { C, F, R } from '../../lib/theme';

const TIERS = [
  { k: '', label: 'All' },
  { k: 'free', label: 'Free' },
  { k: 'pro', label: 'Pro' },
];

export default function Market() {
  const { width } = useWindowDimensions();
  const [cats, setCats] = useState<MarketCat[]>([]);
  const [root, setRoot] = useState(0);
  const [main, setMain] = useState('');       // top-level category slug ('' = everything)
  const [sub, setSub] = useState('');         // sub-category slug
  const [tier, setTier] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<MarketItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const reqId = useRef(0);

  useEffect(() => {
    getMarketCats()
      .then((r) => {
        setCats(r.categories);
        setRoot(r.root);
      })
      .catch(() => null);
  }, []);

  const mains = useMemo(() => cats.filter((c) => c.parent === root && root !== 0), [cats, root]);
  const mainCat = mains.find((c) => c.slug === main);
  const subs = useMemo(() => (mainCat ? cats.filter((c) => c.parent === mainCat.id) : []), [cats, mainCat]);

  const load = useCallback(
    async (p: number) => {
      const id = ++reqId.current;
      setLoading(true);
      setErr('');
      try {
        const r = await getMarket({ page: p, search: query, category: sub || main, tier });
        if (id !== reqId.current) return;
        setItems((prev) => (p === 1 ? r.items : [...prev, ...r.items]));
        setPage(r.page);
        setPages(r.pages);
      } catch (e: any) {
        if (id === reqId.current) setErr(e.message);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [query, main, sub, tier]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const pad = 16;
  const col = (width - pad * 2 - 12) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="Marketplace" />
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: pad, paddingBottom: 30 }}
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (!loading && page < pages) load(page + 1);
        }}
        ListHeaderComponent={
          <View style={{ paddingTop: 14, paddingBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: R.md, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, height: 46 }}>
              <Ionicons name="search" size={18} color={C.sub} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={() => setQuery(search.trim())}
                returnKeyType="search"
                placeholder="Search designs"
                placeholderTextColor="#a0a5bd"
                style={{ flex: 1, marginLeft: 8, fontFamily: F.regular, fontSize: 14.5, color: C.text }}
              />
              {search ? (
                <Pressable
                  onPress={() => {
                    setSearch('');
                    setQuery('');
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color={C.sub} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              <Chip label="All" on={!main} onPress={() => { setMain(''); setSub(''); }} />
              {mains.map((c) => (
                <Chip key={c.id} label={c.name} on={main === c.slug} onPress={() => { setMain(c.slug); setSub(''); }} />
              ))}
            </ScrollView>

            {subs.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <Chip label="All types" on={!sub} onPress={() => setSub('')} />
                {subs.map((c) => (
                  <Chip key={c.id} label={c.name} on={sub === c.slug} onPress={() => setSub(c.slug)} />
                ))}
              </ScrollView>
            ) : null}

            <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 6 }}>
              {TIERS.map((t) => (
                <Chip key={t.k} label={t.label} on={tier === t.k} onPress={() => setTier(t.k)} />
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => <MarketCard item={item} width={col} />}
        ListEmptyComponent={
          loading ? <Loading /> : err ? <Empty icon="cloud-offline-outline" title="Couldn't load the marketplace" sub={err} /> : <Empty icon="search-outline" title="Nothing found" sub="Try another search or category." />
        }
        ListFooterComponent={loading && items.length ? <Loading /> : undefined}
      />
    </View>
  );
}
