// src/contexts/SubmittedContext.jsx
// Lightweight context to pass submitted state from SurveyTake back to PublicSurveyDetail
import React, { createContext, useContext, useState, useCallback } from "react";

const SubmittedContext = createContext(null);

export function SubmittedProvider({ children }) {
  const [submittedSurveyId, setSubmittedSurveyId] = useState(null);

  const markSubmitted = useCallback((surveyId) => {
    setSubmittedSurveyId(surveyId);
  }, []);

  const clearSubmitted = useCallback(() => {
    setSubmittedSurveyId(null);
  }, []);

  return (
    <SubmittedContext.Provider value={{ submittedSurveyId, markSubmitted, clearSubmitted }}>
      {children}
    </SubmittedContext.Provider>
  );
}

export function useSubmitted() {
  const ctx = useContext(SubmittedContext);
  if (!ctx) throw new Error("useSubmitted must be used within SubmittedProvider");
  return ctx;
}
