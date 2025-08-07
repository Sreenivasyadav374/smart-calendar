import { User } from '../types';

declare global {
  interface Window {
    google: any;
  }
}

class AuthManager {
  private user: User | null = null;
  private accessToken: string | null = null;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;

 init(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (this.tokenClient) {
      resolve();
      return;
    }

    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
      } else {
        reject(new Error('Google Identity Services failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services script'));
    };

    document.head.appendChild(script);
  });
}


  signIn(): Promise<User> {
  return new Promise(async (resolve, reject) => {
    try {
      await this.init();

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(tokenResponse);
            return;
          }

          this.accessToken = tokenResponse.access_token;
          localStorage.setItem('accessToken', this.accessToken || '');
          const user = await this.fetchUserInfo();
          resolve(user);
        }
      });
if (!this.tokenClient) {
  throw new Error("Token client is not initialized.");
}
this.tokenClient.requestAccessToken();
    } catch (err) {
      console.error("Sign in failed:", err);
      reject(err);
    }
  });
}


  async fetchUserInfo(): Promise<User> {
    if (!this.accessToken) throw new Error('No access token available');

    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch user info');

    const profile = await res.json();
    this.user = {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture
    };

    localStorage.setItem('user', JSON.stringify(this.user));
    return this.user;
  }

  signOut(): void {
    this.user = null;
    this.accessToken = null;
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  }

  getCurrentUser(): User | null {
    if (!this.user) {
      const stored = localStorage.getItem('user');
      if (stored) this.user = JSON.parse(stored);
    }
    return this.user;
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authManager = new AuthManager();
