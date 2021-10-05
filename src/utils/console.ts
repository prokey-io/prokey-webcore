/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 *
 * Hadi Robati, hadi@prokey.io
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import * as Utility from './utils';

export enum LogLevel {
    INFO,
    WARNING,
    ERROR,
    EXCEPTION,
}

export class MyConsole {
    private static _logLevel = LogLevel.INFO;

    private static _isDebug = true;
    private static _save_logs = true;


    public static Info(message, ...params) {
        if (this._isDebug === false) {
            return;
        }

        if (this._logLevel > LogLevel.INFO) {
            return;
      }

      console.log(message, params);


        if (this._save_logs) {
            const current_log = {
                message: message,
                params: params,
                status: LogLevel.INFO,
                time: new Date()
            };
            this.saveLogToLocal(current_log);
        }
    }

    public static Warning(message, ...params) {
        if (this._isDebug === false) {
            return;
        }

        if (this._logLevel > LogLevel.WARNING) {
            return;
        }

        console.log(message, params);


        if (this._save_logs) {

            const current_log = {
                message: message,
                params: params,
                status: LogLevel.WARNING,
                time: new Date()
            };
            this.saveLogToLocal(current_log);

        }
    }

    public static Error(message, ...params) {
        if (this._isDebug === false) {
            return;
        }

        if (this._logLevel > LogLevel.ERROR) {
            return;
        }

        console.error(message, params);

        if (this._save_logs) {
            const current_log = {
                message: message,
                params: params,
                status: LogLevel.ERROR,
                time: new Date()
            };
            this.saveLogToLocal(current_log);
        }
    }

    public static Exception(message, ...params) {
        if (this._isDebug === false) {
            return;
        }

        console.error(message, params);

        if (this._save_logs) {

            const current_log = {
                message: message,
                params: params,
                status: LogLevel.EXCEPTION,
                time: new Date()
            };
            this.saveLogToLocal(current_log);

        }
    }

    public static setSaveLogs(action: boolean) {
        this._save_logs = action;
    }

    public static getSaveLogs() {
        return this._save_logs;
    }

    private static saveLogToLocal(current_log: { time: Date; message: any; params: any[]; status: LogLevel }) {
        let logs = [];
        const older_logs = localStorage.getItem('logs');
        if (typeof older_logs === 'string') {
            logs = JSON.parse(older_logs);
        } else {
            logs = [];
        }
        // @ts-ignore
        logs.push(current_log);

        // Re-serialize the array back into a string and store it in localStorage
        localStorage.setItem('logs', JSON.stringify(logs, (key: string, value: any) => {
            if(value instanceof Uint8Array){
                return Utility.ByteArrayToHexString(value);
            }

            return value;
        }));
    }

}
