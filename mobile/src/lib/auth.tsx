// Who is logged in. The token lives in the phone's secure storage.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { exchangeCode, getMe, loadToken, logout as apiLogout, Me, saveToken, setSignedOutHandler } from './api';
import { Provider, websiteLogin } from './webLogin';

type AuthState = {
  ready: boolean;
  signedIn: boolean;
  me: Me | null;
  refresh: () => Promise<void>;
  signIn: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await getMe());
    } catch {
      /* keep the last known values when offline */
    }
  }, []);

  useEffect(() => {
    setSignedOutHandler(() => {
      setSignedIn(false);
      setMe(null);
    });
    (async () => {
      const t = await loadToken();
      if (t) {
        setSignedIn(true);
        refresh();
      }
      setReady(true);
    })();
  }, [refresh]);

  const signIn = useCallback(
    async (provider: Provider) => {
      const { code, verifier } = await websiteLogin(provider);
      const r = await exchangeCode(code, verifier);
      await saveToken(r.token);
      setSignedIn(true);
      await refresh();
    },
    [refresh]
  );

  const signOut = useCallback(async () => {
    await apiLogout();
    await saveToken(null);
    setSignedIn(false);
    setMe(null);
  }, []);

  return <Ctx.Provider value={{ ready, signedIn, me, refresh, signIn, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
