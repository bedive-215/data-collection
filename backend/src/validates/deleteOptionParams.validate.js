import Joi from 'joi';

export const deleteOptionParams = Joi.object({
    params: Joi.object({
        option_id: Joi.string().uuid().required(),
        survey_id: Joi.string().uuid().required()
    })
})