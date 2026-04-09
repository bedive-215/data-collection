import Joi from "joi";

export const updateUserProfileRequest = Joi.object({
  body: Joi.object({
    full_name: Joi.string().trim().min(2).max(50),

    phone_number: Joi.string()
      .pattern(/^[0-9]{10}$/),

    date_of_birth: Joi.date().iso()
  })
    .min(1)
    .required()
    .options({ allowUnknown: false }),
});