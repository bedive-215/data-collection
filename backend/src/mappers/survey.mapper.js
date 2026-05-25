export const mapSurveyDetail = (survey, status) => {
    const base = {
        ...mapSurvey(survey),
        status,
        sections: (survey.sections || []).map(sec => ({
            id: sec.id,
            title: sec.title,
            description: sec.description,
            order_index: sec.order_index,
            icon: sec.icon,
            cover_url: sec.cover_url,
            min_required: sec.min_required,
            show_progress: sec.show_progress,
            questions: (sec.questions || []).map(q => mapQuestion(q)).sort((a, b) => a.order_index - b.order_index),
        })),
        questions: (survey.questions || []).map(q => mapQuestion(q)).sort((a, b) => a.order_index - b.order_index),
    };
    return base;
}

export const mapQuestion = (q) => {
    return {
        id: q.id,
        survey_id: q.survey_id,
        section_id: q.section_id,
        content: q.content,
        description: q.description ?? null,
        placeholder: q.placeholder ?? null,
        type: q.type,
        required: q.required,
        order_index: q.order_index,
        settings: q.settings ?? {},
        media_url: q.media_url ?? null,
        media_type: q.media_type ?? null,
        condition: q.condition ?? null,
        hidden_from_analytics: q.hidden_from_analytics ?? false,
        next_question_id: q.next_question_id ?? null,
        next_section_id: q.next_section_id ?? null,
        options: q.options
            ? q.options.map(o => ({
                id: o.id,
                label: o.label,
                value: o.value,
                order_index: o.order_index,
                is_other: o.is_other ?? false,
                image_url: o.image_url ?? null,
                media_type: o.media_type ?? null,
            })).sort((a, b) => a.order_index - b.order_index)
            : [],
    };
}

export const mapSurvey = (survey) => {
    return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        start_at: survey.start_at,
        end_at: survey.end_at,
        created_at: survey.created_at,
        is_anonymous: survey.is_anonymous ?? false,
        max_responses: survey.max_responses ?? null,
        randomize_questions: survey.randomize_questions ?? false,
        randomize_options: survey.randomize_options ?? false,
        time_limit_seconds: survey.time_limit_seconds ?? null,
        show_progress_bar: survey.show_progress_bar ?? true,
        allow_back: survey.allow_back ?? true,
        one_question_per_page: survey.one_question_per_page ?? true,
        thank_you_message: survey.thank_you_message ?? null,
        logo_url: survey.logo_url ?? null,
        background_url: survey.background_url ?? null,
        accent_color: survey.accent_color ?? "#6366f1",
        show_correct_answers: survey.show_correct_answers ?? false,
        thank_you_redirect_url: survey.thank_you_redirect_url ?? null,
    };
}