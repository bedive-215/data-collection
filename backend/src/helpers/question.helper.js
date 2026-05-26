import { AppError } from "../middlewares/handleException.middlware.js";
import crypto from "crypto";

const VALID_TYPES = [
    "TEXT", "PARAGRAPH", "EMAIL", "DATE", "NUMBER", "RATING",
    "SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN",
    "LINEAR_SCALE", "TIME", "FILE_UPLOAD", "MATRIX",
];

const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];
const TEXT_TYPES = ["TEXT", "PARAGRAPH", "EMAIL", "TIME", "FILE_UPLOAD"];
const NUMBER_TYPES = ["NUMBER", "RATING", "LINEAR_SCALE"];

export function validateQuestionInput({ content, type }) {
    if (!content?.trim()) throw new AppError("Content is required", 400);
    if (!type) throw new AppError("Type is required", 400);
    if (!VALID_TYPES.includes(type)) throw new AppError("Invalid question type", 400);
}

export function validateOptions(type, options) {
    if (!CHOICE_TYPES.includes(type)) return [];

    if (!Array.isArray(options) || options.length < 2) {
        throw new AppError("At least 2 options are required", 400);
    }

    const cleaned = options
        .map(opt => ({
            label: opt.label?.trim(),
            value: opt.value?.trim(),
            order_index: opt.order_index ?? 0,
            is_other: opt.is_other || false,
            image_url: opt.image_url || null,
            media_type: opt.media_type || null,
        }))
        .filter(opt => opt.label && opt.value);

    if (cleaned.length < 2) throw new AppError("Options must be valid", 400);

    // Dedup by value
    return [...new Map(cleaned.map(opt => [opt.value, opt])).values()];
}

export function validateSettingsByType(type, settings) {
    switch (type) {
        case "TEXT":
        case "PARAGRAPH": {
            if (!settings) return null;
            const { min_chars, max_chars } = settings;
            if (min_chars !== undefined && (typeof min_chars !== "number" || min_chars < 0))
                throw new AppError("min_chars must be a non-negative number", 400);
            if (max_chars !== undefined && (typeof max_chars !== "number" || max_chars < 1))
                throw new AppError("max_chars must be a positive number", 400);
            if (min_chars !== undefined && max_chars !== undefined && min_chars > max_chars)
                throw new AppError("min_chars cannot be greater than max_chars", 400);
            return { min_chars: min_chars ?? null, max_chars: max_chars ?? null };
        }

        case "NUMBER": {
            if (!settings) return settings;
            const { min, max } = settings;
            if (min !== undefined && typeof min !== "number") throw new AppError("min must be number", 400);
            if (max !== undefined && typeof max !== "number") throw new AppError("max must be number", 400);
            if (min !== undefined && max !== undefined && min > max) throw new AppError("min <= max", 400);
            return settings;
        }

        case "RATING": {
            const min = settings?.min ?? 1;
            const max = settings?.max ?? 5;
            if (min >= max) throw new AppError("Invalid rating range", 400);
            return { min, max };
        }

        case "LINEAR_SCALE": {
            if (!settings) return { min: 1, max: 5, min_label: null, max_label: null };
            const { min, max, min_label, max_label } = settings;
            if (min === undefined || max === undefined) throw new AppError("LINEAR_SCALE requires min and max", 400);
            if (typeof min !== "number" || typeof max !== "number" || min >= max)
                throw new AppError("LINEAR_SCALE min must be less than max", 400);
            return { min, max, min_label: min_label ?? null, max_label: max_label ?? null };
        }

        case "FILE_UPLOAD": {
            if (!settings) return { max_size_mb: 5, allowed_types: ["image/*"] };
            const { max_size_mb, allowed_types } = settings;
            if (max_size_mb !== undefined && (typeof max_size_mb !== "number" || max_size_mb <= 0))
                throw new AppError("max_size_mb must be a positive number", 400);
            if (allowed_types !== undefined && !Array.isArray(allowed_types))
                throw new AppError("allowed_types must be an array", 400);
            return { max_size_mb: max_size_mb ?? 5, allowed_types: allowed_types ?? ["image/*"] };
        }

        case "MATRIX": {
            if (!settings) return null;
            const { rows, columns } = settings;
            if (!Array.isArray(rows) || rows.length < 1) throw new AppError("MATRIX requires at least 1 row", 400);
            if (!Array.isArray(columns) || columns.length < 2) throw new AppError("MATRIX requires at least 2 columns", 400);
            return { rows, columns };
        }

        case "EMAIL":
        case "DATE":
        case "TIME":
        case "SINGLE_CHOICE":
        case "MULTIPLE_CHOICE":
        case "DROPDOWN":
            return settings || null;

        default:
            throw new AppError("Invalid question type", 400);
    }
}


export function prepareQuestionData(survey_id, payload, index = 0) {
    const {
        content, type, required = true, order_index = index, settings, options,
        description, placeholder, section_id, media_url, media_type,
        condition, hidden_from_analytics, next_question_id, next_section_id,
    } = payload;

    validateQuestionInput({ content, type });
    const cleanedOptions = validateOptions(type, options);
    const validatedSettings = validateSettingsByType(type, settings);

    return {
        questionRow: {
            id: crypto.randomUUID(),
            survey_id,
            content: content.trim(),
            description: description || null,
            placeholder: placeholder || null,
            type,
            required,
            order_index,
            settings: validatedSettings,
            section_id: section_id || null,
            media_url: media_url || null,
            media_type: media_type || null,
            condition: condition || null,
            hidden_from_analytics: hidden_from_analytics ?? false,
            next_question_id: next_question_id || null,
            next_section_id: next_section_id || null,
        },
        cleanedOptions,
    };
}