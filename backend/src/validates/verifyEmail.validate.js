import Joi from "joi";

export const verifyEmailRequest = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});