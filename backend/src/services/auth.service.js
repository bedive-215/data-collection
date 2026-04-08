import bcrypt from 'bcryptjs';
import { sendVerificationEmail, reSendVerificationEmail } from '../utils/sendMail.js';
import models from '../models/index.js';
import { AppError } from '../middlewares/handleException.middlware.js';
import { Op } from 'sequelize';
import 'dotenv/config';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import axios from 'axios';
import { makeCode } from '../utils/makeCode.js';

class AuthService {
  constructor() {
    this.User = models.User;
    this.UserOAuth = models.UserOAuth;
  }


  async register({ email, password, full_name, date_of_birth, phone_number }) {

    const existing = await this.User.findOne({
      where: {
        [Op.or]: [
          { email },
          { phone_number }
        ]
      }
    });
    
    if (existing) throw new AppError('Email or phone number already registered', 400);

    const password_hash = await bcrypt.hash(password, 12);

    const user = await this.User.create({
      email,
      password_hash,
      full_name,
      date_of_birth,
      phone_number,
      email_verified: false,
    });

    const otp = makeCode();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    user.verification_code = otp;
    user.verification_code_expires_at = otpExpires;
    user.last_verification_code_sent_at = new Date();
    await user.save();

    await sendVerificationEmail(email, otp, otpExpires);

    return {
      user_id: user.id,
      email: user.email,
      message: 'Registration successful. Please check your email for verification code.'
    };
  }

