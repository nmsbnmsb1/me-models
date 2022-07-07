import helper from 'think-helper';

//数据打码
export default class DataMask {
	public static maskPhone(phone: string) {
		return !helper.isEmpty(phone) ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '';
	}

	public static maskMail(mail: string) {
		if (!helper.isEmpty(mail) && mail.indexOf('@') > 0) {
			const str = mail.split('@');
			let _s = '';

			if (str[0].length > 4) {
				_s = str[0].substr(0, 4);
				for (let i = 0; i < str[0].length - 4; i++) {
					_s += '*';
					if (i >= 2) break;
				}
			} else {
				_s = str[0].substr(0, 1);
				for (let i = 0; i < str[0].length - 1; i++) {
					_s += '*';
				}
			}
			return _s + '@' + str[1];
		}
		return '';
	}

	public static maskIDNo(idNo: string) {
		return idNo.replace(/^(.{1})(?:\d+)(.{1})$/, '$1****************$2');
	}

	public static maskRealName(realname: string) {
		let _s = realname[0];
		if (realname.length === 2) {
			_s += '*';
		} else {
			for (let i = 0; i < realname.length - 2; i++) {
				_s += '*';
			}
			_s += realname[realname.length - 1];
		}
		return _s;
	}

	private static _defaultMask = {
		phone: DataMask.maskPhone,
		mail: DataMask.maskMail,
		id_no: DataMask.maskIDNo,
		realname: DataMask.maskRealName,
	};
	public static do(data: any, maskOptions: boolean | { [fieldName: string]: (value: any) => any } = true) {
		if (maskOptions === false) return data;
		//
		let masks;
		if (maskOptions === true) {
			masks = DataMask._defaultMask;
		} else {
			masks = { ...DataMask._defaultMask, ...maskOptions };
		}
		//
		let rs = data;
		if (!helper.isArray(rs)) rs = [data];
		for (let i = 0; i < rs.length; i++) {
			const d = rs[i];
			for (const n in masks) if (masks[n] && d[n]) d[n] = masks[n](d[n]);
		}
		return rs.length === 1 && !helper.isArray(data) ? rs[0] : rs;
	}
}
