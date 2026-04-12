import Joi from "joi";

export const surveySubmissionParams = Joi.object({
    params: Joi.object({
        survey_id: Joi.string().uuid().required(),
        id: Joi.string().uuid().required()
    })
});