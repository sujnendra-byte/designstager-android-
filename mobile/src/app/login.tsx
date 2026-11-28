import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, T } from '../components/ui';
import { useAuth } from '../lib/auth';
import { SITE } from '../lib/api';
import { C, F, R } from '../lib/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function go() {
    setErr('');
    setBusy(true);
    try {
      await signIn(user.trim(), pass);
    } catch (e: any) {
      setErr(e?.message || 'Could not log in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.navy }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <Image source={require('../../assets/icon.png')} style={{ width: 84, height: 84, borderRadius: 20 }} />
              <T w="bold" size={26} color="#fff" style={{ marginTop: 16 }}>
                DesignStager
              </T>
              <T size={14} color="rgba(255,255,255,.7)" style={{ marginTop: 4, textAlign: 'center' }}>
                AI presentations, documents, images and more
              </T>
            </View>

            <View style={s.box}>
              <T w="bold" size={20}>
                Log in
              </T>
              <T size={13} color={C.sub} style={{ marginTop: 2, marginBottom: 16 }}>
                Use your designstager.com account
              </T>

              <T w="medium" size={12.5} color={C.sub}>
                Email or username
              </T>
              <TextInput
                value={user}
                onChangeText={setUser}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                autoComplete="email"
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor="#a0a5bd"
              />

              <T w="medium" size={12.5} color={C.sub} style={{ marginTop: 12 }}>
                Password
              </T>
              <View>
                <TextInput
                  value={pass}
                  onChangeText={setPass}
                  secureTextEntry={!show}
                  textContentType="password"
                  autoComplete="password"
                  style={[s.input, { paddingRight: 48 }]}
                  placeholder="Your password"
                  placeholderTextColor="#a0a5bd"
                  onSubmitEditing={go}
                  returnKeyType="go"
                />
                <Pressable onPress={() => setShow(!show)} style={s.eye} hitSlop={10}>
                  <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.sub} />
                </Pressable>
              </View>

              {err ? (
                <T size={13} color="#dc2626" style={{ marginTop: 12 }}>
                  {err}
                </T>
              ) : null}

              <Button title="Log in" onPress={go} loading={busy} disabled={!user || !pass} style={{ marginTop: 18 }} />

              <Pressable onPress={() => Linking.openURL(`${SITE}/wp-login.php?action=lostpassword`)} style={{ marginTop: 14, alignSelf: 'center' }}>
                <T w="medium" size={13} color={C.orange}>
                  Forgot password?
                </T>
              </Pressable>
            </View>

            <Pressable onPress={() => Linking.openURL(`${SITE}/register/`)} style={{ marginTop: 22, alignSelf: 'center' }}>
              <T size={14} color="rgba(255,255,255,.8)">
                New here? <T w="medium" size={14} color="#fff">Create a free account</T>
              </T>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: '#fff', borderRadius: R.lg, padding: 20 },
  input: {
    height: 50,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: '#fafbfd',
    paddingHorizontal: 14,
    marginTop: 6,
    fontFamily: F.regular,
    fontSize: 15,
    color: C.text,
  },
  eye: { position: 'absolute', right: 14, top: 21 },
});
