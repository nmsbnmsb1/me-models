import helper from 'think-helper';
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

export class DBUtils {
	//
	public static escapeString(str: string) {
		if (!str) return '';
		// str = mysql.escape(str);

		// eslint-disable-next-line no-control-regex
		return str.replace(/[\0\n\r\b\t\\'"\x1a]/g, (s: string) => {
			switch (s) {
				case '\0':
					return '\\0';
				case '\n':
					return '\\n';
				case '\r':
					return '\\r';
				case '\b':
					return '\\b';
				case '\t':
					return '\\t';
				case '\x1a':
					return '\\Z';
				default:
					return '\\' + s;
			}
		});
	}
	public static toBoolean(b: any) {
		if (helper.isNumber(b)) return b === 0 ? 0 : 1;
		if (helper.isBoolean(b)) return b === true ? 1 : 0;
		return b ? 1 : 0;
	}
	public static formatSql(sql: string) {
		return sql.replace(/[\r\n]/g, '').replace(/\s+/g, ' ');
	}
	// 原生查询
	public static async doSql(model: IModel, sql: string) {
		return model.query(`${DBUtils.formatSql(sql)}`);
	}

	// public static filterEmpty(fields: any) {
	//   for (const n in fields) {
	//     const v = fields[n];
	//     if (helper.isEmpty(v)) {
	//       delete fields[n];
	//     } else if (helper.isArray(v)) {
	//       for (let i = 0; i < v.length; i++) if (helper.isEmpty(v[i])) v.splice(i, 1);
	//       if (v.length <= 0) delete fields[n];
	//     }
	//   }
	//   return helper.isEmpty(fields) ? undefined : fields;
	// }

	//db

	public static getTableConfig(
		name: string,
		fields: { [field: string]: ITFieldOptions },
		index: { [ixn: string]: IIndex } = {},
		nsdata: { ns: string; pkfield: string },
		nslist: { [name: string]: { ns: string; orderfield: string } } = {},
		nsref: { [name: string]: { ns: string; orderfield?: string } } = {}
	) {
		let all: any = {
			name,
			config: { id: true, ...fields, sp: true },
			index,
			//handle data
			fillDefaultData: (data: any) => DBUtils.fillDefaultData(data, all.config),
			cropData: (data: any, fields?: string | string[], ignores?: string | string[]) => DBUtils.cropData(data, fields || all.common, ignores),
			//handle fields
			modify: (options: { [name: string]: boolean | 'override' }, fields?: string | string[]) => DBUtils.modifyFields(fields || all.preset, options),
			full: `id,${Object.keys(fields).join(',')},create_time,update_time,delete_time`,
			preset: Object.keys(fields).join(','),
			common: Object.keys(fields)
				.filter((f) => fields[f].common !== false)
				.join(','),
			//
			nsdata,
			nslist,
			nsref,
		};
		//其他的分类字段
		for (let field in fields) {
			for (let k in fields[field]) {
				if (!k.startsWith('tag_')) continue;
				if (!fields[field][k]) continue;
				//
				let tag = k.substring(4);
				all[tag] = `${!all[tag] ? '' : `${all[tag]},`}${field}`;
			}
		}
		//
		return all;
	}
	public static fillDefaultData(data: any, dbconfig: any) {
		for (const fc in dbconfig) {
			if (data[fc] !== undefined) continue;
			//
			if (fc === 'id') {
				data[fc] = null;
			} else if (fc === 'sp') {
				if (data.create_time === undefined) data.create_time = 0;
				if (data.update_time === undefined) data.update_time = 0;
				if (data.delete_time === undefined) data.delete_time = 0;
			} else {
				data[fc] = dbconfig[fc].default !== undefined ? dbconfig[fc].default : null;
			}
		}
		return data;
	}
	public static cropData(data: any, fields: string | string[], ignores: string | string[]) {
		if (helper.isString(fields)) fields = (fields as string).split(',');
		if (helper.isString(ignores)) ignores = (ignores as string).split(',');
		//
		for (let k in data) {
			if (ignores && ignores.indexOf(k) >= 0) continue;
			if (fields.indexOf(k) < 0) delete data[k];
		}
		//
		return data;
	}
	public static modifyFields(fields: string | string[], options: { [name: string]: boolean | 'override' }) {
		let fs: string[];
		if (helper.isString(fields)) {
			fs = (fields as string).split(',');
		} else {
			fs = (fields as string[]).slice();
		}
		// for (let i = 0; i < fs.length; i++) {
		//   fs[i] = fs[i].replace(/[\r\n]/g, '').trim();
		// }
		// console.log(fields);
		if (options) {
			for (const n in options) {
				const tmp = n.split(',');
				if (options[n] === 'override') {
					fs = tmp;
					break;
				}
				//
				let b = options[n];
				for (const f of tmp) {
					let index = fs.indexOf(f);
					if (b === true && index < 0) fs.push(f);
					if (!b && index >= 0) fs.splice(index, 1);
				}
			}
		}
		// console.log(fields);
		return fs;
	}
	public static getFieldsSql(fields: string | string[], options: { [name: string]: boolean | 'override' }) {
		return DBUtils.modifyFields(fields, options).join(',');
	}

