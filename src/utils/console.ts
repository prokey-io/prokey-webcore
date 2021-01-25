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

export enum LogLevel 
{
    INFO,
    WARNING,
    ERROR,
    EXCEPTION,
}

export class MyConsole {
    static _logLevel = LogLevel.INFO;

    static _isDebug = false;
    public static Info(message, ...params){
        if (this._isDebug === false) { 
            return; 
        }
        
        if(this._logLevel > LogLevel.INFO) {
            return;
        }

        console.log(message, params);
    }

    public static Warning(message, ...params){
        if (this._isDebug === false) { 
            return; 
        }
        
        if(this._logLevel > LogLevel.WARNING) {
            return;
        }

        console.warn(message, params);
    }

    public static Error(message, ...params){
        if (this._isDebug === false) { 
            return; 
        }
        
        if(this._logLevel > LogLevel.ERROR) {
            return;
        }

        console.error(message, params);
    }

    public static Exception(message, ...params){
        if (this._isDebug === false) { 
            return; 
        }

        console.error(message, params);
    }
}
