export function baseQuestionResult(question) {
    return {
        question_id: question.id,
        question_content: question.content,
        type: question.type,
    };
}

export function emptyQuestionResult(question_id, type) {
    return { question_id, type, total_responses: 0 };
}

export function mapOptionsWithCounts(options, countMap, total) {
    return options.map((opt) => {
        const count = countMap[opt.id] || 0;
        return {
            option_id: opt.id,
            label: opt.label,
            value: opt.value,
            count,
            percent: total ? parseFloat(((count / total) * 100).toFixed(2)) : 0,
        };
    });
}
