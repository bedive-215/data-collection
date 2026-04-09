import Joi from "joi";

export const forgotPasswordRequest = Joi.object({
  email: Joi.string().email().required()
});

export const verifyResetCodeRequest = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required()
});

export const resetPasswordRequest = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(6).required()
});