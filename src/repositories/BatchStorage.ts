export class BatchStorage {
    private sessionStorage: Storage;
    private localStorage: Storage;

    private readonly key: string;

    constructor(key: string) {
        this.sessionStorage = window.sessionStorage;
        this.localStorage = window.localStorage;

        this.key = key;
    }

    public getBatch(): Record<string, any>[] {
        if ([null, 'null'].includes(this.sessionStorage.getItem(this.key)) && [null, 'null'].includes(this.localStorage.getItem(this.key))) {
            this.setItem([]);
        } else {
            this.setItem(JSON.parse(this.localStorage.getItem(this.key)));
        }

        this.setItem(
            [...JSON.parse(this.sessionStorage.getItem(this.key)), ...JSON.parse(this.localStorage.getItem(this.key))]
                .filter((obj, idx, arr) =>
                    arr.findIndex(t => JSON.stringify(t) === JSON.stringify(obj)) === idx));
        return JSON.parse(this.sessionStorage.getItem(this.key));
    }

    public addToStorage(event_name: string, requestBody?: Record<string, any>) {
        const data: Record<string, any>[] = this.getBatch();

        data.push({
            event_name,
            ...requestBody,
        });

        this.setItem(data);
    }


    public setItem(value: any) {
        this.localStorage.setItem(this.key, JSON.stringify(value));
        this.sessionStorage.setItem(this.key, JSON.stringify(value));
    }
}