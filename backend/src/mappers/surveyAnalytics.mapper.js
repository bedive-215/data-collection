export function mapSurveyAnswer(a) {
    let value = null;

    switch (a.question?.type) {
        case "SINGLE_CHOICE":
        case "DROPDOWN":
            value = a.option?.label || null;
            break;
        case "MULTIPLE_CHOICE":
            if (a.selected_options && a.question?.options) {
                try {
                    const ids = typeof a.selected_options === "string"
                        ? JSON.parse(a.selected_options)
                        : a.selected_options;

                    value = a.question.options
                        .filter((opt) => ids.includes(opt.id))
                        .map((opt) => opt.label);
                } catch {
                    value = null;
                }
            }
            break;
        case "TEXT":
        case "PARAGRAPH":
        case "EMAIL":
            value = a.answer_text || null;
            break;
        case "NUMBER":
        case "RATING":
            value = a.answer_number != null ? String(a.answer_number) : null;
            break;
        case "DATE":
            value = a.answer_date || null;
            break;
        default:
            value = null;
    }

    return {
        question_id: a.question?.id,
        question_content: a.question?.content,
        type: a.question?.type,
        value,
    };
}

export function mapSurveyResponse(res) {
    return {
        response_id: res.id,
        status: res.status,
        created_at: res.created_at,
        submitted_at: res.submitted_at,
        time_to_complete_seconds: res.created_at && res.submitted_at
            ? Math.round((new Date(res.submitted_at) - new Date(res.created_at)) / 1000)
            : null,
        answers: (res.answers || []).map(mapSurveyAnswer),
    };
}

export function buildPaginatedSurveyResponses(survey_id, responses, page, limit, total = responses.length) {
    return {
        survey_id,
        pagination: {
            page,
            limit,
            total_responses: total,
            total_pages: Math.ceil(total / limit) || 1,
        },
        responses,
    };
}

export function surveyResponseMatchesSearch(response, query) {
    const normalizedQuery = query.toLowerCase();
    return response.answers.some((a) =>
        (a.question_content || "").toLowerCase().includes(normalizedQuery) ||
        String(a.value || "").toLowerCase().includes(normalizedQuery)
    );
}
