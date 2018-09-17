import EventEmitter from 'wolfy87-eventemitter'
import { List } from 'immutable'
const api = process.env.POSTGRES_USER || ''

// module.exports = (token) => fetch(`${api}/api/settings`, {
//     method: 'GET',
//     mode: "cors",
//     headers: {
//         "Content-Type": "application/json; charset=utf-8",
//         "Authorization": `Bearer ${token}`,
//         // "Content-Type": "application/x-www-form-urlencoded",
//     },
// }).then(res => res.json())

const handleError = (error)=>{
    console.error(error)
}

export class Settings extends EventEmitter {
    constructor(token) {
        super()
        this._token = token
        this._settings = List()
        this._init().catch(/*todo*/handleError)
    }

    async _init() {
        let settings = await this._getSettings({})
        settings.forEach((setting)=>this._settings = this._settings.set(setting.id, setting))
        this.emit('initialized', this._settings)
    }

    _getSettings({token = this._token}) {
        return fetch(`${api}/api/settings`, {
            method: 'GET',
            mode: "cors",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Bearer ${token}`,
                // "Content-Type": "application/x-www-form-urlencoded",
            },
        }).then(res => res.json()).catch(/*todo*/handleError)
    }
    _updateSetting(key, value) {
        this._settings = fetch(`${api}/api/settings?key=${key}&value=${value}`, {
            method: 'PUT',
            mode: "cors",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Bearer ${this._token}`,
                // "Content-Type": "application/x-www-form-urlencoded",
            },
        }).catch(/*todo*/handleError)
    }
    set(id, value) {
        let newData = this._settings.get(id)
        newData.value = value
        this._settings = this._settings.set(id, newData)
        this._updateSetting(newData.key, value)
        this.emit('update', {id, newData})
    }
    get(key) {
        return (!key) ? this._settings : this._settings.get(key)
    }
}


