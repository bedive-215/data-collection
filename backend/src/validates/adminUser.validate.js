import Joi from "joi";

export const updateUserRoleRequest = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required()
  }),
  body: Joi.object({
    role: Joi.string().valid("user", "admin").required()
  })
});

export const blockUserRequest = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required()
  }),
  body: Joi.object({
    reason: Joi.string().max(500).allow("", null).optional()
  })
});

export const unblockUserRequest = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required()
  })
});