	//分页查询
	public static aliasFields(alias: string, fields: string | string[]) {
		let tfs = helper.isString(fields) ? (fields as string).split(',') : (fields as string[]);
		for (let i = 0; i < tfs.length; i++) tfs[i] = `${alias}.${tfs[i]}`;
		return tfs;
	}
	public static asFields(alias?: string, defaultAs?: string | string[], sp: boolean = true, customAs?: { [f: string]: string }) {
		let as: { [f: string]: string } = {};
		//
		if (sp && alias) {
			as.id = `${alias}_id`;
			as.create_time = `${alias}_create_time`;
			as.update_time = `${alias}_update_time`;
			as.delete_time = `${alias}_delete_time`;
		}
		if (defaultAs && alias) {
			let das: string[] = helper.isString(defaultAs) ? (defaultAs as string).split(',') : (defaultAs as string[]);
			for (let da of das) as[da] = `${alias}_${da}`;
		}
		if (customAs) {
			for (let f in customAs) as[f] = customAs[f];
		}
		//
		return as;
	}
	public static getFieldsObject(
		alias: string = '',
		fields: string | string[],
		defaultAs?: string | string[] | true,
		sp: boolean = false,
		customAs?: { [f: string]: string },
		hget?: string | string[],
		hgetOptions?: any
	) {
		let tfs: '*' | string[] = fields as any;
		if (helper.isString(fields) && fields !== '*') tfs = (fields as string).split(',');
		let tas = tfs === '*' ? {} : DBUtils.asFields(alias, defaultAs === true ? fields : defaultAs, sp, customAs);
		let hgfs;
		if (hget) {
			if (!hgetOptions) hgfs = helper.isString(hget) ? (hget as string).split(',') : (hget as string[]);
			else hgfs = DBUtils.modifyFields(hget, hgetOptions);
		}
		//
		let dataFields;
		if (tfs === '*') {
			dataFields = '*';
			hget = hgfs;
		} else {
			dataFields = [];
			hget = [];
			for (let i = 0; i < tfs.length; i++) {
				let f = tfs[i];
				let tf = tfs[i];
				let df = tfs[i];
				//
				if (tas[f]) {
					df = tas[f];
					tf = `${f} as ${tas[f]}`;
				}
				if (alias) tf = `${alias}.${tf}`;
				//
				tfs[i] = tf;
				dataFields.push(df);
				if (!hgfs || hgfs.indexOf(f) >= 0) hget.push(df);
			}
		}
		//
		return { alias, tfields: tfs, dataFields, hgetFields: hget, asFields: tas };
	}

