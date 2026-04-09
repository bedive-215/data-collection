import Joi from "joi";

export const registerSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),

    password: Joi.string().min(6).required(),

    full_name: Joi.string().trim().min(1).required(),

    phone_number: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required(),

    date_of_birth: Joi.date().iso().required()
  })
    .required()
    .options({ allowUnknown: false })
});