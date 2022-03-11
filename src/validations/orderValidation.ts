import Joi from "joi";

export const sellOrderValidation = Joi.object({
    symbol: Joi.string()
        .required()
        .pattern(new RegExp('^[A-Z]{3}$')),

    count: Joi.number()
        .positive(),
})