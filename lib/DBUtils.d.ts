import { type IFieldOptions, type IIndexOptions, IModel } from './model';
export interface ITFieldOptions extends IFieldOptions {
    common?: boolean;
    [tag: string]: any | boolean;
}
export interface IIndex {
    ixn?: string;
    tn: string;
    cns: string[];
    options?: IIndexOptions;
}
export declare class DBUtils {
    static escapeString(str: string): string;
    static toBoolean(b: any): 1 | 0;
    static formatSql(sql: string): string;
    static doSql(model: IModel, sql: string): Promise<any>;
    static getTableConfig(name: string, fields: {
        [field: string]: ITFieldOptions;
    }, index: {
        [ixn: string]: IIndex;
    }, nsdata: {
        ns: string;
        pkfield: string;
    }, nslist?: {
        [name: string]: {
            ns: string;
            orderfield: string;
        };
    }): any;
    static fillDefaultData(data: any, dbconfig: any): any;
    static cropData(data: any, fields: string | string[], ignores: string | string[]): any;
    static modifyFields(fields: string | string[], options: {
        [name: string]: boolean | 'override';
    }): string[];
    static getFieldsSql(fields: string | string[], options: {
        [name: string]: boolean | 'override';
    }): string;
    static aliasFields(alias: string, fields: string | string[]): string[];
    static asFields(alias?: string, defaultAs?: string | string[], sp?: boolean, customAs?: {
        [f: string]: string;
    }): {
        [f: string]: string;
    };
    static getFieldsObject(alias: string, fields: string | string[], defaultAs?: string | string[] | true, sp?: boolean, customAs?: {
        [f: string]: string;
    }, hget?: string | string[], hgetOptions?: any): {
        alias: string;
        tfields: string[];
        dataFields: any[];
        hgetFields: string[];
        asFields: {
            [f: string]: string;
        };
    };
    static getLeftJoinSql(pageSize: number, { countField, tables, where, order, }: {
        countField?: string;
        tables?: {
            t: string;
            alias?: string;
            tfields?: string | string[];
            fields?: {
                fs: string | string[];
                mopts?: {
                    [name: string]: boolean | 'override';
                };
                sp?: boolean;
                defaultAs?: string | string[];
                customAs?: {
                    [f: string]: string;
                };
            };
            on?: string;
            keep?: boolean;
        }[];
        where?: string | string[];
        order?: string;
    }): string;
    static count(model: IModel, countField: string, sql: string): Promise<any>;
    static doPage(model: IModel, page: number, pageSize: number, countField: string, sql: string): Promise<{
        count: any;
        totalPages: number;
        pageSize: number;
        page: number;
        data: any;
    }>;
    static doPageByConfig(model: IModel, page: number, pageSize: number, config: {
        countField?: string;
        tables?: {
            t: string;
            alias?: string;
            tfields?: string | string[];
            fields?: {
                fs: string | string[];
                mopts?: {
                    [name: string]: boolean | 'override';
                };
                sp?: boolean;
                defaultAs?: string | string[];
                customAs?: {
                    [f: string]: string;
                };
            };
            on?: string;
            keep?: boolean;
        }[];
        where?: string | string[];
        order?: string;
    }): Promise<{
        count: any;
        totalPages: number;
        pageSize: number;
        page: number;
        data: any;
    }>;
    static checkDup(model: IModel, where: {
        [name: string]: string | string[];
    }, exclude: {
        [name: string]: any;
    }, detail?: boolean): Promise<any>;
    static getDRObject(options: {
        fields: {
            alias?: string;
            t: any;
            hget: string;
            hgetOptions?: any;
            on?: string;
            pkfield?: string;
            sp?: boolean;
            customAs?: {
                [f: string]: string;
            };
        }[];
        where: string[];
        order: string;
        nslis: {
            ns: string;
            orderfield: string;
        };
    }): {
        tables: any[];
        where: string[];
        order: string;
        nslis: {
            ns: string;
            orderfield: string;
        };
        blocks: any[];
    };
}
