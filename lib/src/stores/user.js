"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserStore = void 0;
const pinia_1 = require("pinia");
const vue_1 = require("vue");
const taro_1 = require("@tarojs/taro");
const DEFAULT_AVATAR = 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132';
const STORAGE_KEY = 'user_info';
exports.useUserStore = (0, pinia_1.defineStore)('user', () => {
    const userInfo = (0, vue_1.ref)(null);
    const isLoggedIn = (0, vue_1.ref)(false);
    const loadUserInfo = () => {
        try {
            const data = taro_1.default.getStorageSync(STORAGE_KEY);
            if (data) {
                userInfo.value = JSON.parse(data);
                isLoggedIn.value = true;
            }
        }
        catch (error) {
            console.error('加载用户信息失败:', error);
        }
    };
    const saveUserInfo = (info) => {
        try {
            taro_1.default.setStorageSync(STORAGE_KEY, JSON.stringify(info));
            userInfo.value = info;
            isLoggedIn.value = true;
        }
        catch (error) {
            console.error('保存用户信息失败:', error);
        }
    };
    const clearUserInfo = () => {
        try {
            taro_1.default.removeStorageSync(STORAGE_KEY);
            userInfo.value = null;
            isLoggedIn.value = false;
        }
        catch (error) {
            console.error('清除用户信息失败:', error);
        }
    };
    const getAvatar = () => {
        var _a;
        return ((_a = userInfo.value) === null || _a === void 0 ? void 0 : _a.avatarUrl) || DEFAULT_AVATAR;
    };
    const getNickName = () => {
        var _a;
        return ((_a = userInfo.value) === null || _a === void 0 ? void 0 : _a.nickName) || '请登录';
    };
    const wechatLogin = async () => {
        try {
            const loginRes = await taro_1.default.login();
            if (loginRes.code) {
                const userInfoRes = await taro_1.default.getUserProfile({
                    desc: '用于完善用户资料'
                });
                if (userInfoRes.userInfo) {
                    const userData = {
                        avatarUrl: userInfoRes.userInfo.avatarUrl,
                        nickName: userInfoRes.userInfo.nickName
                    };
                    saveUserInfo(userData);
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('微信登录失败:', error);
            return false;
        }
    };
    const logout = () => {
        clearUserInfo();
    };
    return {
        userInfo,
        isLoggedIn,
        loadUserInfo,
        saveUserInfo,
        clearUserInfo,
        getAvatar,
        getNickName,
        wechatLogin,
        logout
    };
});
//# sourceMappingURL=user.js.map