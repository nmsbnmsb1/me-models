import { IModel } from './model';
import model from 'think-model';
declare const _default: {
    extendThinkAPP: typeof model;
    setCommon(common: {
        logConnect: boolean;
        logSql: boolean;
        logger: (msg: string) => any;
    }): void;
    addConfig(dbName: string, config: any, isDefaultDB?: boolean): void;
    getConfig(dbName: string): any;
    getDefaultConfig(): any;
    getDefaultDBName(): string;
    get(modelName?: string, dbNameOrConfig?: any): IModel;
};
export default _default;
export * from './model';
export * from './DataMask';
export * from './DBUtils';
