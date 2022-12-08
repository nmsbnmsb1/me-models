//const AsyncLock = require('async-lock');
//const locker = new AsyncLock();
import { IModel } from './model';
import helper from 'think-helper';

//block
type DataFields = string | string[];
type ASFields = { [dataField: string]: string };
export interface IBlock {
	prefix?: string;
	ns: string;
	pkfield: string;
	dataFields: DataFields;
	hgetFields?: DataFields;
	asFields?: ASFields;
}
interface IFormatBlock extends IBlock {
	dataFields: '*' | string[];
	hgetFields?: '*' | string[];
	as?: (dataField: string) => string;
}
//lis
export interface ILisOptions {
	forcedb?: boolean;
	prefix?: string;
	ns: string;
	liname: string;
	orderfield: string;
	blocks: IBlock[];
	expire?: number;
}

//
let redisInstance: any;
let defaultExpire: number = 1 * 24 * 60 * 60;
let logger: any;

function formatOptions(options: { blocks: IBlock[]; expire?: number }) {
	if ((options as any).__formatted) return options;
	(options as any).__formatted = true;
	//
	for (let block of options.blocks) {
		//dataFields
		if (helper.isString(block.dataFields) && block.dataFields !== '*') block.dataFields = (block.dataFields as string).split(',');
		//hgetFields
		if (!block.hgetFields) block.hgetFields = block.dataFields === '*' ? '*' : block.dataFields.slice();
		else if (helper.isString(block.hgetFields) && block.dataFields !== '*') block.hgetFields = (block.hgetFields as any).split(',');
		//asFields
		if (block.asFields) {
			let asf = block.asFields;
			for (let f in asf) asf[asf[f]] = f;
			(block as any).as = (f) => (asf && asf[f] ? asf[f] : f);
		}
	}
	//expire
	if (options.expire === undefined) options.expire = defaultExpire;
	//
	return options;
}
function write(data: any) {
	if (data === null) return 'null';
	if (helper.isNumber(data)) return `i/${data}`;
	return data;
}
function read(redisData: any) {
	if (redisData === 'null') return null;
	if (redisData.startsWith('i/')) return parseInt(redisData.substring(2), 10);
	return redisData;
}

//Redis
export class Redis {
	//init
	public static init(instance: any, de: number, l: any) {
		redisInstance = instance;
		defaultExpire = de;
		logger = l;
	}

	// 缓存数据
	public static async cdata(
		data: any,
		options: { prefix?: string; ns: string; pkfield: string; asFields?: ASFields; expire?: number },
		pipelineInstance?: any
	) {
		return Redis.cdatas([data], options, pipelineInstance);
	}
	public static async cdatas(
		datas: any[],
		options: { prefix?: string; ns: string; pkfield: string; asFields?: ASFields; expire?: number },
		pipelineInstance?: any
	) {
		return Redis.clidata(datas, { blocks: [{ ...options, dataFields: '*' }], expire: options.expire }, pipelineInstance);
	}
	public static async clidata(listdata: any[] | { count: number; data: any[] }, options: { blocks: IBlock[]; expire?: number }, pipelineInstance?: any) {
		let { blocks, expire } = formatOptions(options as any) as { blocks: IFormatBlock[]; expire: number };
		//
		let list = helper.isArray(listdata) ? listdata : (listdata as any).data;
		let pipeline = pipelineInstance || redisInstance.pipeline();
		for (let data of list) {
			for (let { prefix, ns, pkfield, dataFields, as } of blocks) {
				let dkey = `${prefix || 'data'}:${ns}:${data[pkfield]}`;
				for (let f in data) {
					if (dataFields !== '*' && dataFields.indexOf(f) < 0) continue;
					//
					pipeline.hset(dkey, as ? as(f) : f, write(data[f]));
					pipeline.pexpire(dkey, expire);
				}
			}
		}
		if (!pipelineInstance) await pipeline.exec();
	}
	public static async cli(listdata: any[] | { count: number; data: any[] }, options: ILisOptions, pipelineInstance?: any) {
		const { prefix, ns, liname, orderfield, blocks, expire } = formatOptions(options) as ILisOptions & { blocks: IFormatBlock[] };
		//
		let likey = `${prefix || 'list'}:${ns}:${liname}`;
		let list = helper.isArray(listdata) ? listdata : (listdata as any).data;
		//缓存列表
		let pipeline = pipelineInstance || redisInstance.pipeline();
		if (list.length > 0) {
			for (let data of list) {
				if (!data[orderfield]) throw new Error(`order is empty, orderfield: ${orderfield}, value: ${data[orderfield]}`);
				//
				let pkvalues = {};
				for (let { prefix, ns, pkfield, dataFields, as } of blocks) {
					let pkvalue = data[pkfield];
					//
					pkvalues[pkfield] = pkvalue;
					//
					//console.log(ns, '---------------');
					let dkey = `${prefix || 'data'}:${ns}:${pkvalue}`;
					for (let f in data) {
						if (dataFields !== '*' && dataFields.indexOf(f) < 0) continue;
						//console.log(dkey, as(f), write(data[f]));
						pipeline.hset(dkey, as ? as(f) : f, write(data[f]));
						pipeline.pexpire(dkey, expire);
					}
				}
				//
				pipeline.zadd(likey, data[orderfield], JSON.stringify(pkvalues));
			}
		} else {
			pipeline.zadd(likey, 0, '{}');
		}
		//
		pipeline.pexpire(likey, expire);
		//
		if (!pipelineInstance) await pipeline.exec();
	}
	public static async cliIfExists(listdata: any[] | { count: number; data: any[] }, options: ILisOptions, pipelineInstance?: any) {
		if (await Redis.cexistsLi(options)) return Redis.cli(listdata, options, pipelineInstance);
	}

