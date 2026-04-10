import Joi from "joi";

export const surveyIdParams = Joi.object({
  params: Joi.object({
    survey_id: Joi.string().uuid().required()
  })
});