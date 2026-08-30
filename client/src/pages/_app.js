import { useEffect } from 'react';
import '../styles/globals.css';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

function MyApp({ Component, pageProps }) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
    initAuth();
  }, [initTheme, initAuth]);

  return <Component {...pageProps} />;
}

export default MyApp;
