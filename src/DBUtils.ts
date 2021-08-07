import helper from 'think-helper';
import { IModel } from './model';

export default class DBUtils {
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

  // 原声查询
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

  //'a.*,b.*'
  public static getFieldsArr(fields: string | string[], options: { [name: string]: boolean | 'override' }) {
    let fs: string[];
    if (helper.isString(fields)) {
      fs = (fields as string).split(',');
    } else {
      fs = fields as string[];
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
        if (options[n] === true) {
          for (const f of tmp) fs.push(f);
        } else {
          for (const f of tmp) {
            const index = fs.indexOf(f);
            if (index >= 0) fs.splice(index, 1);
          }
        }
      }
    }
    // console.log(fields);
    return fs;
  }

  public static getFieldsSql(fields: string | string[], options: { [name: string]: boolean | 'override' }) {
    return DBUtils.getFieldsArr(fields, options).join(',');
  }

  //获取LeftJoin查询字符串
  public static getLeftJoinSql(
    pageSize: number,
    config: {
      countField?: string;
      fields: string | string[];
      fieldsOptions?: { [name: string]: boolean | 'override' };
      where?: string | string[];
      tables?: { t: string; alias?: string; on?: string; keep?: boolean }[];
      order?: string;
    }
  ) {
    let fields: any = config.fields;
    if (helper.isEmpty(config.fieldsOptions)) {
      fields = helper.isString(config.fields) ? config.fields : (config.fields as any).join(',');
    } else {
      fields = DBUtils.getFieldsArr(config.fields, config.fieldsOptions).join(',');
    }
    //if (fields.lastIndexOf(',') === fields.length - 1) fields = fields.substring(0, fields.length - 1);
    //
    let where: any = config.where;
    if (helper.isArray(where)) where = (where as string[]).join(' and ');
    //
    let from = '';
    for (const table of config.tables) {
      const t = `${table.t}${table.alias ? ` as ${table.alias}` : ''}`;
      if (
        table.keep === true ||
        !table.alias ||
        fields.indexOf(`${table.alias}.`) >= 0 ||
        where.indexOf(`${table.alias}.`) >= 0 ||
        (config.order && config.order.indexOf(`${table.alias}.`) >= 0) ||
        (pageSize > 0 && config.countField && config.countField.indexOf(`${table.alias}.`) >= 0)
      ) {
        if (from === '') {
          from = t;
        } else {
          from = `(${from}) left join ${t} on ${table.on}`;
        }
      }
    }
    return `select ${fields} from ${from} ${where ? `where ${where}` : ''} ${config.order ? `order by ${config.order}` : ''}`;
  }

  // 分页查询
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

  // 分页查询
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
      currentPage: page,
      data: rs || [],
    };
  }

  public static async doPageByConfig(
    model: IModel,
    page: number,
    pageSize: number,
    config: {
      countField?: string;
      fields: string | string[];
      fieldsOptions?: { [name: string]: boolean | 'override' };
      where?: string | string[];
      tables?: { t: string; alias?: string; on?: string; keep?: boolean }[];
      order?: string;
    }
  ) {
    return DBUtils.doPage(model, page, pageSize, config.countField, DBUtils.getLeftJoinSql(pageSize, config));
  }
}
