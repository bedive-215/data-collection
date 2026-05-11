import Joi from 'joi';

export const updateQuestionParams = Joi.object({
    params: Joi.object({
        question_id: Joi.string().uuid().required(),
        survey_id: Joi.string().uuid().required()
    })
})