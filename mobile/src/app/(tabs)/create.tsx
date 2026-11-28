import React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { openWeb, ToolCard } from '../../components/Cards';
import { Card, T } from '../../components/ui';
import { TOOLS } from '../../lib/tools';
import { C } from '../../lib/theme';

const PPT_MODES = [
  { mode: 'deck', title: 'Full deck', sub: 'AI writes and designs every slide', icon: 'albums-outline' as const },
  { mode: 'slide', title: 'Individual slides', sub: '1,000+ infographic layouts', icon: 'grid-outline' as const },
  { mode: 'chart', title: 'AI charts', sub: 'Charts from your numbers', icon: 'pie-chart-outline' as const },
  { mode: 'anim', title: 'Slide animation', sub: 'Animate a finished PPT', icon: 'play-circle-outline' as const },
];

export default function Create() {
  const { width } = useWindowDimensions();
  const pad = 18;
  const half = (width - pad * 2 - 12) / 2;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="Create" />
      <ScrollView contentContainerStyle={{ padding: pad, paddingBottom: 30 }}>
        <T size={13.5} color={C.sub} style={{ marginBottom: 14 }}>
          Choose a tool to start creating with AI.
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {TOOLS.map((t) => (
            <ToolCard key={t.id} tool={t} width={half} />
          ))}
        </View>

        <T w="bold" size={16.5} style={{ marginTop: 10, marginBottom: 12 }}>
          More in AI Presentation
        </T>
        {PPT_MODES.map((m) => (
          <Card
            key={m.mode}
            style={{ padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => openWeb(`/ai-presentation/#ds-mode=${m.mode}`, m.title)}
          >
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#fde7df', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={m.icon} size={21} color={C.orange} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <T w="medium" size={14.5}>
                {m.title}
              </T>
              <T size={12} color={C.sub}>
                {m.sub}
              </T>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.sub} />
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
