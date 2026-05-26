export function mapSection(section) {
    return {
        id: section.id,
        survey_id: section.survey_id,
        title: section.title,
        description: section.description,
        order_index: section.order_index,
        icon: section.icon,
        cover_url: section.cover_url,
        min_required: section.min_required,
        show_progress: section.show_progress ?? true,
        question_count: section.questions ? section.questions.length : 0,
    };
}