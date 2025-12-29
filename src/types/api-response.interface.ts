/**
 * API响应接口定义
 * 与全局响应拦截器保持一致
 */
export interface IApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}
