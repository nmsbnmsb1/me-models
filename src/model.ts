// [think-model]https://github.com/thinkjs/think-model
// MIT License

// Copyright (c) 2016 ThinkJS

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import helper from 'think-helper';
import ThinkModel from 'think-model/lib/model';
import { DBUtils } from './DBUtils';

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

//think-model/index.d.ts
export interface IModel {
	new (modelName?: string, config?: object): ThinkModel;
	readonly HAS_MANY: number;
	readonly HAS_ONE: number;
	readonly BELONG_TO: number;
	readonly MANY_TO_MANY: number;
	/**
	 * get or set db
	 */
	db(db?: any): any;
	/**
	 * get or set all store models
	 */
	models: object;
	/**
	 * get table prefix
	 */
	readonly tablePrefix: string;
	/**
	 * get table name, with table prefix
	 */
	readonly tableName: string;
	/**
	 * get primary key
	 */
	readonly pk: string;
	/**
	 * get last sql
	 */
	readonly lastSql: string;
	/**
	 * get model instance
	 */
	model(name: string): ThinkModel;
	/**
	 * set cache options
	 */
	cache(key?: string, config?: object): ThinkModel;
	/**
	 * set limit options
	 */
	limit(offset?: Array<string | number> | number | string, length?: number | string): ThinkModel;
	/**
	 * set page options
	 */
	page(page?: Array<string | number> | number | string, listRows?: string | number): ThinkModel;
	/**
	 * set where options
	 * @return {} []
	 */
	where(where?: string | object): ThinkModel;
	/**
	 * set field options
	 */
	field(field?: string, reverse?: boolean): ThinkModel;
	/**
	 * set field reverse
	 */
	fieldReverse(field?: string): ThinkModel;
	/**
	 * set table name
	 */
	table(table?: string, hasPrefix?: boolean): ThinkModel;
	/**
	 * union options
	 */
	union(union?: string, all?: boolean): ThinkModel;
	/**
	 * join
	 */
	join(join?: string | Array<string> | object): ThinkModel;
	/**
	 * set order options
	 */
	order(value: string): ThinkModel;
	/**
	 * set table alias
	 */
	alias(value: string): ThinkModel;
	/**
	 * set having options
	 */
	having(value: string): ThinkModel;
	/**
	 * set group options
	 */
	group(value: string): ThinkModel;
	/**
	 * set lock options
	 */
	lock(value: boolean): ThinkModel;
	/**
	 * set auto options
	 */
	auto(value: string): ThinkModel;
	/**
	 * set distinct options
	 */
	distinct(data: any): ThinkModel;
	/**
	 * set explain
	 */
	explain(explain: string): ThinkModel;

	/**
	 * parse options, reset this.options to {}
	 * @param {Object} options
	 */
	parseOptions(options: any): Promise<any>;
	/**
	 * add data
	 */
	add(data: object, options?: object, replace?: boolean): Promise<string>;

	/**
	 * add data when not exist
	 * @return {}            []
	 */
	thenAdd(data: object, where?: object | string): Promise<object>;

	/**
	 * update data when exist, otherwise add data
	 * @return {id}
	 */
	thenUpdate(data: object, where?: object | string): Promise<object>;

	/**
	 * add multi data
	 */
	addMany(data: Array<object>, options?: object, replace?: boolean): Promise<Array<string>>;

	/**
	 * delete data
	 */
	delete(options?: object): Promise<number>;

	/**
	 * update data
	 */
	update(data: object, options?: object): Promise<number>;

	/**
	 * update all data
	 */
	updateMany(dataList: Array<object>, options?: object): Promise<any>;
	/**
	 * find data
	 */
	find(options?: object): Promise<any>;
	/**
	 * select
	 */
	select(options?: object): Promise<any>;
	/**
	 * select add
	 */
	selectAdd(options?: object): Promise<any>;
	/**
	 * count select
	 */
	countSelect(options?: object, pageFlag?: boolean): Promise<Object>;
	/**
	 * get field data
	 * if num is ture mean get one value
	 */
	getField(field: string, num?: boolean | number): Promise<object>;
	/**
	 * increment field data
	 */
	increment(field: string, step?: number): Promise<any>;

