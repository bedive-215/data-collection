import Joi from "joi";

export const deleteParticipantParams = Joi.object({
  params: Joi.object({
    pid: Joi.string().uuid().required(),
    survey_id: Joi.string().uuid().required()
  })
});