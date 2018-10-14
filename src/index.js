
import '../style/index.css';

import {
    JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import { ISettingRegistry } from '@jupyterlab/coreutils';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { each } from '@phosphor/algorithm';

import { Menu, Widget } from '@phosphor/widgets';

import ScriptLoader from './scriptloader';
import ImportService from './importservice';
import TempUrlService from './tempurlservice';
import ProgressArea from './progressarea';


const CommandIDs = {
    dropboxSaver: 'dropbox:saver',
    dropboxChooser: 'dropbox:chooser'
}


function getCurrentPath(browserFactory) {
    return browserFactory.defaultBrowser.model.path;
    // bf.defaultBrowser.model.parent
    // bf.defaultBrowser.model.node
    // bf.defaultBrowser.model.layout (PanelLayout)
}


async function activate(app, palette, mainMenu, browserFactory, settingRegistry) {
    console.log('Activating DropBox extension.');

    let appkey = "";
    try {
        const settings = await settingRegistry.load(labDataUi.id + ":plugin")
        appkey = settings.get('appkey').composite;
    } catch (err) {
        console.error('Could not load settings for ' + labDataUi.id);
    }

    if (!appkey) {
        console.warn("Warning: DropBox appkey not found!");
    }

    const dropin = new ScriptLoader({
        src: 'https://www.dropbox.com/static/api/2/dropins.js',
        id: 'dropboxjs',
        attributes: {
            'data-app-key': appkey
        }
    }).load();

    const importer = new ImportService();
    const tempurl = new TempUrlService();
    const pbar = new ProgressArea(importer);
    window.bf = browserFactory;
    browserFactory.defaultBrowser.layout.addWidget(pbar);

    // define commands
    const { commands } = app;
    commands.addCommand(
        CommandIDs.dropboxChooser,
        {
            label: 'Import',
            caption: 'Import',
            execute: () => {
                const options = {
                    success: async function(files) {
                        // clean up Dropbox file data
                        for (let i = 0; i < files.length; i++) {
                            // dropbox has download url in 'link' key
                            files[i]['url'] = files[i]['link']
                            delete files[i]['link']
                        }
                        const path = getCurrentPath(browserFactory);
                        // wait for import submit
                        await importer.post(path, files);
                        // start progress tracker
                        pbar.startWatch(path);

                    },
                    cancel: function() {
                      //optional
                    },
                    linkType: "direct",
                    multiselect: true,
                };
                Dropbox.choose(options);
            }
        }
    );
    commands.addCommand(
        CommandIDs.dropboxSaver,
        {
            label: 'Export',
            caption: 'Export',
            execute: async () => {
                // generate random id
                const selected = [];
                each(browserFactory.defaultBrowser.selectedItems(), item => {
                    if (item.type !== 'directory') {
                        selected.push(item.name);
                    }
                });
                if (selected.length == 0) {
                    // no files selected... TODO: inform user?
                    return;
                }
                // build list of files for saver
                const path = getCurrentPath(browserFactory);
                const tempurls = await tempurl.post(path, selected);
                const files = tempurls.map(item => ({url: item.url, filename: item.name}));
                // define a progress callback
                const progress_callback = function(progress) {
                    pbar.updateExport(exportId, progress);
                }
                // build saver
                const options = {
                    files: files,
                    success: function() {
                        pbar.finishExport(exportId, null);
                        console.log('Export to dropbox finished.');
                    },
                    progress: progress_callback,
                    cancel: function() {
                        pbar.finishExport(exportId, null);
                        console.log('Export Cancelled');
                    },
                    error: function(errorMessage) {
                        pbar.finishExport(exportId, errorMessage);
                        console.log('Export to Dropbox failed: ', errorMessage);
                    }
                };
                const exportId = pbar.addExport('Export to Dropbox');
                Dropbox.save(options);
            }
        }
    );

    // setup main menu
    let menu = new Menu({commands});
    menu.title.label='Dropbox';
    [
        CommandIDs.dropboxChooser,
        CommandIDs.dropboxSaver,
    ].forEach(command => menu.addItem({command}))

    mainMenu.addMenu(menu,{rank:2000});

}

/**
 * Initialization data for the lab_data_ui extension.
 */

const labDataUi = {
  id: 'lab_data_ui',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu, IFileBrowserFactory, ISettingRegistry],
  activate: activate
};


export default labDataUi;
