import { getSurveyStatus } from "../domain/survey.domain.js";
import { formatDate } from "../helpers/aiChat.helper.js";

export function mapSurveyList(surveys) {
  return surveys.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    status: getSurveyStatus(s),
    created_at: formatDate(s.created_at),
    question_count: s.questions?.length || 0,
    response_count: s.responses?.length || 0,
    participant_count: s.participants?.length || 0,
  }));
}