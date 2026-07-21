import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/UserRepository";
import { User, UserRole } from "../../src/types";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "devlaunch_ai_access_secret_token_key_111";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "devlaunch_ai_refresh_secret_token_key_999";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.USER
  ): Promise<{ user: Omit<User, "passwordHash">; accessToken: string; refreshToken: string }> {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new Error("A user with this email address already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

    const user = await userRepository.create({
      email,
      passwordHash,
      role,
      firstName,
      lastName,
      avatarUrl: defaultAvatar,
      isVerified: true, // Auto verify in sandbox env, but mockable
    });

    const tokens = this.generateTokens({ userId: user.id, email: user.email, role: user.role });

    const { passwordHash: _, ...userSafe } = user;
    return {
      user: userSafe,
      ...tokens,
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, "passwordHash">; accessToken: string; refreshToken: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    const tokens = this.generateTokens({ userId: user.id, email: user.email, role: user.role });

    const { passwordHash: _, ...userSafe } = user;
    return {
      user: userSafe,
      ...tokens,
    };
  }

  async refreshToken(refreshTokenString: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshTokenString, REFRESH_TOKEN_SECRET) as TokenPayload;
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw new Error("User associated with this token was not found.");
      }

      const tokens = this.generateTokens({ userId: user.id, email: user.email, role: user.role });
      return tokens;
    } catch (e) {
      throw new Error("Invalid or expired refresh token.");
    }
  }

  generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId: payload.userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  }
}

export const authService = new AuthService();