	/**
	 * decrement field data
	 * @return {} []
	 */
	decrement(field: string, step?: number): Promise<any>;

	/**
	 * get count
	 */
	count(field: string): Promise<number>;
	/**
	 * get sum
	 */
	sum(field: string): Promise<number>;
	/**
	 * get min value
	 */
	min(field: string): Promise<number>;
	/**
	 * get max valud
	 */
	max(field: string): Promise<number>;
	/**
	 * get value average
	 */
	avg(field: string): Promise<number>;
	/**
	 * query
	 */
	query(sqlOptions: object | string): Promise<any>;
	/**
	 * execute sql
	 */
	execute(sqlOptions: object): Promise<any>;
	/**
	 * parse sql
	 */
	parseSql(sqlOptions: object, ...args: Array<any>): object;

	/**
	 * false means disable all, true means enable all
	 */
	setRelation(value: boolean): ThinkModel;
	/**
	 * set relation
	 */
	setRelation(name: string, value?: boolean): ThinkModel;
	/**
	 * start transaction
	 */
	startTrans(): Promise<any>;
	/**
	 * commit transcation
	 */
	commit(): Promise<any>;
	/**
	 * rollback transaction
	 */
	rollback(): Promise<any>;
	/**
	 * transaction exec functions
	 * @param  {Function} fn [async exec function]
	 */
	transaction(fn: Function): Promise<any>;
	/**
	 * new add
	 */
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
	//
	isTableExists(): Promise<any>;
	createTable(fields: IFields): Promise<any>;
	checkTable(fields: IFields): Promise<any>;
	checkIndex(indexName: string, columnNames: string[], options?: any): Promise<any>;
}

ThinkModel.prototype.add2 = async function (data: any, options?: any) {
	if (data) {
		if (data.create_time === undefined) data.create_time = Date.now();
		if (data.update_time === undefined) data.update_time = data.create_time;
	}
	data.id = await this.add(data, options);
	return data;
};
ThinkModel.prototype.update2 = async function (data: any, options?: any) {
	if (data) {
		if (data.update_time === undefined) data.update_time = Date.now();
	}
	return this.update(data, options);
};

//对齐批量操作的字段
ThinkModel.prototype.addMany2 = async function (data: any, options?: any, replace?: boolean) {
	options = await this.parseOptions(options);
	let promises = data.map(async (item) => {
		/************************************************************/
		if (!item.create_time) item.create_time = Date.now();
		if (!item.update_time) item.update_time = Date.now();
		/************************************************************/
		item = await this.db().parseData(item, false, options.table);
		return this.beforeAdd(item, options);
	});
	let ndata = await Promise.all(promises);
	if (replace) {
		options.replace = replace;
	}
	const insertIds = await this.db().addMany(ndata, options);
	promises = ndata.map(async (item: any, i) => {
		item[this.pk] = insertIds[i];
		//添加pk字段
		data[i][this.pk] = insertIds[i];
		//
		return this.afterAdd(item, options);
	});
	await Promise.all(promises);
	return insertIds;
};
ThinkModel.prototype.updateMany2 = async function (dataList: any, options?: any) {
	let promises;
	let useBatch;
	const db = this.db();
	if (options && options.mode === 'temp_table' && db.updateMany2ByTempTable) {
		useBatch = db.updateMany2ByTempTable.bind(db);
	} else if (options && options.mode === 'case_when' && db.updateMany2ByCaseWhen) {
		useBatch = db.updateMany2ByCaseWhen.bind(db);
	}
	//
	if (useBatch) {
		dataList = dataList.slice();
		options = await this.parseOptions(options);
		const cols = await this.db().getSchema(options.table);
		const fm: { [fkey: string]: { options: any; dataList: any[]; key: string; keyType: 'unique' | 'primary'; fs: any; cols: any } } = {} as any;
		//归类要批量的更新
		while (dataList.length > 0) {
			for (let i = 0; i < dataList.length; i++) {
				const data = dataList[i];
				if (!data.update_time) data.update_time = Date.now();
				//
				let key = options && options.key ? options.key : '';
				let keyType = key ? 'primary' : '';
				let fs = [];
				let newData = {};
				//遍历对象的所有字段
				for (const f in data) {
					const col = cols[f];
					if (!col) continue;
					if (col.primary === true && (!key || keyType === 'unique')) {
						key = f;
						keyType = 'primary';
					} else if (col.unique === true && !key) {
						key = f;
						keyType = 'unique';
					}
					fs.push(f);
					//
					//newData[f] = data[f];
					if (col.readonly) continue;
					if (data[f] === undefined) continue;
					const isJSON = col.tinyType === 'json' && !(Array.isArray(data[f]) && /^exp$/i.test(data[f][0]));
					if (helper.isNumber(data[f]) || helper.isString(data[f]) || helper.isBoolean(data[f]) || isJSON) {
						newData[f] = db.schema.parseType(col.tinyType, data[f]);
					} else {
						newData[f] = data[f];
					}
				}
				if (!key) throw new Error('updateMany2 every data must contain primary/unique key');
				newData = db.schema.validateData(newData, cols);
				//newData = await this.beforeUpdate(newData, options);
				// check data is empty
				if (helper.isEmpty(newData)) {
					throw new Error(`update data is empty, original data is ${JSON.stringify(data)}`);
				}
				//
				const fkey = fs.sort().join(',');
				if (!fm[fkey]) fm[fkey] = { options, dataList: [], fs, cols } as any;
				const foptions = fm[fkey];
				foptions.dataList.push(newData);
				if (keyType === 'primary' && (!foptions.key || foptions.keyType === 'unique')) {
					foptions.key = key;
					foptions.keyType = keyType;
				} else if (keyType === 'unique' && !foptions.key) {
					foptions.key = key;
					foptions.keyType = keyType;
				}
				//
				dataList.splice(i, 1);
				i--;
			}
		}
		//选择更新的api
		promises = [];
		for (const fkey in fm) {
			promises.push(useBatch(fm[fkey]));
		}
	} else {
		//默认的更新api
		promises = dataList.map((data) => {
			return this.update(data, options);
		});
	}
	return Promise.all(promises);
};