	//删除数据
	public static async cdel(key: string, pipelineInstance?: any) {
		if (logger) logger.warn(`delete key: ${key}`);
		!pipelineInstance ? await redisInstance.del(key) : pipelineInstance.del(key);
	}
	public static async cdeldata({ prefix, ns, pkvalue }: { prefix?: string; ns: string; pkvalue: any }, pipelineInstance?: any) {
		return Redis.cdel(`${prefix || 'data'}:${ns}:${pkvalue}`, pipelineInstance);
	}
	public static async cdellidata({ prefix, ns, liname, ordervalue }: { prefix?: string; ns: string; liname: string; ordervalue: any }, pipelineInstance?: any) {
		let likey = `${prefix || 'list'}:${ns}:${liname}`;
		if (logger) logger.warn(`delete key: ${likey},range: ${ordervalue} - ${ordervalue}`);
		!pipelineInstance ? await redisInstance.zremrangebyscore(likey, ordervalue, ordervalue) : pipelineInstance.zremrangebyscore(likey, ordervalue, ordervalue);
	}
	public static async cdelli(
		options: { prefix?: string; ns: string; liname: string; blocks?: { prefix?: string; ns: string; pkfield?: string }[] },
		delAll = false,
		onLiKeyNotFound?: () => Promise<any[]>,
		pipelineInstance?: any
	) {
		let { prefix, ns, liname, blocks } = options;
		let likey = `${prefix || 'list'}:${ns}:${liname}`;
		//
		let pipeline = pipelineInstance || redisInstance.pipeline();
		if (delAll) {
			let pkvalues = await redisInstance.zrange(likey, 0, -1);
			if (pkvalues.length <= 1 && pkvalues[0] === '{}') pkvalues = undefined;
			if (helper.isEmpty(pkvalues) && onLiKeyNotFound) pkvalues = await onLiKeyNotFound();
			if (!helper.isEmpty(pkvalues)) {
				for (let pkvalue of pkvalues) {
					if (helper.isString(pkvalue) && pkvalue.startsWith('{')) pkvalue = JSON.parse(pkvalue);
					//
					for (let { prefix, ns, pkfield } of blocks) {
						if (pkfield) {
							if (logger) logger.warn(`delete key: ${prefix || 'data'}:${ns}:${pkvalue[pkfield]}`);
							pipeline.del(`${prefix || 'data'}:${ns}:${pkvalue[pkfield]}`);
						} else {
							for (let pkfield in pkvalue) {
								if (logger) logger.warn(`delete key: ${prefix || 'data'}:${ns}:${pkvalue[pkfield]}`);
								pipeline.del(`${prefix || 'data'}:${ns}:${pkvalue[pkfield]}`);
							}
						}
					}
				}
			}
		}
		pipeline.del(likey);
		if (logger) logger.warn(`delete key: ${likey}`);
		//
		if (!pipelineInstance) await pipeline.exec();
	}

	//检查key
	public static async cexists(key: string) {
		return redisInstance.exists(key);
	}
	public static async cexistsData({ prefix, ns, pkvalue }: { prefix?: string; ns: string; pkvalue: any }) {
		return redisInstance.exists(`${prefix || 'data'}:${ns}:${pkvalue}`);
	}
	public static async cexistsLi({ prefix, ns, liname }: { prefix?: string; ns: string; liname: string }) {
		return redisInstance.exists(`${prefix || 'list'}:${ns}:${liname}`);
	}

