import { z } from 'zod';

export const CountrySchema = z.object({
    name: z.string().min(1, 'Country name is required'),
    code: z.string().length(2, 'Country code must be exactly 2 characters').toUpperCase(),
})

export const CustomerSchema = z.object({
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email format'),
    phone_number: z.string().regex(/^[0-9]+$/, 'Phone number must contain only digits'),
    address: z.string().min(1, 'Address is required'),
    birth_date: z.string().refine((date) => {
        const parsedDate = new Date(date);
        return parsedDate <= new Date();
    }, 'Birth date cannot be in the future'),
    nationality: z.enum(['wni', 'wna'], {
        errorMap: () => ({ message: 'Nationality must be either wni or wna' }),
    }),
    country_id: z.number({
        required_error: 'Country is required for WNA',
        invalid_type_error: 'Country ID must be a number',
    }).nullable(),
    photo_url: z.string().optional().or(z.string().length(0)),
}).refine(
    (data) => {
        // If nationality is 'wna', country_id must be a non-null number
        if (data.nationality === 'wna') {
            return data.country_id !== null;
        }
        // If nationality is 'wni', any value for country_id is acceptable
        return true;
    },
    {
        message: "Country selection is required for WNA nationality",
        path: ["country_id"], // This will make the error show up on the country_id field
    }
);

export type CountryInput = z.infer<typeof CountrySchema>
export type CustomerInput = z.infer<typeof CustomerSchema>

export const handleZodError = (error: z.ZodError) => {
    return error.errors.map(err => err.message).join(', ')
}