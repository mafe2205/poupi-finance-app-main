import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useFinance } from '@/context/finance-context';

export default function TabLayout() {
  const { ready, isAuthenticated } = useFinance();

  if (!ready) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <AppTabs />;
}
