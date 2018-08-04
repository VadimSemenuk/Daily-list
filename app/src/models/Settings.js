export default class Settings {
    theme: Theme | number;
    defaultNotification: boolean;
    fastAdd: boolean;
    sort: Sort;
    password: Password;
    fontSize: number;
}

export class Theme {
    id: number;
    statusBar: string;
    header: string;
    body: string;
    realId: string;
}

export class Sort {
    type: number;
    direction: number;
    finSort: boolean;
}

export class Password {
    type: number;
    direction: number;
}