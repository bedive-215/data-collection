import AuthService from '../services/auth.service.js';
import 'dotenv/config';

export const register = async (req, res, next) => {
  try {
    console.log(req.body);
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err); // AppError hay lỗi khác đều xử lý chung ở middleware
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { refreshToken, ...result } = await AuthService.login(email, password);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await AuthService.verifyEmail({ email, otp });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const resendVerifyCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await AuthService.resendVerifyCode(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// controllers/auth.controller.js
export const checkAuth = async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: {
        access_token: res.locals.newAccessToken,
        user: req.user
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await AuthService.clearRefreshToken(req.user.id);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: '/'
    });

    return res.status(200).json({
      status: 'success',
      message: "Logged out successfully"
    });
  } catch (err) {
    next(err);
  }
};

export const oauthLogin = async (req, res, next) => {
  try {
    const data = await AuthService.oauthLogin(req.body);

    if (data.status === 'INCOMPLETE_PROFILE') {
      return res.status(200).json({
        status: 'incomplete',
        message: data.message,
        user_id: data.user_id,
        missing_fields: data.missing_fields,
      });
    }

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: "success",
      message: data.message,
      accessToken: data.accessToken,
      user: data.user,
    });
  } catch (err) {
    next(err);
  }
};


export const sendResetPasswordCode = async (req, res, next) => {
  try {
    const data = await AuthService.sendResetPasswordCode(req.body.email);
    return res.status(200).json({ status: "success", ...data });
  } catch (err) {
    next(err);
  }
};

export const verifyResetCode = async (req, res, next) => {
  try {
    const data = await AuthService.verifyResetPasswordCode(
      req.body.email,
      req.body.code
    );
    return res.status(200).json({ status: "success", ...data });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const data = await AuthService.resetPassword(
      req.body.email,
      req.body.newPassword
    );
    return res.status(200).json({ status: "success", ...data });
  } catch (err) {
    next(err);
  }
};