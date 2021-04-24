"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const think_helper_1 = __importDefault(require("think-helper"));
const model_1 = __importDefault(require("./model"));
const DataMask_1 = __importDefault(require("./DataMask"));
const DBUtils_1 = __importDefault(require("./DBUtils"));
const think_model_1 = __importDefault(require("think-model"));
let configMap = {};
let commonConfig;
let defaultDBName = '';
exports.default = {
    DataMask: DataMask_1.default,
    DBUtils: DBUtils_1.default,
    model: think_model_1.default,
    setCommon(common) {
        commonConfig = common;
    },
    addConfig(dbName, config, isDefaultDB = false) {
        configMap[dbName] = Object.assign(Object.assign({}, commonConfig), config);
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
        return new model_1.default(modelName, config);
    },
};
//# sourceMappingURL=index.js.map