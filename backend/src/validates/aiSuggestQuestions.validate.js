import Joi from "joi";

export const aiSuggestQuestionsRequest = Joi.object({
  params: Joi.object({
    survey_id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    mode: Joi.string().valid("parse", "generate").required(),
    rawText: Joi.when("mode", {
      is: "parse",
      then: Joi.string().trim().min(5).max(120000).required(),
      otherwise: Joi.string().allow("").max(120000).optional(),
    }),
    surveyTitle: Joi.when("mode", {
      is: "generate",
      then: Joi.string().trim().min(2).max(500).required(),
      otherwise: Joi.string().allow("").max(500).optional(),
    }),
    surveyDescription: Joi.string().allow("").max(4000).optional(),
    count: Joi.number().integer().min(3).max(20).optional(),
  }),
});
