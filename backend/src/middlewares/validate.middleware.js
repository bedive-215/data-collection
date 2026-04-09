import {AppError} from "../middlewares/handleException.middlware.js";

export const validate = (schema) => (req, res, next) => {
  const data = {};

  if (schema.describe().keys.body) data.body = req.body;
  if (schema.describe().keys.params) data.params = req.params;
  if (schema.describe().keys.query) data.query = req.query;

  const { error, value } = schema.validate(data);

  if (error) return next(new AppError(error.message));

  Object.assign(req, value);
  next();
};