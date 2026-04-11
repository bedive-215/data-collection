import Joi from "joi";

export const responseIdParams = Joi.object({
  params: Joi.object({
    response_id: Joi.string().uuid().required()
  })
});