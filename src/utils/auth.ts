import { User } from '../types';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

class AuthManager {
  private user: User | null = null;
  private accessToken: string | null = null;

  async init(): Promise<void> {
    return new Promise((resolve) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2:client', resolve);
      };
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<User> {
    await this.init();
    
    await window.gapi.client.init({
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
    });

    const authInstance = window.gapi.auth2.getAuthInstance();
    const googleUser = await authInstance.signIn();
    const profile = googleUser.getBasicProfile();
    
    this.accessToken = googleUser.getAuthResponse().access_token;
    this.user = {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      picture: profile.getImageUrl()
    };

    localStorage.setItem('user', JSON.stringify(this.user));
    localStorage.setItem('accessToken', this.accessToken);

    return this.user;
  }

  async signOut(): Promise<void> {
    if (window.gapi?.auth2) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    }
    
    this.user = null;
    this.accessToken = null;
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  }

  getCurrentUser(): User | null {
    if (!this.user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
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
    return !!this.getCurrentUser() && !!this.getAccessToken();
  }
}

export const authManager = new AuthManager();