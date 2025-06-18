import { httpRequest } from "../utils/httpUtils";

/**
 * 认证相关API
 */
export const authApi = {
  /**
   * 用户登录或创建用户 (旧版本，保持兼容性)
   */
  loginOrCreateUser: (
    email: string,
    username?: string,
    cursorUserId?: string,
    avatar?: string,
  ) =>
    httpRequest("POST", "/auth/login", {
      email,
      username,
      cursorUserId,
      avatar,
    }),

  /**
   * 基于邮箱的登录或创建用户 (新版本)
   */
  emailLogin: (
    email: string,
    username?: string,
    cursorUserId?: string,
    avatar?: string,
  ) =>
    httpRequest("POST", "/auth/email-login", {
      email,
      username,
      cursorUserId,
      avatar,
    }),
};
