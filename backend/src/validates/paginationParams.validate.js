import Joi from "joi";

const uuid = Joi.string().uuid({ version: "uuidv4" });


// ─── /surveys/:survey_id/responses ───────────────────────────
export const paginationParams = Joi.object({
    params: Joi.object({
        survey_id: uuid.required(),
    }),
    query: Joi.object({
        page:         Joi.number().integer().min(1).default(1),
        limit:        Joi.number().integer().min(1).max(100).default(20),
        date_from:    Joi.date().iso().optional(),
        date_to:      Joi.date().iso().min(Joi.ref("date_from")).optional(),
        response_ids: Joi.string().optional(),
    }).options({ allowUnknown: true }),
});