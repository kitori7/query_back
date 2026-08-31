import type { RequestHandler } from "express";

type Rule = { method: string; pattern: RegExp; body?: string[]; query?: string[] };

const rules: Rule[] = [
  { method: "POST", pattern: /^\/api\/admin\/auth\/login$/, body: ["username", "password"] },
  { method: "POST", pattern: /^\/api\/admin\/auth\/logout$/, body: [] },
  { method: "GET", pattern: /^\/api\/admin\/companies$/, query: ["page", "pageSize", "name"] },
  { method: "GET", pattern: /^\/api\/admin\/companies\/options$/, query: ["keyword", "limit"] },
  { method: "POST", pattern: /^\/api\/admin\/companies$/, body: ["name"] },
  { method: "PATCH", pattern: /^\/api\/admin\/companies\/\d+$/, body: ["name"] },
  { method: "GET", pattern: /^\/api\/admin\/products$/, query: ["page", "pageSize", "name", "companyId"] },
  { method: "GET", pattern: /^\/api\/admin\/products\/options$/, query: ["keyword", "companyId", "limit"] },
  { method: "POST", pattern: /^\/api\/admin\/products$/, body: ["name", "companyId", "contractImg"] },
  { method: "PATCH", pattern: /^\/api\/admin\/products\/\d+$/, body: ["name", "companyId", "contractImg"] },
 { method: "GET", pattern: /^\/api\/admin\/batches$/, query: ["page", "pageSize", "name", "companyId", "productId"] },
  { method: "GET", pattern: /^\/api\/batch\/\d+\/export$/, query: ["startSerial"] },
  { method: "GET", pattern: /^\/api\/admin\/batches\/options$/, query: ["keyword", "companyId", "productId", "limit"] },
  { method: "POST", pattern: /^\/api\/admin\/batches$/, body: ["name", "productId", "imgUrls"] },
  { method: "PATCH", pattern: /^\/api\/admin\/batches\/\d+$/, body: ["name", "productId", "imgUrls"] },
  { method: "GET", pattern: /^\/api\/admin\/codes$/, query: ["page", "pageSize", "codeUuid", "companyId", "productId", "batchId"] },
  { method: "POST", pattern: /^\/api\/admin\/codes$/, body: ["codeUuid", "url", "batchId"] },
  { method: "PATCH", pattern: /^\/api\/admin\/codes\/\d+$/, body: ["codeUuid", "url", "batchId"] },
  { method: "POST", pattern: /^\/api\/batch\/create$/, body: ["productId", "batchName", "codeCount"] },
  { method: "POST", pattern: /^\/api\/batch\/apply$/, body: ["batchId", "codeCount"] },
];

export const requestSchemaGuard: RequestHandler = (request, response, next) => {
  const rule = rules.find((item) => item.method === request.method && item.pattern.test(request.path));
  if (!rule) return next();
  const actual = rule.body ? Object.keys(request.body ?? {}) : Object.keys(request.query ?? {});
  const allowed = new Set(rule.body ?? rule.query ?? []);
  const unknown = actual.filter((key) => !allowed.has(key));
  if (unknown.length) {
    response.status(400).json({ code: 1001, data: null, message: "请求参数不合法", details: unknown.map((key) => `不允许的字段: ${key}`) });
    return;
  }
  next();
};
