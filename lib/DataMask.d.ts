export default class DataMask {
    static maskPhone(phone: string): string;
    static maskMail(mail: string): string;
    static maskIDNo(idNo: string): string;
    static maskRealName(realname: string): string;
    static do(data: any, maskOptions: boolean | {
        [fieldName: string]: (value: any) => any;
    }): any;
}
