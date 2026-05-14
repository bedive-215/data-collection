import Joi from "joi";

const uuid = Joi.string().uuid({ version: "uuidv4" });

export const trendParams = Joi.object({
    params: Joi.object({
        survey_id: uuid.required(),
    }),
    query: Joi.object({
        group_by:     Joi.string().valid("day", "week", "month").default("day"),
        date_from:    Joi.date().iso().optional(),
        date_to:      Joi.date().iso().min(Joi.ref("date_from")).optional(),
        response_ids: Joi.string().optional(),
    }).options({ allowUnknown: true }),
});