	//延长时限
	public static async cexpire(expire: number, key: string, pipelineInstance?: any) {
		!pipelineInstance ? await redisInstance.pexpire(key, expire || defaultExpire) : pipelineInstance.pexpire(key, expire || defaultExpire);
	}
	public static async cexpireData(expire: number, { prefix, ns, pkvalue }: { prefix?: string; ns: string; pkvalue: any }, pipelineInstance?: any) {
		return Redis.cexpire(expire, `${prefix || 'data'}:${ns}:${pkvalue}`, pipelineInstance);
	}
	public static async cexpireLi(expire, { prefix, ns, liname }: { prefix?: string; ns: string; liname: string }, pipelineInstance?: any) {
		return Redis.cexpire(expire, `${prefix || 'list'}:${ns}:${liname}`, pipelineInstance);
	}

	//sel
	public static async rsel(
		dataPkvalues: { [pkfield: string]: string }[],
		options: {
			forcedb?: boolean;
			blocks: (IBlock & { sel?: (missPkvalues, pkfield) => Promise<any> })[];
			expire?: number;
		}
	) {
		const { forcedb, blocks, expire } = formatOptions(options as any) as {
			forcedb?: boolean;
			blocks: (IFormatBlock & { sel?: (missPkvalues, pkfield) => Promise<any> })[];
			expire?: number;
		};
		//   return locker
		//     .acquire(`rsel:li:${options.id}`, () => Redis._rsel(options))
		//     .then((ret) => ret)
		//     .catch((err) => {
		//       console.log(err.message); // output: error
		//     });
		// }
		// static async _rsel(options) {
		//
		//计算从不同的缓存中要获取的字段
		let datas = [];
		let missPipeline;
		for (let { prefix, ns, pkfield, dataFields, hgetFields, asFields, as, sel } of blocks) {
			let missPkvalues = [];
			let missPkvaluesMap = {};
			//
			if (forcedb) {
				for (let i = 0; i < dataPkvalues.length; i++) {
					let pkvalue = dataPkvalues[i][pkfield];
					if (!pkvalue) return;
					//
					missPkvalues.push(pkvalue);
					missPkvaluesMap[pkvalue] = datas[i] = {};
				}
			} else {
				let pipeline = redisInstance.pipeline();
				//
				let readFields = hgetFields;
				if (asFields) {
					readFields = [];
					for (let f of hgetFields) readFields.push(as(f));
				}
				//
				for (let i = 0; i < dataPkvalues.length; i++) {
					let pkvalue = dataPkvalues[i][pkfield];
					if (!pkvalue) return;
					//
					let data = datas[i] || (datas[i] = {});
					pipeline.hmget(`${prefix || 'data'}:${ns}:${pkvalue}`, ...readFields, (err, result) => {
						//缓存数据完整性检测
						let isFull = true;
						if (err) {
							isFull = false;
						} else {
							for (let k = 0; k < hgetFields.length; k++) {
								if (result[k] === null) {
									//如果有一个字段为null，说明数据不完整
									isFull = false;
								} else {
									data[hgetFields[k]] = read(result[k]);
								}
							}
						}
						//如果缓存数据不完整
						if (isFull === false) {
							missPkvalues.push(pkvalue);
							missPkvaluesMap[pkvalue] = data;
						}
					});
				}
				//
				await pipeline.exec();
			}
			if (helper.isEmpty(missPkvalues)) continue;
			if (!sel) return;
			// TODO
			// 如果有未匹配到的缓存
			let missData = await sel(missPkvalues, pkfield);
			if (helper.isEmpty(missData)) continue;
			if (!helper.isArray(missData)) missData = [missData];
			//缓存数据，并设置字段
			if (!missPipeline) missPipeline = redisInstance.pipeline();
			for (const md of missData) {
				//填充入缓存
				let mdkey = `${prefix || 'data'}:${ns}:${md[pkfield]}`;
				for (let f in md) {
					if (dataFields !== '*' && dataFields.indexOf(f) < 0) continue;
					//
					missPipeline.hset(mdkey, as ? as(f) : f, write(md[f]));
				}
				missPipeline.pexpire(mdkey, expire);
				//填充本地数据
				let d = missPkvaluesMap[md[pkfield]];
				if (d) {
					for (let f in md) {
						if (hgetFields.indexOf(f) >= 0) d[f] = md[f];
					}
				}
			}
		}
		if (missPipeline) missPipeline.exec();
		//
		// {
		//   // TODO先找没有被引用的pkfield
		//   let tmp = {};
		//   let tmpBlocks = blocks.slice();
		//   for (let { pkfield } of blocks) {
		//     if (tmp[pkfield] === undefined) tmp[pkfield] = 0;
		//     for (let { hgetFields } of tmpBlocks) {
		//       if (hgetFields.indexOf(pkfield) >= 0) tmp[pkfield]++;
		//     }
		//   }
		//   //console.log(tmp);
		//   for (let pkfield in tmp) {
		//     if (tmp[pkfield] > 0) continue;
		//     for (let d of datas) {
		//       if (d) {
		//         delete d[pkfield];
		//       }
		//     }
		//   }
		// }
		//
		return datas;
	}
	public static async rfind(
		dataPkvalue: string | { [pkfield: string]: string },
		options: {
			forcedb?: boolean;
			blocks: (IBlock & { sel: (missPkvalues, pkfield) => Promise<any> })[];
			expire?: number;
			dataChecker?: (data) => boolean | { [field: string]: any };
		}
	) {
		if (!helper.isObject(dataPkvalue)) dataPkvalue = { [options.blocks[0].pkfield]: dataPkvalue } as any;
		let datas = await Redis.rsel([dataPkvalue as any], options);
		if (!datas) return undefined;
		//
		let data = datas[0];
		let { dataChecker } = options;
		if (helper.isFunction(dataChecker)) {
			return !dataChecker(data) ? undefined : data;
		}
		if (helper.isObject(dataChecker)) {
			let valid = true;
			for (let f in dataChecker) {
				if (data[f] !== dataChecker[f]) {
					valid = false;
					break;
				}
			}
			return !valid ? undefined : data;
		}
		//
		return data;
	}
	public static async rlidb(
		options: ILisOptions & {
			page: number;
			pageSize: number;
			sel: (options) => any[] | { count: number; totalPages: number; pageSize: number; page: number; data: any[] };
		}
	) {
		let {
			sel,
			blocks,
			page = 1,
			pageSize = 0,
		} = formatOptions(options) as ILisOptions & {
			page: number;
			pageSize: number;
			sel: (options) => any[] | { count: number; totalPages: number; pageSize: number; page: number; data: any[] };
		};
		// const ms = Date.now();
		//拉取数据
		let data = await sel(options);
		await Redis.cli(data, options);

		//有的时候 sel获得的数据与指定的数据长度不一致
		//只考虑sel返回全部，list返回部分
		let pageData: { count: number; totalPages: number; pageSize: number; page: number; data: any[] } = helper.isArray(data)
			? { count: (data as any[]).length, totalPages: 1, pageSize: 0, page: 1, data: data as any[] }
			: (data as any);
		if (pageData.pageSize === 0 && pageData.pageSize !== pageSize) {
			pageData.pageSize = pageSize;
			pageData.totalPages = Math.ceil(pageData.count / pageSize);
			pageData.page = page <= pageData.totalPages ? page : pageData.totalPages;
			let from = (pageData.page - 1) * pageData.pageSize;
			pageData.data = pageData.data.slice(from, from + pageData.pageSize);
		}

		//裁切字段
		for (let i = 0; i < pageData.data.length; i++) {
			let d = pageData.data[i];
			pageData.data[i] = {};
			for (let { hgetFields } of blocks) {
				for (const f of hgetFields) {
					pageData.data[i][f] = d[f];
				}
			}
		}
		//
		return pageData;
	}
	public static async rli(
		options: ILisOptions & {
			blocks: (IBlock & { sel: (missPkvalues, pkfield) => Promise<any> })[];
			sel: (options) => object[] | { count: number; totalPages: number; pageSize: number; page: number; data: object[] };
			page: number;
			pageSize: number;
			order: string;
		}
	) {
		if (options.forcedb) {
			//先删除旧列表
			await Redis.cdelli({ prefix: options.prefix, ns: options.ns, liname: options.liname }, false);
			//
			return Redis.rlidb(options);
		}
		//
		const {
			prefix,
			ns,
			liname,
			page = 1,
			pageSize = 0,
			order = 'asc',
		} = formatOptions(options) as ILisOptions & {
			blocks: (IBlock & { sel: (missPkvalues, pkfield) => Promise<any> })[];
			sel: (options) => object[] | { count: number; totalPages: number; pageSize: number; page: number; data: object[] };
			page: number;
			pageSize: number;
			order: string;
		};
		//
		//   return locker
		//     .acquire(`${options.ns}:li:${options.id}`, () => Redis._rli(options))
		//     .then((ret) => ret)
		//     .catch((err) => {
		//       console.log(err.message); // output: error
		//     });
		// }
		// static async _rli(options) {
		//
		// 获取list总数缓存
		let likey = `${prefix || 'list'}:${ns}:${liname}`;
		if (!(await Redis.cexists(likey))) {
			if (logger) logger.warn(`${likey} not exists, fetch from db`);
			return Redis.rlidb(options);
		}
		// 尝试从缓存中读取
		let count = await redisInstance.zcard(likey);
		if (count <= 0) {
			return { count: 0, totalPages: 1, pageSize, page: 1, data: [] };
		}
		//
		let start = 0;
		let end = -1;
		if (pageSize > 0) {
			start = (page - 1) * pageSize;
			end = start + pageSize - 1;
			// 超过范围了
			if (start >= count) return { count, totalPages: Math.ceil(count / pageSize), pageSize, page: page, data: [] };
			if (end >= count) end = count - 1;
		}
		//
		let datas;
		let dataPkvalues = order === 'asc' ? await redisInstance.zrange(likey, start, end) : await redisInstance.zrevrange(likey, start, end);
		if (!helper.isEmpty(dataPkvalues) && dataPkvalues.length <= 1 && dataPkvalues[0] === '{}') {
			return { count: 0, totalPages: 0, pageSize, page, data: [] };
		}
		//
		if (!helper.isEmpty(dataPkvalues)) {
			for (let i = 0; i < dataPkvalues.length; i++) dataPkvalues[i] = JSON.parse(dataPkvalues[i]);
			datas = await Redis.rsel(dataPkvalues, options);
		}
		if (!datas) {
			if (logger) logger.warn(`${likey} datas is empty, fetch from db`);
			return Redis.rlidb(options);
		}
		return { count, totalPages: pageSize <= 0 ? 1 : Math.ceil(count / pageSize), pageSize, page, data: datas };
	}
	public static async rdatadb(options: {
		sel: (options) => object[] | { count: number; totalPages: number; pageSize: number; page: number; data: object[] };
		blocks: (IBlock & { sel: (missPkvalues, pkfield) => Promise<any> })[];
		expire?: number;
	}) {
		let { sel, blocks } = formatOptions(options) as {
			sel: (options) => object[] | { count: number; totalPages: number; pageSize: number; page: number; data: object[] };
			blocks: (IBlock & { sel: (missPkvalues, pkfield) => Promise<any> })[];
			expire?: number;
		};
		// const ms = Date.now();
		//拉取数据
		let data = await sel(options);
		await Redis.clidata(data, options);

		//裁切字段
		let pageData: { count: number; totalPages: number; pageSize: number; page: number; data: any[] } = helper.isArray(data)
			? { count: (data as any[]).length, totalPages: 1, pageSize: 0, page: 1, data: data as any[] }
			: (data as any);
		for (let i = 0; i < pageData.data.length; i++) {
			let d = pageData.data[i];
			pageData.data[i] = {};
			for (let { hgetFields } of blocks) {
				for (const f of hgetFields) {
					pageData.data[i][f] = d[f];
				}
			}
		}
		//
		return pageData;
	}

