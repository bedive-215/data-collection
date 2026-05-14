import Joi from "joi";

export const surveyIdParams = Joi.object({
  params: Joi.object({
    survey_id: Joi.string().uuid().required()
  }),
  query: Joi.object({
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().min(Joi.ref("date_from")).optional(),
    response_ids: Joi.string().optional(),
  }).options({ allowUnknown: true }),
});