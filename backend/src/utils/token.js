import jwt from 'jsonwebtoken';

const signToken = (payload, secret, expiresIn) =>
    jwt.sign(payload, secret, { expiresIn });

export const generateAccessToken = (payload) =>
    signToken(payload, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRES_IN);

export const generateRefreshToken = (payload) => 
    signToken(payload, process.env.REFRESH_TOKEN_SECRET, process.env.REFRESH_TOKEN_EXPIRES_IN);