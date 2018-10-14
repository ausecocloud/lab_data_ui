
import * as React from 'react';

import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';

// TODO: maybe change strategy here...
//       Every item get's a timeout... if something doesn't receive an update it
//       will be removed.
export default class ProgressArea extends VDomRenderer {

    constructor(importer) {
        super();
        this.importer = importer;

        this.addClass('progressarea');
        this.model = new VDomModel();

        this.progress_timer = null;
        this._paths = [];

        this._exports = [];
    }

    startWatch(path) {
        if (this.progress_timer) {
            // already running
            return
        }
        if (this._paths.includes(path)) {
            // already watching this folder
            return
        }
        this._paths.push(path);
        this.progress_timer = window.setTimeout(() => this.updateProgress(), 1000);
    }

    getExportById(id) {
        for(let i=0, len=this._exports.length ; i < len; i++ ) {
            const _export = this._exports[i];
            if (_export.id === id) {
                return {entry: _export, idx: i};
            }
        }
        return {entry: null, idx: -1};
    }

    addExport(title) {
        const exportId =  Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
        this._exports.push({id: exportId, title, progress: 0, error: 0});
        this.model.stateChanged.emit(void 0);
        return exportId;
    }

    updateExport(id, progress) {
        const {entry, idx} = this.getExportById(id);
        if (entry !== null && entry.progress !== progress) {
            entry.progress = progress;
            this.model.stateChanged.emit(void 0);
        }
    }

    finishExport(id, error) {
        const {entry, idx} = this.getExportById(id);
        entry.error = error;
        if (error) {
            this.model.stateChanged.emit(void 0);
            window.setTimeout(() => this.removeExport(id), 5000);
        } else {
            this.removeExport(id);
        }
    }

    removeExport(id) {
        const {entry, idx} = this.getExportById(id);
        this._exports.splice(idx, 1);
        this.model.stateChanged.emit(void 0);
    }

    async updateProgress() {
        if (this._paths.length == 0) {
            // nothing to update ... don't restart timer and clear progress area
            this.setItems([]);
            this.progress_timer = null;
            return
        }

        const results = await Promise.all(this._paths.map(async (path) => {
            const result = await this.importer.get(path);
            return { path, result };
        }));
        // build progress datas structure
        const items = {}
        results.forEach((item) => {
            const { path, result } = item;
            // set to true to continue polling this path
            let poll = false;
            Object.keys(result.value).forEach(function(key, idx) {
                const file = result.value[key];
                let progress = file.progress;
                if (progress.size < 0) {
                    progress = 100; // unknown size... we show the full progress bar
                    // text = file_size(progress.bytes)
                } else {
                    progress = progress.bytes * 100 / progress.size;
                    // text = percent.toFixed(0) + '%'
                }
                if (file.state < 3) { // state < 3 still in progress
                    poll = true;
                }
                const itemkey = path + '/' + file.name;
                items[itemkey] = { key: itemkey, name: file.name, progress };
            });
            if (!poll) {
                // all finished remove path from this._paths next update will clear progress area
                this._paths.splice(this._paths.indexOf(path), 1);
            }
        });
        // items now has all we need
        // convert it into a sorted list by key
        const newItems = Object.keys(items).sort().map(item => items[item]);
        this.setItems(newItems);
        // start timer again
        this.progress_timer = window.setTimeout(() => this.updateProgress(), 1000);
    }

    setItems(items) {
        const newModel = new VDomModel();
        newModel.items = items;
        this.model = newModel;
    }

    render() {

        const items = this.model.items || [];

        const imports = items.map((item) => {
            return (
                <div key={item.key} className="progress-line">
                  <div className="bar" style={{width: item.progress + '%'}}>
                    <p className="title">{item.name}</p>
                  </div>
                </div>
            );
        });
        const _exports = this._exports.map((entry) => {
            if (entry.error) {
                return (
                    <div key={entry.id} className="progress-line">
                      <div className="bar error" style={{width: 100 + '%'}}>
                        <p className="title">{entry.title} failed.</p>
                      </div>
                    </div>
                );
            } else {
                return (
                    <div key={entry.id} className="progress-line">
                      <div className="bar" style={{width: Math.round(entry.progress * 100) + '%'}}>
                        <p className="title">{entry.title}</p>
                      </div>
                    </div>
                );
            }
        });
        return [imports, _exports];
    }
}
