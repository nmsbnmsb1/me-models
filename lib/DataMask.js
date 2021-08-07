"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const think_helper_1 = __importDefault(require("think-helper"));
class DataMask {
    static maskPhone(phone) {
        return !think_helper_1.default.isEmpty(phone) ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '';
    }
    static maskMail(mail) {
        if (!think_helper_1.default.isEmpty(mail) && mail.indexOf('@') > 0) {
            const str = mail.split('@');
            let _s = '';
            if (str[0].length > 4) {
                _s = str[0].substr(0, 4);
                for (let i = 0; i < str[0].length - 4; i++) {
                    _s += '*';
                    if (i >= 2)
                        break;
                }
            }
            else {
                _s = str[0].substr(0, 1);
                for (let i = 0; i < str[0].length - 1; i++) {
                    _s += '*';
                }
            }
            return _s + '@' + str[1];
        }
        return '';
    }
    static maskIDNo(idNo) {
        return idNo.replace(/^(.{1})(?:\d+)(.{1})$/, '$1****************$2');
    }
    static maskRealName(realname) {
        let _s = realname[0];
        if (realname.length === 2) {
            _s += '*';
        }
        else {
            for (let i = 0; i < realname.length - 2; i++) {
                _s += '*';
            }
            _s += realname[realname.length - 1];
        }
        return _s;
    }
    static do(data, maskOptions) {
        if (maskOptions === false)
            return data;
        if (think_helper_1.default.isEmpty(maskOptions))
            maskOptions = true;
        let masks;
        if (!DataMask._maskFields) {
            DataMask._maskFields = {
                phone: DataMask.maskPhone,
                mail: DataMask.maskMail,
                id_no: DataMask.maskIDNo,
                realname: DataMask.maskRealName,
            };
        }
        if (maskOptions === true) {
            masks = DataMask._maskFields;
        }
        else {
            masks = Object.assign(Object.assign({}, DataMask._maskFields), maskOptions);
        }
        let rs = data;
        if (!think_helper_1.default.isArray(rs))
            rs = [data];
        for (let i = 0; i < rs.length; i++) {
            const d = rs[i];
            for (const n in masks)
                if (masks[n] && d[n])
                    d[n] = masks[n](d[n]);
        }
        return rs.length === 1 && !think_helper_1.default.isArray(data) ? rs[0] : rs;
    }
}
exports.default = DataMask;
//# sourceMappingURL=DataMask.js.map