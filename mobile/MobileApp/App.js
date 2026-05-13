import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider }     from "./src/providers/AuthProvider";
import ResponseProvider     from "./src/providers/Responseprovider";
import SurveyProvider       from "./src/providers/Surveyprovider";
import QuestionProvider     from "./src/providers/Questionprovider";
import OptionProvider from "./src/providers/OptionProvider";
import UserProvider  from "./src/providers/UserProvider";
import NotificationProvider from "./src/providers/NotificationProvider";
export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <OptionProvider>
          <ResponseProvider>
            <SurveyProvider>
              <QuestionProvider>
                <NotificationProvider>
                  <NavigationContainer>
                    <RootNavigator />
                  </NavigationContainer>
                  <Toast />
                </NotificationProvider>
              </QuestionProvider>
            </SurveyProvider>
          </ResponseProvider>
        </OptionProvider>
      </UserProvider>
    </AuthProvider>
  );
}