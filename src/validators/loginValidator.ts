import Joi from 'joi';

// Define the login validation schema
export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Invalid email format.',
        }),
    username: Joi.string()
        .required()
        .messages({
            'string.base': 'Username must be a string.',
        }),
    password: Joi.string()
        .min(8)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long.',
            'any.required': 'Password is required.',
        }),
}).or('email', 'username')
    .messages({
        'object.missing': 'Either email or username is required.',
    });
