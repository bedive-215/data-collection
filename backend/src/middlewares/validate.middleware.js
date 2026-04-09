import { AppError } from "./handleException.middlware.js";

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true
  });
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.body = value;
  next();
};