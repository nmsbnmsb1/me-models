"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redis = void 0;
const think_helper_1 = __importDefault(require("think-helper"));
let redisInstance;
let defaultExpire = 1 * 24 * 60 * 60;
let logger;
function formatOptions(options) {
    if (options.__formatted)
        return options;
    options.__formatted = true;
    for (let block of options.blocks) {
        if (think_helper_1.default.isString(block.dataFields) && block.dataFields !== '*')
            block.dataFields = block.dataFields.split(',');
        if (!block.hgetFields)
            block.hgetFields = block.dataFields === '*' ? '*' : block.dataFields.slice();
        else if (think_helper_1.default.isString(block.hgetFields) && block.dataFields !== '*')
            block.hgetFields = block.hgetFields.split(',');
        if (block.asFields) {
            let asf = block.asFields;
            for (let f in asf)
                asf[asf[f]] = f;
            block.as = (f) => (asf && asf[f] ? asf[f] : f);
        }
    }
    if (options.expire === undefined)
        options.expire = defaultExpire;
    return options;
}
function write(data) {
    if (data === null)
        return 'null';
    if (think_helper_1.default.isNumber(data))
        return `i/${data}`;
    return data;
}
function read(redisData) {
    if (redisData === 'null')
        return null;
    if (redisData.startsWith('i/'))
        return parseInt(redisData.substring(2), 10);
    return redisData;
}
class Redis {
    static init(instance, de, l) {
        redisInstance = instance;
        defaultExpire = de;
        logger = l;
    }
    static async cdata(data, options, pipelineInstance) {
        return Redis.cdatas([data], options, pipelineInstance);
    }
    static async cdatas(datas, options, pipelineInstance) {
        return Redis.clidata(datas, { blocks: [{ ...options, dataFields: '*' }], expire: options.expire }, pipelineInstance);
    }
    static async clidata(listdata, options, pipelineInstance) {
        let { blocks, expire } = formatOptions(options);
        let list = think_helper_1.default.isArray(listdata) ? listdata : listdata.data;
        let pipeline = pipelineInstance || redisInstance.pipeline();
        for (let data of list) {
            for (let { prefix, ns, pkfield, dataFields, as } of blocks) {
                let dkey = `${prefix || 'data'}:${ns}:${data[pkfield]}`;
                for (let f in data) {
                    if (dataFields !== '*' && dataFields.indexOf(f) < 0)
                        continue;
                    pipeline.hset(dkey, as ? as(f) : f, write(data[f]));
                    pipeline.pexpire(dkey, expire);
                }
            }
        }
        if (!pipelineInstance)
            await pipeline.exec();
    }
    static async cli(listdata, options, pipelineInstance) {
        const { prefix, ns, liname, orderfield, blocks, expire } = formatOptions(options);
        let likey = `${prefix || 'list'}:${ns}:${liname}`;
        let list = think_helper_1.default.isArray(listdata) ? listdata : listdata.data;
        let pipeline = pipelineInstance || redisInstance.pipeline();
        if (list.length > 0) {
            for (let data of list) {
                if (!data[orderfield])
                    throw new Error(`order is empty, orderfield: ${orderfield}, value: ${data[orderfield]}`);
                let pkvalues = {};
                for (let { prefix, ns, pkfield, dataFields, as } of blocks) {
                    let pkvalue = data[pkfield];
                    pkvalues[pkfield] = pkvalue;
                    let dkey = `${prefix || 'data'}:${ns}:${pkvalue}`;
                    for (let f in data) {
                        if (dataFields !== '*' && dataFields.indexOf(f) < 0)
                            continue;
                        pipeline.hset(dkey, as ? as(f) : f, write(data[f]));
                        pipeline.pexpire(dkey, expire);
                    }
                }
                pipeline.zadd(likey, data[orderfield], JSON.stringify(pkvalues));
            }
        }
        else {
            pipeline.zadd(likey, 0, '{}');
        }
        pipeline.pexpire(likey, expire);
        if (!pipelineInstance)
            await pipeline.exec();
    }
    static async cliIfExists(listdata, options, pipelineInstance) {
        if (await Redis.cexistsLi(options))
            return Redis.cli(listdata, options, pipelineInstance);
    }
    static async cdel(key, pipelineInstance) {
        if (logger)
            logger.warn(`delete key: ${key}`);
        !pipelineInstance ? await redisInstance.del(key) : pipelineInstance.del(key);
    }
    static async cdeldata({ prefix, ns, pkvalue }, pipelineInstance) {
        return Redis.cdel(`${prefix || 'data'}:${ns}:${pkvalue}`, pipelineInstance);
    }
    static async cdellidata({ prefix, ns, liname, ordervalue }, pipelineInstance) {
        let likey = `${prefix || 'list'}:${ns}:${liname}`;
        if (logger)
            logger.warn(`delete key: ${likey},range: ${ordervalue} - ${ordervalue}`);
        !pipelineInstance ? await redisInstance.zremrangebyscore(likey, ordervalue, ordervalue) : pipelineInstance.zremrangebyscore(likey, ordervalue, ordervalue);
    }
    static async cdelli(options, delAll = false, onLiKeyNotFound, pipelineInstance) {
        let { prefix, ns, liname, blocks } = options;
        let likey = `${prefix || 'list'}:${ns}:${liname}`;
        let pipeline = pipelineInstance || redisInstance.pipeline();
        if (delAll) {
            let pkvalues = await redisInstance.zrange(likey, 0, -1);
            if (pkvalues.length <= 1 && pkvalues[0] === '{}')
                pkvalues = undefined;
            if (think_helper_1.default.isEmpty(pkvalues) && onLiKeyNotFound)
                pkvalues = await onLiKeyNotFound();
            if (!think_helper_1.default.isEmpty(pkvalues)) {
                for (let pkvalue of pkvalues) {
                    if (think_helper_1.default.isString(pkvalue) && pkvalue.startsWith('{'))
                        pkvalue = JSON.parse(pkvalue);
                    for (let { prefix, ns, pkfield } of blocks) {
                        if (pkfield) {
                            if (logger)
                                logger.warn(`delete key: ${prefix || 'data'}:${ns}:${pkvalue[pkfield]}`);
                            pipeline.del(`${prefix || 'data'}:${ns}:${pkvalue[pkfield]}`);
                        }
                        else {
                            for (let pkfield in pkvalue) {
                                if (logger)
                                    logger.warn(`delete key: ${prefix || 'data'}:${ns}:${pkvalue[pkfield]}`);
                                pipeline.del(`${prefix || 'data'}:${ns}:${pkvalue[pkfield]}`);
                            }
                        }
                    }
                }
            }
        }
        pipeline.del(likey);
        if (logger)
            logger.warn(`delete key: ${likey}`);
        if (!pipelineInstance)
            await pipeline.exec();
    }
    static async cdelrefdata(options, delAll = false, onLiKeyNotFound, pipelineInstance) {
        options.prefix = 'ref_data';
        options.liname = options.name;
        return Redis.cdelli(options, delAll, onLiKeyNotFound, pipelineInstance);
    }
    static async cexists(key) {
        return redisInstance.exists(key);
    }
    static async cexistsData({ prefix, ns, pkvalue }) {
        return redisInstance.exists(`${prefix || 'data'}:${ns}:${pkvalue}`);
    }
    static async cexistsLi({ prefix, ns, liname }) {
        return redisInstance.exists(`${prefix || 'list'}:${ns}:${liname}`);
    }
    static async cexpire(expire, key, pipelineInstance) {
        !pipelineInstance ? await redisInstance.pexpire(key, expire || defaultExpire) : pipelineInstance.pexpire(key, expire || defaultExpire);
    }
    static async cexpireData(expire, { prefix, ns, pkvalue }, pipelineInstance) {
        return Redis.cexpire(expire, `${prefix || 'data'}:${ns}:${pkvalue}`, pipelineInstance);
    }
    static async cexpireLi(expire, { prefix, ns, liname }, pipelineInstance) {
        return Redis.cexpire(expire, `${prefix || 'list'}:${ns}:${liname}`, pipelineInstance);
    }
    static async rsel(dataPkvalues, options) {
        const { forcedb, blocks, expire } = formatOptions(options);
        let datas = [];
        let missPipeline;
        for (let { prefix, ns, pkfield, dataFields, hgetFields, asFields, as, sel } of blocks) {
            let missPkvalues = [];
            let missPkvaluesMap = {};
            if (forcedb) {
                for (let i = 0; i < dataPkvalues.length; i++) {
                    let pkvalue = dataPkvalues[i][pkfield];
                    if (!pkvalue)
                        return;
                    missPkvalues.push(pkvalue);
                    missPkvaluesMap[pkvalue] = datas[i] = {};
                }
            }
            else {
                let pipeline = redisInstance.pipeline();
                let readFields = hgetFields;
                if (asFields) {
                    readFields = [];
                    for (let f of hgetFields)
                        readFields.push(as(f));
                }
                for (let i = 0; i < dataPkvalues.length; i++) {
                    let pkvalue = dataPkvalues[i][pkfield];
                    if (!pkvalue)
                        return;
                    let data = datas[i] || (datas[i] = {});
                    pipeline.hmget(`${prefix || 'data'}:${ns}:${pkvalue}`, ...readFields, (err, result) => {
                        let isFull = true;
                        if (err) {
                            isFull = false;
                        }
                        else {
                            for (let k = 0; k < hgetFields.length; k++) {
                                if (result[k] === null) {
                                    isFull = false;
                                }
                                else {
                                    data[hgetFields[k]] = read(result[k]);
                                }
                            }
                        }
                        if (isFull === false) {
                            missPkvalues.push(pkvalue);
                            missPkvaluesMap[pkvalue] = data;
                        }
                    });
                }
                await pipeline.exec();
            }
            if (think_helper_1.default.isEmpty(missPkvalues))
                continue;
            if (!sel)
                return;
            let missData = await sel(missPkvalues, pkfield);
            if (think_helper_1.default.isEmpty(missData))
                continue;
            if (!think_helper_1.default.isArray(missData))
                missData = [missData];
            if (!missPipeline)
                missPipeline = redisInstance.pipeline();
            for (const md of missData) {
                let mdkey = `${prefix || 'data'}:${ns}:${md[pkfield]}`;
                for (let f in md) {
                    if (dataFields !== '*' && dataFields.indexOf(f) < 0)
                        continue;
                    missPipeline.hset(mdkey, as ? as(f) : f, write(md[f]));
                }
                missPipeline.pexpire(mdkey, expire);
                let d = missPkvaluesMap[md[pkfield]];
                if (d) {
                    for (let f in md) {
                        if (hgetFields.indexOf(f) >= 0)
                            d[f] = md[f];
                    }
                }
            }
        }
        if (missPipeline)
            missPipeline.exec();
        return datas;
    }
    static async rfind(dataPkvalue, options) {
        if (!think_helper_1.default.isObject(dataPkvalue))
            dataPkvalue = { [options.blocks[0].pkfield]: dataPkvalue };
        let datas = await Redis.rsel([dataPkvalue], options);
        if (!datas)
            return undefined;
        let data = datas[0];
        let { dataChecker } = options;
        if (think_helper_1.default.isFunction(dataChecker))
            return !dataChecker(data) ? undefined : data;
        if (think_helper_1.default.isObject(dataChecker)) {
            let valid = true;
            for (let f in dataChecker) {
                if (data[f] !== dataChecker[f]) {
                    valid = false;
                    break;
                }
            }
            return !valid ? undefined : data;
        }
        return data;
    }
    static async rlidb(options) {
        let { sel, blocks, page = 1, pageSize = 0, cli, } = formatOptions(options);
        let data = (await sel(options));
        if (!think_helper_1.default.isArray(data) && !data.data && isNaN(data.pageSize))
            data = [data];
        if (cli !== false)
            await Redis.cli(data, options);
        let pageData = think_helper_1.default.isArray(data)
            ? { count: data.length, totalPages: 1, pageSize: 0, page: 1, data: data }
            : data;
        if (pageData.pageSize === 0 && pageData.pageSize !== pageSize) {
            pageData.pageSize = pageSize;
            pageData.totalPages = Math.ceil(pageData.count / pageSize);
            pageData.page = page <= pageData.totalPages ? page : pageData.totalPages;
            let from = (pageData.page - 1) * pageData.pageSize;
            pageData.data = pageData.data.slice(from, from + pageData.pageSize);
        }
        for (let i = 0; i < pageData.data.length; i++) {
            let d = pageData.data[i];
            pageData.data[i] = {};
            for (let { hgetFields } of blocks) {
                for (const f of hgetFields) {
                    pageData.data[i][f] = d[f];
                }
            }
        }
        return pageData;
    }
    static async rdatadb(options) {
        let { sel, blocks, clidata } = formatOptions(options);
        let data = await sel(options);
        if (clidata !== false)
            await Redis.clidata(data, options);
        let pageData = think_helper_1.default.isArray(data)
            ? { count: data.length, totalPages: 1, pageSize: 0, page: 1, data: data }
            : data;
        for (let i = 0; i < pageData.data.length; i++) {
            let d = pageData.data[i];
            pageData.data[i] = {};
            for (let { hgetFields } of blocks) {
                for (const f of hgetFields) {
                    pageData.data[i][f] = d[f];
                }
            }
        }
        return pageData;
    }
    static async rli(options) {
        if (options.forcedb) {
            await Redis.cdelli({ prefix: options.prefix, ns: options.ns, liname: options.liname }, false);
            return Redis.rlidb(options);
        }
        const { prefix, ns, liname, page = 1, pageSize = 0, order = 'asc', } = formatOptions(options);
        let likey = `${prefix || 'list'}:${ns}:${liname}`;
        if (!(await Redis.cexists(likey))) {
            if (logger)
                logger.warn(`${likey} not exists, fetch from db`);
            return Redis.rlidb(options);
        }
        let count = await redisInstance.zcard(likey);
        if (count <= 0) {
            return { count: 0, totalPages: 1, pageSize, page: 1, data: [] };
        }
        let start = 0;
        let end = -1;
        if (pageSize > 0) {
            start = (page - 1) * pageSize;
            end = start + pageSize - 1;
            if (start >= count)
                return { count, totalPages: Math.ceil(count / pageSize), pageSize, page: page, data: [] };
            if (end >= count)
                end = count - 1;
        }
        let datas;
        let dataPkvalues = order === 'asc' ? await redisInstance.zrange(likey, start, end) : await redisInstance.zrevrange(likey, start, end);
        if (!think_helper_1.default.isEmpty(dataPkvalues) && dataPkvalues.length <= 1 && dataPkvalues[0] === '{}') {
            return { count: 0, totalPages: 0, pageSize, page, data: [] };
        }
        if (!think_helper_1.default.isEmpty(dataPkvalues)) {
            for (let i = 0; i < dataPkvalues.length; i++)
                dataPkvalues[i] = JSON.parse(dataPkvalues[i]);
            datas = await Redis.rsel(dataPkvalues, options);
        }
        if (!datas) {
            if (logger)
                logger.warn(`${likey} datas is empty, fetch from db`);
            return Redis.rlidb(options);
        }
        return { count, totalPages: pageSize <= 0 ? 1 : Math.ceil(count / pageSize), pageSize, page, data: datas };
    }
    static async rrefdata(options) {
        let { forcedb, ns, name, orderfield = 'id', sel, block } = options;
        let blocks = [block];
        let listdata = await Redis.rli({ forcedb, prefix: 'ref_data', ns, liname: name, orderfield, blocks, sel, page: 1, pageSize: 0 });
        if (think_helper_1.default.isEmpty(listdata) || think_helper_1.default.isEmpty(listdata.data))
            return;
        let data = listdata.data[0];
        if (think_helper_1.default.isEmpty(data))
            return;
        let { dataChecker } = options;
        if (think_helper_1.default.isFunction(dataChecker))
            return !dataChecker(data) ? undefined : data;
        if (think_helper_1.default.isObject(dataChecker)) {
            let valid = true;
            for (let f in dataChecker) {
                if (data[f] !== dataChecker[f]) {
                    valid = false;
                    break;
                }
            }
            return !valid ? undefined : data;
        }
        return data;
    }
    static async rupdateOne({ t, where, updateData }, currentData, options) {
        const success = await t.where(where).update2(updateData);
        if (success <= 0)
            return false;
        if (currentData) {
            for (let f in updateData)
                currentData[f] = updateData[f];
        }
        if (!think_helper_1.default.isFunction(options)) {
            let { pkfield } = options;
            if (updateData[pkfield] === undefined) {
                if (currentData && currentData[pkfield] !== undefined)
                    updateData[pkfield] = currentData[pkfield];
                else if (think_helper_1.default.isString(where[pkfield]) || think_helper_1.default.isNumber(where[pkfield]))
                    updateData[pkfield] = where[pkfield];
            }
            if (updateData[pkfield] !== undefined) {
                await Redis.cdata(updateData, options);
            }
        }
        else if (options) {
            await options(updateData, currentData);
        }
        return currentData || updateData;
    }
    static async rdelOne({ t, where, updateData }, options) {
        if (!updateData)
            updateData = {};
        updateData.update_time = updateData.delete_time = Date.now();
        let success = await t.where2(where).update2(updateData);
        if (success <= 0)
            return false;
        await Redis.cdeldata(options);
    }
}
exports.Redis = Redis;
//# sourceMappingURL=Redis.js.map