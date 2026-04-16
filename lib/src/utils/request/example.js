"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 在 app.ts 中初始化
const request_1 = require("@/utils/request");
(0, request_1.initRequest)({
    baseURL: 'https://api.example.com',
    setupInterceptors: true
});
// 方式1: 直接使用
const request_2 = require("@/utils/request");
const data = await (0, request_2.get)('/api/user', { id: 1 });
const result = await (0, request_2.post)('/api/user', { name: 'test' });
// 方式2: 创建API服务 (已在 src/config/api.ts 中使用)
const apiConfig_1 = require("@/utils/request/apiConfig");
const userService = apiConfig_1.createApiService < User > ({
    url: '/api/users'
});
const users = await userService.get();
const user = await userService.post({ name: 'test' });
const updated = await userService.put({ id: 1, name: 'updated' });
await userService.delete(1);
//# sourceMappingURL=example.js.map