	//
	public static async rupdateOne(
		{ t, where, updateData }: { t: IModel; where: any; updateData: any },
		currentData: any,
		options: { prefix?: string; ns: string; pkfield: string; asFields?: ASFields; expire?: number } | ((updateData, currentData) => Promise<any>)
	) {
		const success = await t.where(where).update2(updateData);
		if (success <= 0) return false;
		//更新当前的对象
		if (currentData) {
			for (let f in updateData) currentData[f] = updateData[f];
		}
		//更新缓存
		if (!helper.isFunction(options)) {
			let { pkfield } = options as any;
			if (updateData[pkfield] === undefined) {
				if (currentData && currentData[pkfield] !== undefined) updateData[pkfield] = currentData[pkfield];
				else if (helper.isString(where[pkfield]) || helper.isNumber(where[pkfield])) updateData[pkfield] = where[pkfield];
			}
			if (updateData[pkfield] !== undefined) {
				await Redis.cdata(updateData, options as any);
			}
		} else if (options) {
			await (options as any)(updateData, currentData);
		}
		//
		return currentData || updateData;
	}
	public static async rdelOne({ t, where, updateData }: { t: IModel; where: any; updateData: any }, options: { prefix?: string; ns: string; pkvalue: any }) {
		if (!updateData) updateData = {};
		//
		updateData.update_time = updateData.delete_time = Date.now();
		let success = await t.where2(where).update2(updateData);
		if (success <= 0) return false;
		//
		await Redis.cdeldata(options);
	}
}
