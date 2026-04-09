import Joi from "joi";

export const oauthLoginRequest = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),

    phone_number: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional(),

    date_of_birth: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
  })
    .required()
    .options({ allowUnknown: false })
});