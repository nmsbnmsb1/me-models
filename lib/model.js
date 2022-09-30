"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const think_helper_1 = __importDefault(require("think-helper"));
const model_1 = __importDefault(require("think-model/lib/model"));
const DBUtils_1 = __importDefault(require("./DBUtils"));
model_1.default.prototype.add2 = async function (data, options) {
    if (data) {
        if (data.create_time === undefined)
            data.create_time = Date.now();
        if (data.update_time === undefined)
            data.update_time = data.create_time;
    }
    data.id = await this.add(data, options);
    return data;
};
model_1.default.prototype.update2 = async function (data, options) {
    if (data) {
        if (data.update_time === undefined)
            data.update_time = Date.now();
    }
    return this.update(data, options);
};
model_1.default.prototype.addMany2 = async function (data, options, replace) {
    options = await this.parseOptions(options);
    let promises = data.map(async (item) => {
        if (!item.create_time)
            item.create_time = Date.now();
        if (!item.update_time)
            item.update_time = Date.now();
        item = await this.db().parseData(item, false, options.table);
        return this.beforeAdd(item, options);
    });
    let ndata = await Promise.all(promises);
    if (replace) {
        options.replace = replace;
    }
    const insertIds = await this.db().addMany(ndata, options);
    promises = ndata.map(async (item, i) => {
        item[this.pk] = insertIds[i];
        data[i][this.pk] = insertIds[i];
        return this.afterAdd(item, options);
    });
    await Promise.all(promises);
    return insertIds;
};
model_1.default.prototype.updateMany2 = async function (dataList, options) {
    let promises;
    let useBatch;
    const db = this.db();
    if (options && options.mode === 'temp_table' && db.updateMany2ByTempTable) {
        useBatch = db.updateMany2ByTempTable.bind(db);
    }
    else if (options && options.mode === 'case_when' && db.updateMany2ByCaseWhen) {
        useBatch = db.updateMany2ByCaseWhen.bind(db);
    }
    if (useBatch) {
        dataList = dataList.slice();
        options = await this.parseOptions(options);
        const cols = await this.db().getSchema(options.table);
        const fm = {};
        while (dataList.length > 0) {
            for (let i = 0; i < dataList.length; i++) {
                const data = dataList[i];
                if (!data.update_time)
                    data.update_time = Date.now();
                let key = options && options.key ? options.key : '';
                let keyType = key ? 'primary' : '';
                let fs = [];
                let newData = {};
                for (const f in data) {
                    const col = cols[f];
                    if (!col)
                        continue;
                    if (col.primary === true && (!key || keyType === 'unique')) {
                        key = f;
                        keyType = 'primary';
                    }
                    else if (col.unique === true && !key) {
                        key = f;
                        keyType = 'unique';
                    }
                    fs.push(f);
                    if (col.readonly)
                        continue;
                    if (data[f] === undefined)
                        continue;
                    const isJSON = col.tinyType === 'json' && !(Array.isArray(data[f]) && /^exp$/i.test(data[f][0]));
                    if (think_helper_1.default.isNumber(data[f]) || think_helper_1.default.isString(data[f]) || think_helper_1.default.isBoolean(data[f]) || isJSON) {
                        newData[f] = db.schema.parseType(col.tinyType, data[f]);
                    }
                    else {
                        newData[f] = data[f];
                    }
                }
                if (!key)
                    throw new Error('updateMany2 every data must contain primary/unique key');
                newData = db.schema.validateData(newData, cols);
                if (think_helper_1.default.isEmpty(newData)) {
                    throw new Error(`update data is empty, original data is ${JSON.stringify(data)}`);
                }
                const fkey = fs.sort().join(',');
                if (!fm[fkey])
                    fm[fkey] = { options, dataList: [], fs, cols };
                const foptions = fm[fkey];
                foptions.dataList.push(newData);
                if (keyType === 'primary' && (!foptions.key || foptions.keyType === 'unique')) {
                    foptions.key = key;
                    foptions.keyType = keyType;
                }
                else if (keyType === 'unique' && !foptions.key) {
                    foptions.key = key;
                    foptions.keyType = keyType;
                }
                dataList.splice(i, 1);
                i--;
            }
        }
        promises = [];
        for (const fkey in fm) {
            promises.push(useBatch(fm[fkey]));
        }
    }
    else {
        promises = dataList.map((data) => {
            return this.update(data, options);
        });
    }
    return Promise.all(promises);
};
model_1.default.prototype.field2 = function (field, filedOptions) {
    if (filedOptions) {
        this.field(DBUtils_1.default.getFieldsSql(field, filedOptions));
    }
    else {
        this.field(field);
    }
    return this;
};
model_1.default.prototype.fieldReverse2 = function (...other) {
    this.fieldReverse(`create_time,update_time,delete_time${other ? ',' + other.join(',') : ''}`);
    return this;
};
model_1.default.prototype.where2 = function (w) {
    if (think_helper_1.default.isString(w)) {
        if (w.indexOf('delete_time') < 0) {
            if (w !== '')
                w += ' and ';
            w += "delete_time='0'";
        }
    }
    else {
        if (!w)
            w = {};
        if (w.delete_time === undefined)
            w.delete_time = ['=', 0];
    }
    this.where(w);
    return this;
};
model_1.default.prototype.delete2 = async function () {
    const nowMS = Date.now();
    return this.update({ delete_time: nowMS, update_time: nowMS });
};
model_1.default.prototype.thenUpdate2 = async function (where, data, addData) {
    let successNum = await this.where(where).update2(data);
    if (successNum <= 0) {
        await this.add2(addData || data);
    }
    return successNum;
};
model_1.default.prototype.thenAdd2 = async function (where, addData) {
    const exists = !think_helper_1.default.isEmpty(await this.field('id').where(where).find());
    if (!exists) {
        await this.add2(addData);
    }
    return exists;
};
model_1.default.prototype.isTableExists = async function () {
    return this.db().isTableExists ? this.db().isTableExists(this.modelName) : false;
};
model_1.default.prototype.createTable = async function (fields) {
    return this.db().createTable ? this.db().createTable(this.modelName, fields) : false;
};
model_1.default.prototype.checkTable = async function (fields) {
    return this.db().checkTable ? this.db().checkTable(this.modelName, fields) : false;
};
model_1.default.prototype.checkIndex = async function (indexName, columnNames, options) {
    return this.db().checkIndex ? this.db().checkIndex(indexName, this.modelName, columnNames, options) : false;
};
exports.default = model_1.default;
//# sourceMappingURL=model.js.map