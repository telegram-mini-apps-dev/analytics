import { App } from '../app'
import { Errors, throwError } from '../errors'
import { generateUUID } from '../utils/generateUUID';
import { retrieveLaunchParams  } from "../utils/retrieveLaunchParams";
import { WebAppUser } from "../../declaration";

export class SessionController {
    private sessionId: string;
    private userData: WebAppUser;
    private platform: string;
    private webAppStartParam: string;

    private appModule: App;

    constructor(app: App) {
        this.appModule = app;
    }

    public init() {
        const lp = retrieveLaunchParams();
        const initData = lp.tgWebAppData;

        this.userData = initData?.user;

        if (!this.userData) {
            throwError(Errors.USER_DATA_IS_NOT_PROVIDED);
        }

        this.webAppStartParam = initData.start_param;
        this.platform = lp.platform;
        this.sessionId = generateUUID(String(this.getUserId()));
    }

    public getSessionId() {
        return this.sessionId;
    }

    public getUserId() {
        return this.userData.id;
    }

    public getWebAppStartParam() {
        return this.webAppStartParam;
    }

    public getPlatform(){
        return this.platform;
    }

    public getUserLocale() {
        return this.userData.language_code;
    }

    public getUserData() {
        return this.userData;
    }

    public getUserIsPremium() {
        const userData = this.getUserData();

        return Boolean(userData?.is_premium);
    }

    public assembleEventSession() {
        return {
            session_id: this.getSessionId(),
            user_id: this.getUserId(),
            app_name: this.appModule.getAppName(),
            is_premium: this.getUserIsPremium(),
            platform: this.getPlatform(),
            locale: this.getUserLocale(),
            start_param: this.getWebAppStartParam(),
            client_timestamp: String(Date.now()),
        }
    }
}
