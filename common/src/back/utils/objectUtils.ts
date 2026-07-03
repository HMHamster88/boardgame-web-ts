export function isObject(value: any) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
}

export function setValueByPath(
    obj: any,
    path: string,
    value: any
): void {
    const keys = path.split(/[.[\]]/).filter(Boolean)
    let current: any = obj

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]

        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
            current[key] = {}
        }
        current = current[key]
    }

    const lastKey = keys[keys.length - 1]
    current[lastKey] = value
}

export function getValueByPath(
    obj: any,
    path: string
): any {
    return path.split(/[.[\]]/).filter(Boolean).reduce((acc: any, key: string) => {
        return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
}