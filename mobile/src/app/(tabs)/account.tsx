import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { openWeb, timeAgo } from '../../components/Cards';
import { Card, T } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { api, getCreditLog } from '../../lib/api';
import { C } from '../../lib/theme';

type Row = { type?: string; prompt?: string; description?: string; product_name?: string; credits?: number; label?: string; date?: string; timestamp?: number };

export default function Account() {
  const { me, refresh, signOut } = useAuth();
  const [log, setLog] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    await Promise.all([refresh(), getCreditLog().then((r) => setLog((r?.log || []).slice(0, 15))).catch(() => null)]);
    setBusy(false);
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const u = me?.user;
  const dl = me?.downloads;

  function askDelete() {
    Alert.alert(
      'Delete your account?',
      'Your account and everything you created will be deleted after 24 hours. You can cancel by logging in again before then.',
      [
        { text: 'Keep my account', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const r = await api<{ at_text?: string }>('ds/v1/account-delete', { body: { confirm: true } });
              Alert.alert('Deletion scheduled', `Your account will be deleted ${r.at_text || 'in 24 hours'}.`, [{ text: 'OK', onPress: () => signOut() }]);
            } catch (e: any) {
              Alert.alert('Could not delete', e.message);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="Account" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
        <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
          {u?.avatar ? (
            <Image source={{ uri: u.avatar }} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.chip }} />
          ) : (
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.chip }} />
          )}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <T w="bold" size={17} numberOfLines={1}>
              {u?.name || ' '}
            </T>
            <T size={13} color={C.sub} numberOfLines={1}>
              {u?.email || ' '}
            </T>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Card style={{ flex: 1, padding: 14 }}>
            <T size={12} color={C.sub}>
              Credits
            </T>
            <T w="bold" size={22}>
              {me?.credits ?? '–'}
            </T>
          </Card>
          <Card style={{ flex: 1, padding: 14 }}>
            <T size={12} color={C.sub}>
              Plan
            </T>
            <T w="bold" size={18} numberOfLines={1}>
              {me?.plan_label || '–'}
            </T>
            {me?.plan_end ? (
              <T size={11.5} color={C.sub}>
                until {formatEnd(me.plan_end)}
              </T>
            ) : null}
          </Card>
        </View>

        {dl && (dl.limit_free || dl.limit_pro) ? (
          <Card style={{ padding: 14, marginTop: 12 }}>
            <T w="medium" size={13.5}>
              Marketplace downloads today
            </T>
            <T size={12.5} color={C.sub} style={{ marginTop: 4 }}>
              Free {dl.used_free ?? 0}/{dl.limit_free ?? 0} · Pro {dl.used_pro ?? 0}/{dl.limit_pro ?? 0}
            </T>
          </Card>
        ) : null}

        <T w="bold" size={16} style={{ marginTop: 22, marginBottom: 10 }}>
          Credit history
        </T>
        <Card style={{ paddingVertical: 4 }}>
          {log.length ? (
            log.map((r, i) => {
              const plus = r.type === 'cashback' || r.type === 'purchase' || r.type === 'bonus' || r.label === 'credit';
              return (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
                  <View style={{ flex: 1 }}>
                    <T size={13.5} numberOfLines={1}>
                      {r.prompt || r.description || r.product_name || r.type || 'Credits'}
                    </T>
                    <T size={11.5} color={C.sub}>
                      {[r.type, r.timestamp ? timeAgo(r.timestamp) : r.date].filter(Boolean).join(' · ')}
                    </T>
                  </View>
                  <T w="medium" size={14} color={plus ? C.green : C.text}>
                    {plus ? '+' : '−'}
                    {Math.abs(Number(r.credits) || 0)}
                  </T>
                </View>
              );
            })
          ) : (
            <T size={13} color={C.sub} style={{ padding: 14 }}>
              No credit activity yet.
            </T>
          )}
        </Card>

        <Card style={{ marginTop: 22, paddingVertical: 4 }}>
          <Item icon="person-outline" label="Profile and settings" onPress={() => openWeb('/my-account/', 'My Account')} />
          <Item icon="document-text-outline" label="Terms" onPress={() => openWeb('/terms/', 'Terms')} />
          <Item icon="shield-checkmark-outline" label="Privacy policy" onPress={() => openWeb('/privacy-policy/', 'Privacy policy')} />
          <Item icon="log-out-outline" label="Log out" onPress={() => signOut()} />
          <Item icon="trash-outline" label="Delete my account" danger onPress={askDelete} last />
        </Card>
      </ScrollView>
    </View>
  );
}

function Item({ icon, label, onPress, danger, last }: { icon: any; label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.line, opacity: pressed ? 0.6 : 1 })}>
      <Ionicons name={icon} size={20} color={danger ? '#dc2626' : C.text} />
      <T size={14.5} color={danger ? '#dc2626' : C.text} style={{ flex: 1, marginLeft: 12 }}>
        {label}
      </T>
      <Ionicons name="chevron-forward" size={18} color={C.sub} />
    </Pressable>
  );
}

function formatEnd(v: string | number) {
  const n = typeof v === 'number' ? v : Number(v);
  const d = n ? new Date(n < 1e12 ? n * 1000 : n) : new Date(String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
}
