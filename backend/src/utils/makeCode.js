import crypto from 'crypto';

export const makeCode = () => {
    const code = crypto.randomInt(100000, 999999);
    return code;
}