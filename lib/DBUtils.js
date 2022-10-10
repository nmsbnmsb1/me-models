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
    static getFieldsArr(fields, options) {
        let fs;
        if (think_helper_1.default.isString(fields)) {
            fs = fields.split(',');
        }
        else {
            fs = fields;
        }
        if (options) {
            for (const n in options) {
                const tmp = n.split(',');
                if (options[n] === 'override') {
                    fs = tmp;
                    break;
                }
                if (options[n] === true) {
                    for (const f of tmp)
                        fs.push(f);
                }
                else {
                    for (const f of tmp) {
                        const index = fs.indexOf(f);
                        if (index >= 0)
                            fs.splice(index, 1);
                    }
                }
            }
        }
        return fs;
    }
    static getFieldsSql(fields, options) {
        return DBUtils.getFieldsArr(fields, options).join(',');
    }
    static getLeftJoinSql(pageSize, config) {
        let fields = config.fields;
        if (think_helper_1.default.isEmpty(config.fieldsOptions)) {
            fields = think_helper_1.default.isString(config.fields) ? config.fields : config.fields.join(',');
        }
        else {
            fields = DBUtils.getFieldsArr(config.fields, config.fieldsOptions).join(',');
        }
        let where = config.where;
        if (think_helper_1.default.isArray(where))
            where = where.join(' and ');
        let from = '';
        for (const table of config.tables) {
            const t = `${table.t}${table.alias ? ` as ${table.alias}` : ''}`;
            if (table.keep === true ||
                !table.alias ||
                fields.indexOf(`${table.alias}.`) >= 0 ||
                where.indexOf(`${table.alias}.`) >= 0 ||
                (config.order && config.order.indexOf(`${table.alias}.`) >= 0) ||
                (pageSize > 0 && config.countField && config.countField.indexOf(`${table.alias}.`) >= 0)) {
                if (from === '') {
                    from = t;
                }
                else {
                    from = `(${from}) left join ${t} on ${table.on}`;
                }
            }
        }
        return `select ${fields} from ${from} ${where ? `where ${where}` : ''} ${config.order ? `order by ${config.order}` : ''}`;
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
            currentPage: page,
            data: rs || [],
        };
    }
    static async doPageByConfig(model, page, pageSize, config) {
        return DBUtils.doPage(model, page, pageSize, config.countField, DBUtils.getLeftJoinSql(pageSize, config));
    }
}
exports.DBUtils = DBUtils;
//# sourceMappingURL=DBUtils.js.map