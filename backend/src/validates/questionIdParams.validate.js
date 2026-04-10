import Joi from "joi";

export const questionIdParams = Joi.object({
  params: Joi.object({
    question_id: Joi.string().uuid().required()
  })
});