import { useState, useEffect, useCallback } from 'react';
import { GoogleUser } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
].join(' ');

// The actual registered OAuth Client ID from Google Cloud project / Firebase configuration
const CLIENT_ID = firebaseConfig?.oAuthClientId || '140368548706-6at0m3t1sghhvubm14omqd6e67pttkgj.apps.googleusercontent.com';

export function useGoogleAuth() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('google_access_token');
  });
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem('google_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize Google Identity Services token client
  useEffect(() => {
    const checkGsi = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: async (tokenResponse: any) => {
              setIsLoading(false);
              if (tokenResponse.error) {
                console.error('Google OAuth token error:', tokenResponse);
                if (tokenResponse.error === 'popup_closed_by_user') {
                  setAuthError('The authorization window was closed before signing in. Please try again.');
                } else if (tokenResponse.error === 'access_denied') {
                  setAuthError('Access was denied. Please accept permissions to sync with Google Sheets.');
                } else {
                  setAuthError(tokenResponse.error_description || tokenResponse.error);
                }
                return;
              }

              const accessToken = tokenResponse.access_token;
              setToken(accessToken);
              localStorage.setItem('google_access_token', accessToken);
              setAuthError(null);

              // Fetch user profile info
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (userRes.ok) {
                  const userData = await userRes.json();
                  const profile: GoogleUser = {
                    email: userData.email,
                    name: userData.name || userData.email.split('@')[0],
                    picture: userData.picture
                  };
                  setUser(profile);
                  localStorage.setItem('google_user', JSON.stringify(profile));
                }
              } catch (e) {
                console.warn('Failed to fetch user profile, fallback to basic user', e);
                const fallbackUser: GoogleUser = {
                  email: 'bhadani.rahul20@gmail.com',
                  name: 'Rahul Bhadani'
                };
                setUser(fallbackUser);
                localStorage.setItem('google_user', JSON.stringify(fallbackUser));
              }
            },
            error_callback: (err: any) => {
              setIsLoading(false);
              console.error('GSI client error:', err);
              const errMsg = typeof err === 'string' ? err : err?.message || err?.type || '';
              if (errMsg.includes('Popup window closed') || errMsg.includes('popup_closed') || err?.type === 'popup_closed') {
                setAuthError('The sign-in popup window was closed before authorization was completed. Please click "Authorize Google Sheets" and grant access in the popup window.');
              } else if (errMsg.includes('popup_blocked') || err?.type === 'popup_blocked_by_browser') {
                setAuthError('The sign-in popup was blocked by your browser. Please allow popups or open the app in a new tab.');
              } else {
                setAuthError(errMsg || 'OAuth authorization failed');
              }
            }
          });
          setTokenClient(client);
        } catch (e: any) {
          console.error('Failed to init token client:', e);
        }
      } else {
        setTimeout(checkGsi, 200);
      }
    };

    checkGsi();
  }, []);

  const login = useCallback(() => {
    setAuthError(null);
    if (tokenClient) {
      setIsLoading(true);
      // Request access token with consent prompt
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      setAuthError('Google Sign-In is initializing. Please wait a moment and try again, or ensure popups are enabled.');
    }
  }, [tokenClient]);

  const setManualToken = useCallback((customToken: string, customEmail?: string) => {
    setToken(customToken);
    localStorage.setItem('google_access_token', customToken);
    const u: GoogleUser = {
      email: customEmail || 'bhadani.rahul20@gmail.com',
      name: customEmail ? customEmail.split('@')[0] : 'Rahul Bhadani'
    };
    setUser(u);
    localStorage.setItem('google_user', JSON.stringify(u));
    setAuthError(null);
  }, []);

  const logout = useCallback(() => {
    if (token && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(token, () => {
          console.log('Access token revoked');
        });
      } catch (e) {
        // ignore
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_user');
  }, [token]);

  return {
    token,
    user,
    isLoading,
    authError,
    login,
    logout,
    setManualToken,
    isAuthenticated: !!token
  };
}
