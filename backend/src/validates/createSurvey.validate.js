import Joi from "joi";

export const createSurveyRequest = Joi.object({
    body: Joi.object({
        title: Joi.string().trim().min(2).max(255).required(),
        description: Joi.string().trim().optional(),
        start_at: Joi.date().iso().optional(),
        end_at: Joi.date().iso().optional().greater(Joi.ref('start_at')).messages({
            'date.greater': 'end_at must be after start_at'
        }),
    })
        .required()
        .options({ allowUnknown: false })
})