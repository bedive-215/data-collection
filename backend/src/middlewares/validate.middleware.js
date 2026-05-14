import Joi from "joi";

export const validate = (schema) => (req, res, next) => {
    const toValidate = {};

    if (schema.describe().keys.params) toValidate.params = req.params;
    if (schema.describe().keys.query)  toValidate.query  = req.query;
    if (schema.describe().keys.body)   toValidate.body   = req.body;

    const { error, value } = schema.validate(toValidate, {
        abortEarly: false,
        allowUnknown: true,
    });

    if (error) {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: error.details.map((d) => ({
                field: d.path.join("."),
                message: d.message,
            })),
        });
    }

    if (value.params) Object.assign(req.params, value.params);
    if (value.body)   Object.assign(req.body,   value.body);
    // req.query: dùng Object.assign vào bên trong, không gán lại cả object
    if (value.query)  Object.assign(req.query,  value.query);

    next();
};