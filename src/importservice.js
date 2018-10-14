/*

    A service to handle file import from external cloud storage services.

    This is rather meant as API service, to query notebook server for import / export state,
    and manage import / export tasks.
*/

import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';


export default class ImportService {

    constructor () {
        this.serverConnectionSettings = ServerConnection.makeSettings();
        // is baseUrl guaranteed to end in a slash?
        this.apiURL = URLExt.join(this.serverConnectionSettings.baseUrl, '/api/fetch');
    }

    buildUrl(path) {
        // build api url to workspace folder
        return URLExt.join(this.apiURL, path);
        // alternative method:
        // const url = new URL(
        //.   EXTENSION_API_PATH,
        //.   this.serverConnectionSettings.baseUrl
        //. );
    }

    /**
     * Make an API call
     *
     * path ... the contents / workspace folder to work within
     * files ... object(s) {'url', 'name'? } to fetch
     *
     * returns a Promise with  resolves to status ok or error
     */
    async post(path, files) {
        const url = this.buildUrl(path);
        const resp = await ServerConnection.makeRequest(
            url,
            {
                method: 'POST' ,
                body: JSON.stringify(files),
                mode: 'same-origin'
                // TODO: content'tyep header? contentType: "application/json",
            },
            this.serverConnectionSettings
        );
        return resp.json();
    }

    /**
     *
     * path ... contents / workspace folder to query
     *
     * returns list of current fetches in progress
     *
     * TODO: add option to retrieve finished fetches?
     */
    async get(path) {
        const url = this.buildUrl(path);
        const resp = await ServerConnection.makeRequest(
            url,
            {
                method: 'GET' ,
                mode: 'same-origin'
            },
            this.serverConnectionSettings
        );
        return resp.json();
    }

}
