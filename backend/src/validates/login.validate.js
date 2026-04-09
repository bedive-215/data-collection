import Joi from "joi";

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  })
    .required()
    .options({ allowUnknown: false })
});