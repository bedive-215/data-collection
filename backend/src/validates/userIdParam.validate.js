import Joi from "joi";

export const userIdParam = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required()
  })
});