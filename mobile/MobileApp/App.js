import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider }     from "./src/providers/AuthProvider";
import ResponseProvider     from "./src/providers/Responseprovider";
import SurveyProvider       from "./src/providers/Surveyprovider";
import QuestionProvider     from "./src/providers/Questionprovider";
import UserProvider  from "./src/providers/UserProvider"; 
export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
      <ResponseProvider>
        <SurveyProvider>
          <QuestionProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <Toast />
          </QuestionProvider>
        </SurveyProvider>
      </ResponseProvider>
      </UserProvider>
    </AuthProvider>
  );
}