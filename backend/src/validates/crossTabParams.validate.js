import Joi from "joi";

const uuid = Joi.string().uuid({ version: "uuidv4" });

export const crossTabParams = Joi.object({
    params: Joi.object({
        survey_id: uuid.required(),
    }),
    query: Joi.object({
        question_a:   uuid.required().messages({ "any.required": "question_a is required" }),
        question_b:   uuid.required().messages({ "any.required": "question_b is required" }),
        date_from:    Joi.date().iso().optional(),
        date_to:      Joi.date().iso().min(Joi.ref("date_from")).optional(),
        response_ids: Joi.string().optional(),
    }).options({ allowUnknown: true }),
});