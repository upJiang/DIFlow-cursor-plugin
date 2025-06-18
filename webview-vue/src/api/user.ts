import { httpRequest } from "../utils/httpUtils";

/**
 * 用户相关API
 */
export const userApi = {
  /**
   * 获取用户信息
   */
  getUserInfo: (userEmail: string) => httpRequest("GET", `/users/${userEmail}`),
};
