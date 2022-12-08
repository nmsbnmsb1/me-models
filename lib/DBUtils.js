"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBUtils = void 0;
const think_helper_1 = __importDefault(require("think-helper"));
class DBUtils {
    static escapeString(str) {
        if (!str)
            return '';
        return str.replace(/[\0\n\r\b\t\\'"\x1a]/g, (s) => {
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
    static toBoolean(b) {
        if (think_helper_1.default.isNumber(b))
            return b === 0 ? 0 : 1;
        if (think_helper_1.default.isBoolean(b))
            return b === true ? 1 : 0;
        return b ? 1 : 0;
    }
    static formatSql(sql) {
        return sql.replace(/[\r\n]/g, '').replace(/\s+/g, ' ');
    }
    static async doSql(model, sql) {
        return model.query(`${DBUtils.formatSql(sql)}`);
    }
    static getTableConfig(name, fields, index = {}, nsdata, nslist = {}) {
        let all = {
            name,
            config: { id: true, ...fields, sp: true },
            index,
            fillDefaultData: (data) => DBUtils.fillDefaultData(data, all.config),
            cropData: (data, fields, ignores) => DBUtils.cropData(data, fields || all.common, ignores),
            modify: (options, fields) => DBUtils.modifyFields(fields || all.preset, options),
            full: `id,${Object.keys(fields).join(',')},create_time,update_time,delete_time`,
            preset: Object.keys(fields).join(','),
            common: Object.keys(fields)
                .filter((f) => fields[f].common !== false)
                .join(','),
            nsdata,
            nslist,
        };
        for (let field in fields) {
            for (let k in fields[field]) {
                if (!k.startsWith('tag_'))
                    continue;
                if (!fields[field][k])
                    continue;
                let tag = k.substring(4);
                all[tag] = `${!all[tag] ? '' : `${all[tag]},`}${field}`;
            }
        }
        return all;
    }
    static fillDefaultData(data, dbconfig) {
        for (const fc in dbconfig) {
            if (data[fc] !== undefined)
                continue;
            if (fc === 'id') {
                data[fc] = null;
            }
            else if (fc === 'sp') {
                if (data.create_time === undefined)
                    data.create_time = 0;
                if (data.update_time === undefined)
                    data.update_time = 0;
                if (data.delete_time === undefined)
                    data.delete_time = 0;
            }
            else {
                data[fc] = dbconfig[fc].default !== undefined ? dbconfig[fc].default : null;
            }
        }
        return data;
    }
    static cropData(data, fields, ignores) {
        if (think_helper_1.default.isString(fields))
            fields = fields.split(',');
        if (think_helper_1.default.isString(ignores))
            ignores = ignores.split(',');
        for (let k in data) {
            if (ignores && ignores.indexOf(k) >= 0)
                continue;
            if (fields.indexOf(k) < 0)
                delete data[k];
        }
        return data;
    }
    static modifyFields(fields, options) {
        let fs;
        if (think_helper_1.default.isString(fields)) {
            fs = fields.split(',');
        }
        else {
            fs = fields.slice();
        }
        if (options) {
            for (const n in options) {
                const tmp = n.split(',');
                if (options[n] === 'override') {
                    fs = tmp;
                    break;
                }
                let b = options[n];
                for (const f of tmp) {
                    let index = fs.indexOf(f);
                    if (b === true && index < 0)
                        fs.push(f);
                    if (!b && index >= 0)
                        fs.splice(index, 1);
                }
            }
        }
        return fs;
    }
    static getFieldsSql(fields, options) {
        return DBUtils.modifyFields(fields, options).join(',');
    }
    static aliasFields(alias, fields) {
        let tfs = think_helper_1.default.isString(fields) ? fields.split(',') : fields;
        for (let i = 0; i < tfs.length; i++)
            tfs[i] = `${alias}.${tfs[i]}`;
        return tfs;
    }
    static asFields(alias, defaultAs, sp = true, customAs) {
        let as = {};
        if (sp && alias) {
            as.id = `${alias}_id`;
            as.create_time = `${alias}_create_time`;
            as.update_time = `${alias}_update_time`;
            as.delete_time = `${alias}_delete_time`;
        }
        if (defaultAs && alias) {
            let das = think_helper_1.default.isString(defaultAs) ? defaultAs.split(',') : defaultAs;
            for (let da of das)
                as[da] = `${alias}_${da}`;
        }
        if (customAs) {
            for (let f in customAs)
                as[f] = customAs[f];
        }
        return as;
    }
    static getFieldsObject(alias = '', fields, defaultAs, sp = false, customAs, hget, hgetOptions) {
        let tfs = think_helper_1.default.isString(fields) ? fields.split(',') : fields;
        let tas = DBUtils.asFields(alias, defaultAs === true ? fields : defaultAs, sp, customAs);
        let hgfs;
        if (hget) {
            if (!hgetOptions)
                hgfs = think_helper_1.default.isString(hget) ? hget.split(',') : hget;
            else
                hgfs = DBUtils.modifyFields(hget, hgetOptions);
        }
        let dataFields = [];
        hget = [];
        for (let i = 0; i < tfs.length; i++) {
            let f = tfs[i];
            let tf = tfs[i];
            let df = tfs[i];
            if (tas[f]) {
                df = tas[f];
                tf = `${f} as ${tas[f]}`;
            }
            if (alias)
                tf = `${alias}.${tf}`;
            tfs[i] = tf;
            dataFields.push(df);
            if (!hgfs || hgfs.indexOf(f) >= 0)
                hget.push(df);
        }
        return { alias, tfields: tfs, dataFields, hgetFields: hget, asFields: tas };
    }
    static getLeftJoinSql(pageSize, { countField, tables, where, order, }) {
        if (think_helper_1.default.isArray(where))
            where = where.join(' and ');
        let allFields = [];
        let from = '';
        for (let { t, alias, tfields, fields, on, keep } of tables) {
            t = `${t}${alias ? ` as ${alias}` : ''}`;
            let tfs = tfields;
            if (!tfs) {
                let { fs, mopts, sp, defaultAs, customAs } = fields;
                tfs = DBUtils.modifyFields(fs, mopts);
                if (alias) {
                    let as = DBUtils.asFields(alias, defaultAs, sp, customAs);
                    for (let i = 0; i < tfs.length; i++) {
                        let f = tfs[i];
                        if (as[f])
                            f = `${f} as ${as[f]}`;
                        if (alias)
                            f = `${alias}.${f}`;
                        tfs[i] = f;
                    }
                }
            }
            think_helper_1.default.isString(tfs) ? allFields.push(tfs) : allFields.push(...tfs);
            if (keep === true ||
                !alias ||
                (tfs && tfs.length > 0) ||
                where.indexOf(`${alias}.`) >= 0 ||
                (order && order.indexOf(`${alias}.`) >= 0) ||
                (pageSize > 0 && countField && countField.indexOf(`${alias}.`) >= 0)) {
                if (from === '') {
                    from = t;
                }
                else {
                    from = `(${from}) left join ${t} on ${on}`;
                }
            }
        }
        return `select ${allFields.join(',')} from ${from} ${where ? `where ${where}` : ''} ${order ? `order by ${order}` : ''}`;
    }
    static async count(model, countField, sql) {
        sql = DBUtils.formatSql(sql);
        let totalCount;
        const countData = await model.query(`select COUNT(a.${countField}) as count from (${sql}) as a`);
        if (think_helper_1.default.isEmpty(countData) || countData.length === 0 || countData[0].count <= 0) {
            totalCount = 0;
        }
        else {
            totalCount = countData[0].count;
        }
        return totalCount;
    }
    static async doPage(model, page, pageSize, countField, sql) {
        sql = DBUtils.formatSql(sql);
        let totalCount;
        let rs;
        if (pageSize > 0) {
            const countData = await model.query(`select COUNT(${countField}) as count from (${sql}) as a`);
            if (think_helper_1.default.isEmpty(countData) || countData.length === 0 || countData[0].count <= 0) {
                totalCount = 0;
            }
            else {
                totalCount = countData[0].count;
                rs = await model.query(`${sql} limit ${(page - 1) * pageSize},${pageSize}`);
            }
        }
        else {
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
    static async doPageByConfig(model, page, pageSize, config) {
        return DBUtils.doPage(model, page, pageSize, config.countField, DBUtils.getLeftJoinSql(pageSize, config));
    }
    static async checkDup(model, where, exclude, detail = false) {
        let result;
        const f = [];
        const or = {};
        for (const n in where) {
            f.push(n);
            or[n] = where[n];
        }
        const sql = model.field(f.join(',')).where({ ...exclude, _complex: { ...or, _logic: 'or' } });
        if (detail) {
            result = await sql.select();
        }
        else {
            result = await sql.find();
            if (!think_helper_1.default.isEmpty(result)) {
                for (const n in result) {
                    if (result[n] === where[n])
                        return n;
                }
                return 'field';
            }
            result = undefined;
        }
        return result;
    }
    static getDRObject(options) {
        let { fields: fs, where, order, nslis } = options;
        let fields = {};
        let tables = [];
        let blocks = [];
        for (let i = 0; i < fs.length; i++) {
            let { alias, t, hget, hgetOptions, on, pkfield, sp = false, customAs = undefined } = fs[i];
            let field = DBUtils.getFieldsObject(alias, t.full, i === 0 ? undefined : true, sp, customAs, hget, hgetOptions);
            let table = { t: t.name, ...field, on };
            let block = { ...t.nsdata, ...field };
            if (pkfield)
                block.pkfield = pkfield;
            else if (i > 0)
                block.pkfield = `${alias}_${t.nsdata.pkfield}`;
            fields[`${alias}Field`] = field;
            tables.push(table);
            blocks.push(block);
        }
        return { ...fields, tables, where, order, nslis, blocks };
    }
}
exports.DBUtils = DBUtils;
//# sourceMappingURL=DBUtils.js.map