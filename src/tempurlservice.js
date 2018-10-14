/*

    A service to handle file import from external cloud storage services.

    This is rather meant as API service, to query notebook server for import / export state,
    and manage import / export tasks.
*/

import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';


export default class TempUrlsService {

    constructor () {
        this.serverConnectionSettings = ServerConnection.makeSettings();
        // is baseUrl guaranteed to end in a slash?
        this.apiURL = URLExt.join(this.serverConnectionSettings.baseUrl, '/api/tmpurl');
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
     * files ... list of names within path to generate temp url for
     *
     * returns a Promise with resolves to status ok or error
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

}
