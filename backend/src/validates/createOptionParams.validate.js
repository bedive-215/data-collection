import Joi from 'joi';

export const createOptionParams = Joi.object({
    params: Joi.object({
        question_id: Joi.string().uuid().required(),
        survey_id: Joi.string().uuid().required()
    }),
    body: Joi.object({
        label: Joi.string().required(),
        value: Joi.string().optional(),
        order_index: Joi.number().optional(),
        is_other: Joi.boolean().optional(),
        image_url: Joi.string().uri().allow(null, "").optional(),
        media_type: Joi.string().valid("image", "video").allow(null, "").optional(),
    }).optional(),
    query: Joi.object({
        date_from: Joi.date().iso().optional(),
        date_to: Joi.date().iso().min(Joi.ref("date_from")).optional(),
        response_ids: Joi.string().optional(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(50),
    }).options({ allowUnknown: true }),
})