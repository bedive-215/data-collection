import { AppError } from "#middlewares/handleException.middlware.js";

import models from "#models/index.js";

const { Question, QuestionOption, Answer } = models;

export function mapAnswerToResponse(answers, optionMap = {}) {
    return answers.map(a => {
        const type = a.question?.type || a.type;
        let answer = null;

        if (["TEXT", "PARAGRAPH", "EMAIL", "TIME", "FILE_UPLOAD"].includes(type)) {
            answer = a.answer_text;
        } else if (["NUMBER", "RATING", "LINEAR_SCALE"].includes(type)) {
            answer = a.answer_number;
        } else if (["SINGLE_CHOICE", "DROPDOWN"].includes(type)) {
            answer = a.option_id ? (optionMap[a.option_id] || a.option?.label || a.option_id) : null;
        } else if (type === "MULTIPLE_CHOICE") {
            const ids = typeof a.selected_options === "string"
                ? JSON.parse(a.selected_options)
                : (a.selected_options || []);
            answer = ids.map(id => optionMap[id] || id).filter(Boolean);
        } else if (type === "DATE") {
            answer = a.answer_date ? new Date(a.answer_date).toISOString().split("T")[0] : null;
        }

        return { question_id: a.question?.id || a.question_id, question: a.question?.content, type, answer };
    });
}

export async function buildAnswerRecords(response_id, answers, questionMap, optionMap) {
    const records = [];

    for (const ans of answers) {
        const q = questionMap[ans.question_id];
        if (!q) throw new AppError("Invalid question", 400);

        if (["TEXT", "PARAGRAPH", "EMAIL", "TIME", "FILE_UPLOAD"].includes(q.type)) {
            records.push({ response_id, question_id: q.id, answer_text: ans.answer_text });

        } else if (["NUMBER", "RATING", "LINEAR_SCALE"].includes(q.type)) {
            const value = ans.answer_number ?? ans.answer_text;
            if (value == null || isNaN(value)) throw new AppError("Invalid number answer", 400);
            records.push({ response_id, question_id: q.id, answer_number: Number(value) });

        } else if (["SINGLE_CHOICE", "DROPDOWN"].includes(q.type)) {
            const option = optionMap[ans.option_id];
            if (!option || option.question_id !== q.id) throw new AppError("Invalid option", 400);
            records.push({ response_id, question_id: q.id, option_id: option.id });

        } else if (q.type === "MULTIPLE_CHOICE") {
            if (!Array.isArray(ans.option_ids) || !ans.option_ids.length) throw new AppError("Options required", 400);
            ans.option_ids.forEach(id => {
                const option = optionMap[id];
                if (!option || option.question_id !== q.id) throw new AppError("Invalid option", 400);
            });
            records.push({ response_id, question_id: q.id, selected_options: ans.option_ids });

        } else if (q.type === "DATE") {
            const dateValue = new Date(ans.answer_text);
            if (isNaN(dateValue.getTime())) throw new AppError("Invalid date answer", 400);
            records.push({ response_id, question_id: q.id, answer_date: dateValue });

        } else {
            throw new AppError(`Unsupported question type: ${q.type}`, 400);
        }
    }

    return records;
}

export async function buildMaps(answers, survey_id, transaction = null) {
    const questionIds = answers.map(a => a.question_id);
    const questions = await Question.findAll({
        where: { id: questionIds, survey_id },
        ...(transaction && { transaction }),
    });
    if (questions.length !== new Set(questionIds).size) throw new AppError("Invalid questions", 400);

    const optionIds = answers.flatMap(a => a.option_id ? [a.option_id] : a.option_ids || []);
    const options = await QuestionOption.findAll({
        where: { id: optionIds },
        ...(transaction && { transaction }),
    });

    return {
        questionMap: Object.fromEntries(questions.map(q => [q.id, q])),
        optionMap: Object.fromEntries(options.map(o => [o.id, o])),
    };
}

export async function getAnswersWithMap(response_id) {
    const answers = await Answer.findAll({
        where: { response_id },
        include: [
            { model: Question, as: "question", attributes: ["id", "content", "type"] },
            { model: QuestionOption, as: "option", attributes: ["id", "label"] },
        ],
    });

    const optionIds = answers.flatMap(a => a.option_id ? [a.option_id] : a.selected_options || []);
    const options = await QuestionOption.findAll({ where: { id: optionIds } });
    const optionMap = Object.fromEntries(options.map(o => [o.id, o.label]));

    return { answers, optionMap };
}