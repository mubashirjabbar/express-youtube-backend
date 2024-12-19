import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

import { ApiError } from '../utils/apiError';

export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        console.log('Validating request:', req.body);
        const { error } = schema.validate(req.body, { abortEarly: false });
        console.log("error-->", error);

        if (error) {
            console.log('Validation error:', error.details.map((d) => d.message));
            throw new ApiError(400, error.details.map((d) => d.message).join(', '));
        }

        next();
    };
};