import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),

  password: Joi.string().min(6).required(),

  full_name: Joi.string().min(1).required(),

  phone_number: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),

  date_of_birth: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD
    .required()
});