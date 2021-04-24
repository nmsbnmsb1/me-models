import { IModel } from './model';
export default class DBUtils {
    static escapeString(str: string): string;
    static toBoolean(b: any): 1 | 0;
    static formatSql(sql: string): string;
    static doSql(model: IModel, sql: string): Promise<any>;
    static checkDup(model: IModel, where: {
        [name: string]: string | string[];
    }, exclude: {
        [name: string]: any;
    }, detail?: boolean): Promise<any>;
    static getFieldsArr(fields: string | string[], options: {
        [name: string]: boolean | 'override';
    }): string[];
    static getFieldsSql(fields: string | string[], options: {
        [name: string]: boolean | 'override';
    }): string;
    static getLeftJoinSql(pageSize: number, config: {
        countField?: string;
        fields: string | string[];
        fieldsOptions?: {
            [name: string]: boolean | 'override';
        };
        where?: string | string[];
        tables?: {
            t: string;
            alias?: string;
            on?: string;
            keep?: boolean;
        }[];
        order?: string;
    }): string;
    static count(model: IModel, countField: string, sql: string): Promise<any>;
    static doPage(model: IModel, page: number, pageSize: number, countField: string, sql: string): Promise<{
        count: any;
        totalPages: number;
        pageSize: number;
        currentPage: number;
        data: any;
    }>;
    static doPageByConfig(model: IModel, page: number, pageSize: number, config: {
        countField?: string;
        fields: string | string[];
        fieldsOptions?: {
            [name: string]: boolean | 'override';
        };
        where?: string | string[];
        tables?: {
            t: string;
            alias?: string;
            on?: string;
            keep?: boolean;
        }[];
        order?: string;
    }): Promise<{
        count: any;
        totalPages: number;
        pageSize: number;
        currentPage: number;
        data: any;
    }>;
}
