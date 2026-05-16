import Joi from 'joi';

export const updateOptionParams = Joi.object({
    params: Joi.object({
        option_id: Joi.string().uuid().required(),
        survey_id: Joi.string().uuid().required()
    }),
    body: Joi.object({
        label: Joi.string().optional(),
        value: Joi.string().optional(),
        order_index: Joi.number().optional(),
        is_other: Joi.boolean().optional(),
        image_url: Joi.string().uri().allow(null, "").optional(),
        media_type: Joi.string().valid("image", "video").allow(null, "").optional(),
    }).min(1),
})