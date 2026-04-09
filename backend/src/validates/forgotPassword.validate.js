import Joi from "joi";

export const forgotPasswordRequest = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required()
  })
    .required()
    .options({ allowUnknown: false })
});

export const verifyResetCodeRequest = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).required()
  })
    .required()
    .options({ allowUnknown: false })
});

export const resetPasswordRequest = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    newPassword: Joi.string().min(6).required()
  })
    .required()
    .options({ allowUnknown: false })
});