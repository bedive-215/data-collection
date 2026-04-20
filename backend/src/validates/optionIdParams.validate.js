import Joi from "joi";

export const optionIdParams = Joi.object({
  params: Joi.object({
    option_id: Joi.string().uuid().required()
  })
});