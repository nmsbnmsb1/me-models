import helper from 'think-helper';
import Model, { IModel } from './model';
import DataMask from './DataMask';
import DBUtils from './DBUtils';
import model from 'think-model';

let configMap: any = {};
let commonConfig: any;
let defaultDBName: string = '';

export default {
	DataMask,
	DBUtils,
	model,
	//
	setCommon(common: { logConnect: boolean; logSql: boolean; logger: (msg: string) => any }) {
		commonConfig = common;
	},
	addConfig(dbName: string, config: any, isDefaultDB: boolean = false) {
		configMap[dbName] = { ...commonConfig, ...config };
		if (isDefaultDB) defaultDBName = dbName;
	},
	getConfig(dbName: string) {
		return configMap[dbName];
	},
	getDefaultConfig() {
		return configMap[defaultDBName];
	},
	getDefaultDBName() {
		return defaultDBName;
	},
	get(modelName: string = '', dbNameOrConfig?: any): IModel {
		let config: any;
		if (!dbNameOrConfig) config = this.getDefaultConfig();
		else if (helper.isString(dbNameOrConfig)) config = this.getConfig(dbNameOrConfig);
		else config = dbNameOrConfig;
		return new Model(modelName, config);
	},
};
