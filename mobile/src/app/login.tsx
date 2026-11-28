import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../components/ui';
import { useAuth } from '../lib/auth';
import { getLoginOptions } from '../lib/api';
import { Provider } from '../lib/webLogin';
import { C, R } from '../lib/theme';

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </Svg>
  );
}
function MicrosoftIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 23 23">
      <Path fill="#f35325" d="M1 1h10v10H1z" />
      <Path fill="#81bc06" d="M12 1h10v10H12z" />
      <Path fill="#05a6f0" d="M1 12h10v10H1z" />
      <Path fill="#ffba08" d="M12 12h10v10H12z" />
    </Svg>
  );
}

export default function Login() {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [err, setErr] = useState('');
  const [opts, setOpts] = useState<{ google: boolean; microsoft: boolean } | null>(null);
  const [siteReady, setSiteReady] = useState(true);

  useEffect(() => {
    getLoginOptions()
      .then((o) => setOpts({ google: o.google, microsoft: o.microsoft }))
      .catch((e) => {
        if (e?.status === 404) setSiteReady(false); // App API plugin not installed on the website yet
        setOpts({ google: true, microsoft: true });
      });
  }, []);

  async function go(p: Provider) {
    setErr('');
    setBusy(p);
    try {
      await signIn(p);
    } catch (e: any) {
      if (e?.message) setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  const Btn = ({ p, label, icon, dark }: { p: Provider; label: string; icon: React.ReactNode; dark?: boolean }) => (
    <Pressable
      onPress={() => go(p)}
      disabled={!!busy}
      style={({ pressed }) => [s.btn, dark && { backgroundColor: C.orange, borderColor: C.orange }, { opacity: busy && busy !== p ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      {busy === p ? <ActivityIndicator color={dark ? '#fff' : C.text} /> : icon}
      <T w="medium" size={15.5} color={dark ? '#fff' : C.text} style={{ marginLeft: 12 }}>
        {label}
      </T>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.navy }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 84, height: 84, borderRadius: 20 }} />
            <T w="bold" size={28} color="#fff" style={{ marginTop: 16 }}>
              DesignStager
            </T>
            <T size={14} color="rgba(255,255,255,.7)" style={{ marginTop: 4, textAlign: 'center' }}>
              AI presentations, documents, images and more
            </T>
          </View>

          <View style={s.box}>
            <T w="bold" size={20}>
              Welcome
            </T>
            <T size={13} color={C.sub} style={{ marginTop: 2, marginBottom: 18 }}>
              Log in or create your free account
            </T>

            {!opts ? (
              <ActivityIndicator color={C.orange} style={{ marginVertical: 30 }} />
            ) : (
              <>
                {opts.google ? <Btn p="google" label="Continue with Google" icon={<GoogleIcon />} /> : null}
                {opts.microsoft ? <Btn p="microsoft" label="Continue with Microsoft" icon={<MicrosoftIcon />} /> : null}
                <Btn p="email" label="Continue with email" icon={<Ionicons name="mail-outline" size={20} color="#fff" />} dark />
              </>
            )}

            {err ? (
              <T size={13} color="#dc2626" style={{ marginTop: 6 }}>
                {err}
              </T>
            ) : null}
            {!siteReady ? (
              <T size={12.5} color="#b45309" style={{ marginTop: 10 }}>
                Sign-in isn't switched on yet on designstager.com (the DesignStager App API plugin is missing).
              </T>
            ) : null}

            <T size={12} color={C.sub} style={{ marginTop: 14, textAlign: 'center' }}>
              You'll sign in on designstager.com in a secure window, then come straight back here.
            </T>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: '#fff', borderRadius: R.lg, padding: 20 },
  btn: {
    height: 52,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
