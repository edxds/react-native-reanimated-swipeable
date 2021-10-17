import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { List } from './List';

export default function App() {
  return (
    <SafeAreaProvider>
      <List />
    </SafeAreaProvider>
  );
}
