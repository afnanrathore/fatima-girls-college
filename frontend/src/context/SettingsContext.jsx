import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    college: {
      name: 'Fatima Girls College',
      location: 'Aminpur Bangla',
      tagline: 'Empowering Women Through Education',
      address: '',
      phone: '',
      phone_display: '',
      email: '',
      office_hours: '',
      map_query: '',
      religions: [],
      nationalities: [],
      boards: [],
    },
    admissionsOpen: true,
    districts: {},
    tehsils: {},
    loading: true,
  });

  const refresh = async () => {
    const { data } = await api.get('/settings');
    setSettings({ ...data, loading: false });
  };

  useEffect(() => {
    refresh().catch(() => setSettings((s) => ({ ...s, loading: false })));
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
