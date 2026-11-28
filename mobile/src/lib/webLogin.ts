// Log in through the website (Google, Microsoft or email/password) in the phone's secure browser.
// The website sends back a one-time code; only this app knows the secret ("verifier") needed to use it.
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { SITE } from './api';

export type Provider = 'google' | 'microsoft' | 'email';
const RETURN = 'designstager://auth';

function b64url(b64: string) {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomVerifier() {
  const bytes = Crypto.getRandomBytes(32);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s; // 64 hex characters
}

/** Opens the website login. Returns { code, verifier } on success, or throws a friendly message. */
export async function websiteLogin(provider: Provider) {
  const verifier = randomVerifier();
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  const challenge = b64url(digest);
  const url = `${SITE}/?ds_app_auth=start&provider=${provider}&challenge=${challenge}`;
  const res = await WebBrowser.openAuthSessionAsync(url, RETURN);
  if (res.type !== 'success') throw new Error('');
  const q = new URL(res.url).searchParams;
  const err = q.get('error');
  if (err) throw new Error(ERRORS[err] || ERRORS.failed);
  const code = q.get('code');
  if (!code) throw new Error(ERRORS.failed);
  return { code, verifier };
}

const ERRORS: Record<string, string> = {
  cancelled: 'Sign-in was cancelled.',
  expired: 'That sign-in took too long. Please try again.',
  failed: 'We could not sign you in. Please try again.',
  noemail: 'That account did not share a verified email address.',
  link: 'An account with this email already exists. Log in with your email and password once, then Microsoft sign-in will work next time.',
  off: 'This sign-in option is not available yet.',
};