	//
	public static getLeftJoinSql(
		pageSize: number,
		{
			countField,
			tables,
			where,
			order,
		}: {
			countField?: string;
			tables?: {
				t: string;
				alias?: string;
				//
				tfields?: string | string[];
				fields?: {
					fs: string | string[];
					mopts?: { [name: string]: boolean | 'override' };
					sp?: boolean;
					defaultAs?: string | string[];
					customAs?: { [f: string]: string };
				};
				on?: string;
				keep?: boolean;
			}[];
			where?: string | string[];
			order?: string;
		}
	) {
		if (helper.isArray(where)) where = (where as string[]).join(' and ');
		//
		let allFields = [];
		let from = '';
		for (let { t, alias, tfields, fields, on, keep } of tables) {
			//设置表名
			t = `${t}${alias ? ` as ${alias}` : ''}`;
			//设置字段
			let tfs: any = tfields;
			if (!tfs) {
				let { fs, mopts, sp, defaultAs, customAs } = fields;
				tfs = DBUtils.modifyFields(fs, mopts);
				if (alias) {
					//设置as
					let as = DBUtils.asFields(alias, defaultAs, sp, customAs);
					for (let i = 0; i < tfs.length; i++) {
						let f = tfs[i];
						if (as[f]) f = `${f} as ${as[f]}`;
						if (alias) f = `${alias}.${f}`;
						tfs[i] = f;
					}
				}
			}
			helper.isString(tfs) ? allFields.push(tfs) : allFields.push(...tfs);
			//
			//设置from
			if (
				keep === true ||
				!alias ||
				//on ||
				(tfs && tfs.length > 0) ||
				where.indexOf(`${alias}.`) >= 0 ||
				(order && order.indexOf(`${alias}.`) >= 0) ||
				(pageSize > 0 && countField && countField.indexOf(`${alias}.`) >= 0)
			) {
				if (from === '') {
					from = t;
				} else {
					from = `(${from}) left join ${t} on ${on}`;
				}
			}
		}
		return `select ${allFields.join(',')} from ${from} ${where ? `where ${where}` : ''} ${order ? `order by ${order}` : ''}`;
	}
	public static async count(model: IModel, countField: string, sql: string) {
		sql = DBUtils.formatSql(sql);
		let totalCount;
		const countData = await model.query(`select COUNT(a.${countField}) as count from (${sql}) as a`);
		if (helper.isEmpty(countData) || countData.length === 0 || countData[0].count <= 0) {
			totalCount = 0;
		} else {
			totalCount = countData[0].count;
		}
		return totalCount;
	}
	public static async doPage(model: IModel, page: number, pageSize: number, countField: string, sql: string) {
		sql = DBUtils.formatSql(sql);
		//
		let totalCount;
		let rs;
		if (pageSize > 0) {
			const countData = await model.query(`select COUNT(${countField}) as count from (${sql}) as a`);
			if (helper.isEmpty(countData) || countData.length === 0 || countData[0].count <= 0) {
				totalCount = 0;
			} else {
				totalCount = countData[0].count;
				rs = await model.query(`${sql} limit ${(page - 1) * pageSize},${pageSize}`);
			}
		} else {
			rs = await model.query(`${sql}`);
			totalCount = rs.length;
		}
		return {
			count: totalCount,
			totalPages: pageSize <= 0 ? 1 : Math.ceil(totalCount / pageSize),
			pageSize,
			page,
			data: rs || [],
		};
	}
	public static async doPageByConfig(
		model: IModel,
		page: number,
		pageSize: number,
		config: {
			countField?: string;
			tables?: {
				t: string;
				alias?: string;
				//
				tfields?: string | string[];
				fields?: {
					fs: string | string[];
					mopts?: { [name: string]: boolean | 'override' };
					sp?: boolean;
					defaultAs?: string | string[];
					customAs?: { [f: string]: string };
				};
				on?: string;
				keep?: boolean;
			}[];
			where?: string | string[];
			order?: string;
		}
	) {
		return DBUtils.doPage(model, page, pageSize, config.countField, DBUtils.getLeftJoinSql(pageSize, config));
	}

	// 预制查询
	// 查找重复记录
	public static async checkDup(model: IModel, where: { [name: string]: string | string[] }, exclude: { [name: string]: any }, detail = false) {
		let result;
		//
		const f = [];
		const or = {};
		for (const n in where) {
			// const v = where[n];
			// if (helper.isArray(v)) {
			//   f.push(n);
			//   or[n] = ['in', v];
			// } else {
			//   f.push(n);
			//   or[n] = v;
			// }
			f.push(n);
			or[n] = where[n];
		}
		//
		const sql = model.field(f.join(',')).where({ ...exclude, _complex: { ...or, _logic: 'or' } });
		if (detail) {
			// 返回查找到的所有数据
			result = await sql.select();
		} else {
			// 仅检查相同的字段,返回重复的字段名
			result = await sql.find();
			if (!helper.isEmpty(result)) {
				for (const n in result) {
					if (result[n] === where[n]) return n;
					//if (helper.isArray(fields[n]) && fields[n].indexOf(result[n]) >= 0) return n;
				}
				return 'field';
			}
			result = undefined;
		}
		return result;
	}

	//获取db-redis关联对象
	public static getDRObject(options: {
		fields: {
			alias?: string;
			t: any;
			tfields?: any;
			hget: string;
			hgetOptions?: any;
			on?: string;
			//
			pkfield?: string;
			sp?: boolean;
			customAs?: { [f: string]: string };
		}[];
		where: string[];
		order: string;
		nslis?: string | { t: any; name: string } | { ns: string; orderfield: string };
	}) {
		let { fields: fs, where, order, nslis } = options;
		//
		let fields = {};
		let tables = [];
		let blocks = [];
		for (let i = 0; i < fs.length; i++) {
			let { alias, t, tfields, hget, hgetOptions, on, pkfield, sp = false, customAs = undefined } = fs[i];
			let field = DBUtils.getFieldsObject(alias, tfields || t.full, i === 0 ? undefined : true, sp, customAs, hget, hgetOptions);
			let table = { t: t.name, ...field, on };
			let block = { ...t.nsdata, ...field };
			if (pkfield) block.pkfield = pkfield;
			else if (i > 0) block.pkfield = `${alias}_${t.nsdata.pkfield}`;
			//
			fields[`${alias}Field`] = field;
			tables.push(table);
			blocks.push(block);
		}
		//
		let ns: { ns: string; orderfield: string };
		if (nslis) {
			if (helper.isString(nslis)) ns = { ...fs[0].t.nslist[nslis as string] };
			else if ((nslis as any).t) {
				let { t, name } = nslis as any;
				ns = { ...t.nslist[name] };
			} else {
				ns = nslis as any;
			}
		}
		//
		//console.log(blocks);
		return { ...fields, tables, where, order, nslis: ns, blocks };
	}
}
