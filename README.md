# lab_data_ui

A JupyterLab extension.


## Prerequisites

* JupyterLab

## Installation

```bash
jupyter labextension install lab_data_ui
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link
```

To rebuild the package and the JupyterLab app:

```bash
jupyter lab build
```

Run jupyterlab watching for code changes:

```bash
export JUPYTER_ENABLE_LAB=1
start-notebook.sh --ip="0.0.0.0" --watch
```

in a second shell run:

```bash
npm run watch
```

to watch changes to the source files. Thes changes get transpiled into the lib folder,
where the jupyter lab watch process will pick them up.


Settings:
=========

Put settings into a file named: ~/.jupyter/lab/user-settings/lab_data_ui/plugin.jupyterlab-settings.

```json
{
    "appkey": "dropbox app key"
}
```
