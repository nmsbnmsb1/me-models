"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const think_helper_1 = __importDefault(require("think-helper"));
const model_1 = require("./model");
const think_model_1 = __importDefault(require("think-model"));
let configMap = {};
let commonConfig;
let defaultDBName = '';
exports.default = {
    extendThinkAPP: think_model_1.default,
    setCommon(common) {
        commonConfig = common;
    },
    addConfig(dbName, config, isDefaultDB = false) {
        configMap[dbName] = { ...commonConfig, ...config };
        if (isDefaultDB)
            defaultDBName = dbName;
    },
    getConfig(dbName) {
        return configMap[dbName];
    },
    getDefaultConfig() {
        return configMap[defaultDBName];
    },
    getDefaultDBName() {
        return defaultDBName;
    },
    get(modelName = '', dbNameOrConfig) {
        let config;
        if (!dbNameOrConfig)
            config = this.getDefaultConfig();
        else if (think_helper_1.default.isString(dbNameOrConfig))
            config = this.getConfig(dbNameOrConfig);
        else
            config = dbNameOrConfig;
        return new model_1.Model(modelName, config);
    },
};
__exportStar(require("./model"), exports);
__exportStar(require("./DataMask"), exports);
__exportStar(require("./DBUtils"), exports);
__exportStar(require("./Redis"), exports);
//# sourceMappingURL=index.js.map