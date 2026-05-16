import Joi from "joi";

export const createQuestionRequest = Joi.object({
    body: Joi.object({
        content: Joi.string()
            .trim()
            .required(),

        type: Joi.string()
            .valid(
                "TEXT",
                "PARAGRAPH",
                "EMAIL",
                "DATE",
                "NUMBER",
                "RATING",
                "SINGLE_CHOICE",
                "MULTIPLE_CHOICE",
                "DROPDOWN",
                "LINEAR_SCALE",
                "TIME",
                "FILE_UPLOAD",
                "MATRIX"
            )
            .required(),

        required: Joi.boolean()
            .optional(),

        order_index: Joi.number()
            .optional(),

        settings: Joi.object()
            .optional(),

        description: Joi.string().allow(null, "").optional(),
        placeholder: Joi.string().allow(null, "").optional(),
        section_id: Joi.string().uuid().allow(null).optional(),

        options: Joi.array()
            .items(
                Joi.object({
                    label: Joi.string().required(),
                    value: Joi.string().required(),
                    order_index: Joi.number().optional(),
                    is_other: Joi.boolean().optional(),
                    image_url: Joi.string().uri().allow(null, "").optional(),
                    media_type: Joi.string().valid("image", "video").allow(null, "").optional(),
                })
            )
            .optional(),

        media_url: Joi.string().uri().allow(null, "").optional(),
        media_type: Joi.string().valid("image", "video").allow(null, "").optional(),

        condition: Joi.object().allow(null).optional(),
        hidden_from_analytics: Joi.boolean().optional(),
        next_question_id: Joi.string().uuid().allow(null).optional(),
        next_section_id: Joi.string().uuid().allow(null).optional(),
    })
});