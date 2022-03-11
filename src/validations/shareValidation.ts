import Joi from "joi";

export const updateShareValidation = Joi.object({
    symbol: Joi.string()
        .required()
        .pattern(new RegExp('^[A-Z]{3}$')),

    rate: Joi.number()
        .required()
        .positive()
        .custom((value, _helpers) => { 
            var regex = /^\d+(\.\d{2})?$/g;
            if (!regex.test(value)) {
                throw new Error(`The rate must be a number with exactly 2 decimal digits`);
            }
        }),
})