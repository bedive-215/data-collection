/**
 * Mobile Survey App
 * @format
 */

import React, { ReactNode } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Providers
import { AuthProvider, NotificationProvider, UserProvider } from './src/providers';
import { SurveyProvider, ResponseProvider, QuestionProvider, OptionProvider } from './src/providers';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders = ({ children }: AppProvidersProps) => (
  <AuthProvider>
    <NotificationProvider>
      <UserProvider>
        <SurveyProvider>
          <ResponseProvider>
            <QuestionProvider>
              <OptionProvider>
                {children}
              </OptionProvider>
            </QuestionProvider>
          </ResponseProvider>
        </SurveyProvider>
      </UserProvider>
    </NotificationProvider>
  </AuthProvider>
);

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#1a1a2e' : '#ffffff'}
        />
        <AppProviders>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
