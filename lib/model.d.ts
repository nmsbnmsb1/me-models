import ThinkModel from 'think-model/lib/model';
export interface IFieldOptions {
    type: string;
    nn?: boolean;
    pk?: boolean;
    ai?: boolean;
    u?: boolean;
    default?: any;
}
export interface IFields {
    id: boolean | IFieldOptions;
    sp: boolean | IFieldOptions;
    [name: string]: boolean | IFieldOptions;
}
export interface IIndexOptions {
    unique: boolean;
    type: string;
}
export interface IModel {
    new (modelName?: string, config?: object): ThinkModel;
    readonly HAS_MANY: number;
    readonly HAS_ONE: number;
    readonly BELONG_TO: number;
    readonly MANY_TO_MANY: number;
    db(db?: any): any;
    models: object;
    readonly tablePrefix: string;
    readonly tableName: string;
    readonly pk: string;
    readonly lastSql: string;
    model(name: string): ThinkModel;
    cache(key?: string, config?: object): ThinkModel;
    limit(offset?: Array<string | number> | number | string, length?: number | string): ThinkModel;
    page(page?: Array<string | number> | number | string, listRows?: string | number): ThinkModel;
    where(where?: string | object): ThinkModel;
    field(field?: string, reverse?: boolean): ThinkModel;
    fieldReverse(field?: string): ThinkModel;
    table(table?: string, hasPrefix?: boolean): ThinkModel;
    union(union?: string, all?: boolean): ThinkModel;
    join(join?: string | Array<string> | object): ThinkModel;
    order(value: string): ThinkModel;
    alias(value: string): ThinkModel;
    having(value: string): ThinkModel;
    group(value: string): ThinkModel;
    lock(value: boolean): ThinkModel;
    auto(value: string): ThinkModel;
    distinct(data: any): ThinkModel;
    explain(explain: string): ThinkModel;
    parseOptions(options: any): Promise<any>;
    add(data: object, options?: object, replace?: boolean): Promise<string>;
    thenAdd(data: object, where?: object | string): Promise<object>;
    thenUpdate(data: object, where?: object | string): Promise<object>;
    addMany(data: Array<object>, options?: object, replace?: boolean): Promise<Array<string>>;
    delete(options?: object): Promise<number>;
    update(data: object, options?: object): Promise<number>;
    updateMany(dataList: Array<object>, options?: object): Promise<any>;
    find(options?: object): Promise<any>;
    select(options?: object): Promise<any>;
    selectAdd(options?: object): Promise<any>;
    countSelect(options?: object, pageFlag?: boolean): Promise<Object>;
    getField(field: string, num?: boolean | number): Promise<object>;
    increment(field: string, step?: number): Promise<any>;
    decrement(field: string, step?: number): Promise<any>;
    count(field: string): Promise<number>;
    sum(field: string): Promise<number>;
    min(field: string): Promise<number>;
    max(field: string): Promise<number>;
    avg(field: string): Promise<number>;
    query(sqlOptions: object | string): Promise<any>;
    execute(sqlOptions: object): Promise<any>;
    parseSql(sqlOptions: object, ...args: Array<any>): object;
    setRelation(value: boolean): ThinkModel;
    setRelation(name: string, value?: boolean): ThinkModel;
    startTrans(): Promise<any>;
    commit(): Promise<any>;
    rollback(): Promise<any>;
    transaction(fn: Function): Promise<any>;
    add2(data: any, options?: any): Promise<any>;
    addMany2(dataList: any, options?: any): Promise<any>;
    update2(data: any, options?: any): Promise<any>;
    updateMany2(dataList: any, options?: any): Promise<any>;
    field2(field: any, filedOptions?: any): this;
    fieldReverse2(...other: any): this;
    where2(w: any): this;
    delete2(): Promise<any>;
    thenUpdate2(where: any, data: any, addData?: any): Promise<any>;
    thenAdd2(where: any, addData: any): Promise<boolean>;
    isTableExists(): Promise<any>;
    createTable(fields: IFields): Promise<any>;
    checkTable(fields: IFields): Promise<any>;
    checkIndex(indexName: string, columnNames: string[], options?: any): Promise<any>;
}
export declare const Model: any;
