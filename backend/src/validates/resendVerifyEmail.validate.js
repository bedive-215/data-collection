import Joi from "joi";

export const reSendVerifyCodeRequest = Joi.object({
  email: Joi.string().email().required(),
});