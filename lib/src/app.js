"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vue_1 = require("vue");
const pinia_1 = require("pinia");
require("./app.scss");
const App = (0, vue_1.createApp)({
    onShow(options) {
    },
});
App.use((0, pinia_1.createPinia)());
exports.default = App;
//# sourceMappingURL=app.js.map