import { IModel } from './model';
declare type DataFields = string | string[];
declare type ASFields = {
    [dataField: string]: string;
};
export interface IBlock {
    prefix?: string;
    ns: string;
    pkfield: string;
    dataFields: DataFields;
    hgetFields?: DataFields;
    asFields?: ASFields;
}
export interface ILisOptions {
    forcedb?: boolean;
    prefix?: string;
    ns: string;
    liname: string;
    orderfield: string;
    blocks: IBlock[];
    expire?: number;
}
export declare class Redis {
    static init(instance: any, de: number, l: any): void;
    static cdata(data: any, options: {
        prefix?: string;
        ns: string;
        pkfield: string;
        asFields?: ASFields;
        expire?: number;
    }, pipelineInstance?: any): Promise<void>;
    static cdatas(datas: any[], options: {
        prefix?: string;
        ns: string;
        pkfield: string;
        asFields?: ASFields;
        expire?: number;
    }, pipelineInstance?: any): Promise<void>;
    static clidata(listdata: any[] | {
        count: number;
        data: any[];
    }, options: {
        blocks: IBlock[];
        expire?: number;
    }, pipelineInstance?: any): Promise<void>;
    static cli(listdata: any[] | {
        count: number;
        data: any[];
    }, options: ILisOptions, pipelineInstance?: any): Promise<void>;
    static cliIfExists(listdata: any[] | {
        count: number;
        data: any[];
    }, options: ILisOptions, pipelineInstance?: any): Promise<void>;
    static cdel(key: string, pipelineInstance?: any): Promise<void>;
    static cdeldata({ prefix, ns, pkvalue }: {
        prefix?: string;
        ns: string;
        pkvalue: any;
    }, pipelineInstance?: any): Promise<void>;
    static cdellidata({ prefix, ns, liname, ordervalue }: {
        prefix?: string;
        ns: string;
        liname: string;
        ordervalue: any;
    }, pipelineInstance?: any): Promise<void>;
    static cdelli(options: {
        prefix?: string;
        ns: string;
        liname: string;
        blocks?: {
            prefix?: string;
            ns: string;
            pkfield?: string;
        }[];
    }, delAll?: boolean, onLiKeyNotFound?: () => Promise<any[]>, pipelineInstance?: any): Promise<void>;
    static cexists(key: string): Promise<any>;
    static cexistsData({ prefix, ns, pkvalue }: {
        prefix?: string;
        ns: string;
        pkvalue: any;
    }): Promise<any>;
    static cexistsLi({ prefix, ns, liname }: {
        prefix?: string;
        ns: string;
        liname: string;
    }): Promise<any>;
    static cexpire(expire: number, key: string, pipelineInstance?: any): Promise<void>;
    static cexpireData(expire: number, { prefix, ns, pkvalue }: {
        prefix?: string;
        ns: string;
        pkvalue: any;
    }, pipelineInstance?: any): Promise<void>;
    static cexpireLi(expire: any, { prefix, ns, liname }: {
        prefix?: string;
        ns: string;
        liname: string;
    }, pipelineInstance?: any): Promise<void>;
    static rsel(dataPkvalues: {
        [pkfield: string]: string;
    }[], options: {
        forcedb?: boolean;
        blocks: (IBlock & {
            sel?: (missPkvalues: any, pkfield: any) => Promise<any>;
        })[];
        expire?: number;
    }): Promise<any[]>;
    static rfind(dataPkvalue: string | {
        [pkfield: string]: string;
    }, options: {
        forcedb?: boolean;
        blocks: (IBlock & {
            sel: (missPkvalues: any, pkfield: any) => Promise<any>;
        })[];
        expire?: number;
        dataChecker?: (data: any) => boolean | {
            [field: string]: any;
        };
    }): Promise<any>;
    static rlidb(options: ILisOptions & {
        page: number;
        pageSize: number;
        sel: (options: any) => any[] | {
            count: number;
            totalPages: number;
            pageSize: number;
            page: number;
            data: any[];
        };
    }): Promise<{
        count: number;
        totalPages: number;
        pageSize: number;
        page: number;
        data: any[];
    }>;
    static rli(options: ILisOptions & {
        blocks: (IBlock & {
            sel: (missPkvalues: any, pkfield: any) => Promise<any>;
        })[];
        sel: (options: any) => object[] | {
            count: number;
            totalPages: number;
            pageSize: number;
            page: number;
            data: object[];
        };
        page: number;
        pageSize: number;
        order: string;
    }): Promise<{
        count: any;
        totalPages: number;
        pageSize: number;
        page: number;
        data: any;
    }>;
    static rdatadb(options: {
        sel: (options: any) => object[] | {
            count: number;
            totalPages: number;
            pageSize: number;
            page: number;
            data: object[];
        };
        blocks: (IBlock & {
            sel: (missPkvalues: any, pkfield: any) => Promise<any>;
        })[];
        expire?: number;
    }): Promise<{
        count: number;
        totalPages: number;
        pageSize: number;
        page: number;
        data: any[];
    }>;
    static rupdateOne({ t, where, updateData }: {
        t: IModel;
        where: any;
        updateData: any;
    }, currentData: any, options: {
        prefix?: string;
        ns: string;
        pkfield: string;
        asFields?: ASFields;
        expire?: number;
    } | ((updateData: any, currentData: any) => Promise<any>)): Promise<any>;
    static rdelOne({ t, where, updateData }: {
        t: IModel;
        where: any;
        updateData: any;
    }, options: {
        prefix?: string;
        ns: string;
        pkvalue: any;
    }): Promise<boolean>;
}
export {};
