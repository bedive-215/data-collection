import Joi from "joi";

export const createSurveyRequest = Joi.object({
    body: Joi.object({
        title: Joi.string().trim().min(2).max(255).required(),
        description: Joi.string().trim().optional()
    })
        .required()
        .options({ allowUnknown: false })
})