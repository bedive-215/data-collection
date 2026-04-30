import Joi from "joi";

export const createQuestionRequest = Joi.object({
    body: Joi.object({
        content: Joi.string().trim().min(2).max(255).required(),
        type: Joi.string().valid('text', 'multiple_choice', 'rating').required(),
        required: Joi.boolean().default(false),
        order_index: Joi.number().integer().min(0).optional(),
        settings: Joi.object().optional(),
        option: Joi.array().items(Joi.string().trim()).optional()
    }),

    params: Joi.object({
        survey_id: Joi.string().uuid().required()
    })
})