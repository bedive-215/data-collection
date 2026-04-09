import Joi from "joi";

export const reSendVerifyCodeRequest = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
  })
    .required()
    .options({ allowUnknown: false })
});