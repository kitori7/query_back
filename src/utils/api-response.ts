export type ApiSuccess<T> = { code: 0; data: T; message: "success" };

export function success<T>(data: T): ApiSuccess<T> {
  return { code: 0, data, message: "success" };
}

export type PageData<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

