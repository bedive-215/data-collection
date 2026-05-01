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
                "DROPDOWN"
            )
            .required(),

        required: Joi.boolean()
            .optional(),

        order_index: Joi.number()
            .optional(),

        settings: Joi.object()
            .optional(),

        options: Joi.array()
            .items(
                Joi.object({
                    label: Joi.string().required(),
                    value: Joi.string().required(),
                    order_index: Joi.number().optional(),
                    is_other: Joi.boolean().optional()
                })
            )
            .optional()
    })
});