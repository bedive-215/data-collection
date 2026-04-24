import Joi from "joi";

export const getUserResponse = Joi.object({
    params: Joi.object({
        survey_id: Joi.string().uuid().required(),
        id: Joi.string().uuid().required()
    })
});