import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider }     from "./src/providers/AuthProvider";
import ResponseProvider     from "./src/providers/ResponseProvider";
import SurveyProvider       from "./src/providers/SurveyProvider";
import QuestionProvider    from "./src/providers/QuestionProvider";
import OptionProvider      from "./src/providers/OptionProvider";
import UserProvider        from "./src/providers/UserProvider";
import NotificationProvider from "./src/providers/NotificationProvider";
import GamificationProvider from "./src/providers/GamificationProvider";
import { ToastProvider }   from "./src/components/common/Toast";

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <OptionProvider>
          <GamificationProvider>
            <ResponseProvider>
              <SurveyProvider>
                <QuestionProvider>
                  <NotificationProvider>
                    <ToastProvider>
                      <NavigationContainer>
                        <RootNavigator />
                      </NavigationContainer>
                    </ToastProvider>
                  </NotificationProvider>
                </QuestionProvider>
              </SurveyProvider>
            </ResponseProvider>
          </GamificationProvider>
        </OptionProvider>
      </UserProvider>
    </AuthProvider>
  );
}