ThinkModel.prototype.field2 = function (field: any, filedOptions?: any) {
	if (filedOptions) {
		this.field(DBUtils.getFieldsSql(field, filedOptions));
	} else {
		this.field(field);
	}
	return this;
};
ThinkModel.prototype.fieldReverse2 = function (...other: any) {
	this.fieldReverse(`create_time,update_time,delete_time${other ? ',' + other.join(',') : ''}`);
	return this;
};
ThinkModel.prototype.where2 = function (w: any) {
	if (helper.isString(w)) {
		if (w.indexOf('delete_time') < 0) {
			if (w !== '') w += ' and ';
			w += "delete_time='0'";
		}
	} else {
		if (!w) w = {};
		if (w.delete_time === undefined) w.delete_time = ['=', 0];
	}
	this.where(w);
	return this;
};
ThinkModel.prototype.delete2 = async function () {
	const nowMS = Date.now();
	return this.update({ delete_time: nowMS, update_time: nowMS });
};
ThinkModel.prototype.thenUpdate2 = async function (where: any, data: any, addData?: any) {
	let successNum = await (this.where(where) as any).update2(data);
	if (successNum <= 0) {
		await this.add2(addData || data);
		// successNum = 1;
	}
	return successNum;
};
ThinkModel.prototype.thenAdd2 = async function (where: any, addData: any) {
	const exists = !helper.isEmpty(await this.field('id').where(where).find());
	if (!exists) {
		await this.add2(addData);
	}
	return exists;
};

//
ThinkModel.prototype.isTableExists = async function () {
	return this.db().isTableExists ? this.db().isTableExists(this.modelName) : false;
};

ThinkModel.prototype.createTable = async function (fields: IFields) {
	return this.db().createTable ? this.db().createTable(this.modelName, fields) : false;
};

ThinkModel.prototype.checkTable = async function (fields: IFields) {
	return this.db().checkTable ? this.db().checkTable(this.modelName, fields) : false;
};

ThinkModel.prototype.checkIndex = async function (indexName: string, columnNames: string[], options?: any) {
	return this.db().checkIndex ? this.db().checkIndex(indexName, this.modelName, columnNames, options) : false;
};

export const Model = ThinkModel;
