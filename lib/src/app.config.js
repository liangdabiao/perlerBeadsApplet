"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineAppConfig({
    pages: [
        // 'pages/home/index',
        'pages/profile/index',
        'pages/editor/index',
        'pages/saveForm/index',
        'pages/settings/index',
        'pages/detail/index',
        'pages/debug/index',
    ],
    window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#fff',
        navigationBarTitleText: '拼豆',
        navigationBarTextStyle: 'black'
    },
    tabBar: {
        custom: true,
        color: '#999999',
        selectedColor: '#FF6B6B',
        backgroundColor: '#ffffff',
        borderStyle: 'black',
        list: [
            {
                pagePath: 'pages/profile/index',
                text: '我的'
            },
            {
                pagePath: 'pages/editor/index',
                text: '编辑器'
            }
        ]
    }
});
//# sourceMappingURL=app.config.js.map