  async login(email, password) {
    const user = await this.User.findOne({ where: { email } });
    if (!user) throw new AppError('Invalid email or password', 400);
    if (!user.email_verified) throw new AppError('Email not verified', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Invalid email or password', 400);

    const payload = { user_id: user.id, email: user.email, role: user.role, full_name: user.full_name, phone_number: user.phone_number };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    user.refresh_token = refreshToken;
    user.refresh_token_expires_at = refreshTokenExpires;
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        date_of_birth: user.date_of_birth,
        role: user.role,
        avatar: user.avatar
      }
    };
  }

  async verifyEmail({ email, otp }) {
    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }

    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.email_verified) {
      throw new AppError('Email already verified', 400);
    }

    if (!user.verification_code) {
      throw new AppError('No verification code found. Please request a new code.', 400);
    }

    // Kiểm tra OTP đã hết hạn chưa (sau 3 phút)
    if (user.verification_code_expires_at < new Date()) {
      // Xóa OTP đã hết hạn
      user.verification_code = null;
      user.verification_code_expires_at = null;
      user.last_verification_code_sent_at = null;
      await user.save();

      throw new AppError('Verification code has expired (3 minutes limit). Please request a new code.', 400);
    }


    if (otp !== user.verification_code) {
      throw new AppError('Invalid verification code', 400);
    }

    // Cập nhật lại sau khi đã xác thực thành công
    user.email_verified = true;
    user.verification_code = null;
    user.verification_code_expires_at = null;
    await user.save();

    return {
      message: 'Email verified successfully',
      user_id: user.id,
      email: user.email
    };
  }

  async resendVerifyCode(email) {
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Kiểm tra đã verify chưa
    if (user.email_verified) {
      throw new AppError('Email already verified', 400);
    }

    // Rate limit: 1 phút
    if (user.last_verification_code_sent_at) {
      const diffMs =
        Date.now() - new Date(user.last_verification_code_sent_at).getTime();

      if (diffMs < 60000) {
        const waitSec = Math.ceil((60000 - diffMs) / 1000);
        throw new AppError(`Please wait ${waitSec}s before resending code`, 429);
      }
    }

    // Tạo OTP mới
    const otp = makeCode();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    user.verification_code = otp;
    user.verification_code_expires_at = otpExpires;
    user.last_verification_code_sent_at = new Date();
    await user.save();

    // Gửi email - SỬ DỤNG user.full_name
    await reSendVerificationEmail(email, otp, otpExpires, user.full_name);

    return {
      message: 'Verification code was resent!',
      email: user.email
    };
  }

  async clearRefreshToken(id) {
    const user = await this.User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.refresh_token = null;
    user.refresh_token_expires_at = null;
    await user.save();

    console.log(`User ${user.email} logged out successfully`);

    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  async verifyGoogleToken(token) {
    if (!token) throw new AppError('Google token is required', 400);

    try {
      const response = await axios.get(
        `${process.env.GOOGLE_OAUTH_URL}${token}`
      );

      const data = response.data;
      if (!data.email) throw new AppError('Invalid Google token', 400);

      return {
        email: data.email,
        provider_uid: data.sub,
        name: data.name || data.email.split('@')[0],
      };
    } catch (err) {
      console.error('Google token verification failed:', err.response?.data || err.message);
      throw new AppError('Invalid Google token', 401);
    }
  }

  async oauthLogin({ token, phone_number, date_of_birth }) {
    if (!token) throw new AppError('Token is required', 400);

    // 1. Verify Google token
    const googleData = await this.verifyGoogleToken(token);
    const { email, provider_uid, name } = googleData;

    // 2. Find or create user
    let user = await this.User.findOne({ where: { email } });

    if (!user) {
      user = await this.User.create({
        email,
        full_name: name,
        email_verified: true,
        password_hash: null,
        phone_number: phone_number || null,
        date_of_birth: date_of_birth || null,
      });
    }

    // 3. OAuth mapping
    const [oauth] = await this.UserOAuth.findOrCreate({
      where: { provider_uid },
      defaults: { user_id: user.id }
    });

    // 4. Update missing profile fields (if client sends)
    let updated = false;

    if (!user.phone_number && phone_number) {
      user.phone_number = phone_number;
      updated = true;
    }

    if (!user.date_of_birth && date_of_birth) {
      user.date_of_birth = date_of_birth;
      updated = true;
    }

    if (updated) await user.save();

    // 5. CHECK PROFILE COMPLETENESS
    const missingFields = {
      phone_number: !user.phone_number,
      date_of_birth: !user.date_of_birth,
    };

    const isProfileComplete = !missingFields.phone_number && !missingFields.date_of_birth;

    if (!isProfileComplete) {
      return {
        status: 'INCOMPLETE_PROFILE',
        message: 'Additional information required',
        user_id: user.id,
        missing_fields: missingFields,
      };
    }

    // 6. PROFILE OK → ISSUE TOKENS
    const payload = {
      user_id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refresh_token = refreshToken;
    user.refresh_token_expires_at = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
    await user.save();

    return {
      message: 'OAuth login successful',
      accessToken,
      refreshToken,
      user: {
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        date_of_birth: user.date_of_birth,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }


  async sendResetPasswordCode(email) {
    if (!email) throw new AppError('Email is required', 400);
    const user = await this.User.findOne({ where: { email } });
    if (!user) throw new AppError("User not found", 404);

    const code = makeCode();
    const expires = new Date(Date.now() + 1 * 60 * 1000);

    user.password_reset_code = code;
    user.password_reset_code_expires_at = expires;
    await user.save();

    // Gửi email
    await sendPasswordResetEmail(email, code, expires, user.full_name);

    return { message: "Reset password code sent to email" };
  }

  async verifyResetPasswordCode(email, code) {
    const user = await this.User.findOne({ where: { email } });
    if (!user) throw new AppError("User not found", 404);

    if (!user.password_reset_code)
      throw new AppError("No reset code. Please request again.", 400);

    if (user.password_reset_code_expires_at < new Date()) {
      user.password_reset_code = null;
      user.password_reset_code_expires_at = null;
      await user.save();
      throw new AppError("Reset code expired. Please request again.", 400);
    }

    if (code !== user.password_reset_code)
      throw new AppError("Invalid reset code", 400);

    return { message: "Reset code verified" };
  }

  async resetPassword(email, newPassword) {
    const user = await this.User.findOne({ where: { email } });
    if (!user) throw new AppError("User not found", 404);

    if (!user.password_reset_code)
      throw new AppError("Reset code not verified", 400);

    const hash = await bcrypt.hash(newPassword, 12);
    user.password_hash = hash;

    user.password_reset_code = null;
    user.password_reset_code_expires_at = null;
    user.refresh_token = null;
    user.refresh_token_expires_at = null;

    await user.save();

    return { message: "Password reset successfully" };
  }

}

export default new AuthService();