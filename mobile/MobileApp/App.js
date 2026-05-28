import React, { createRef } from "react";
import { NavigationContainer } from "@react-navigation/native";

import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider }     from "./src/providers/AuthProvider";
import ResponseProvider     from "./src/providers/ResponseProvider";
import SurveyProvider       from "./src/providers/SurveyProvider";
import QuestionProvider    from "./src/providers/Questionprovider";
import OptionProvider      from "./src/providers/OptionProvider";
import UserProvider        from "./src/providers/UserProvider";
import NotificationProvider from "./src/providers/NotificationProvider";
import GamificationProvider from "./src/providers/GamificationProvider";
import { ToastProvider }   from "./src/components/common/Toast";
import { SubmittedProvider } from "./src/contexts/SubmittedContext";
import AiChatbox           from "./src/components/common/AiChatbox";

// Navigation ref for accessing navigation from outside components
export const navigationRef = createRef();

export default function App() {
  return (
    <AuthProvider navigationRef={navigationRef}>
      <UserProvider>
        <OptionProvider>
          <GamificationProvider>
            <ResponseProvider>
              <SurveyProvider>
                <QuestionProvider>
                  <NotificationProvider>
                    <ToastProvider>
                      <SubmittedProvider>
                        <NavigationContainer ref={navigationRef}>
                          <RootNavigator />
                          <AiChatbox navigation={navigationRef} />
                        </NavigationContainer>
                      </SubmittedProvider>
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
