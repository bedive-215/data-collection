import joi from "joi";

export const pidParams = joi.object({
    params: joi.object({
        pid: joi.string().uuid().required()
    })
});