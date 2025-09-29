import { z } from "zod";

const strongPasswordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm;
const usernameRegex = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/igm;

export const signupUserSchema = z.object({
    fullname: z.string().min(3),
    username: z.string().min(3).regex(usernameRegex),
    email: z.string().email(),
    password: z.string().regex(strongPasswordRegex),
});

export const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().regex(strongPasswordRegex),
});
