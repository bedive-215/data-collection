import Joi from "joi";

export const userIdParams = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required()
  })
});