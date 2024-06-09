// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import * as fs from 'fs';
import * as semver from 'semver';

import * as toolCache from '@actions/tool-cache';
import * as core from '@actions/core';


const sopsToolName = 'sops';

// this value is fallback version
const stableSopsVersion = 'v3.8.1';

const sopsAllReleasesUrl = 'https://api.github.com/repos/getsops/sops/releases';

function getExecutableExtension(): string {
    if (os.platform() === 'win32') {
        return '.exe';
    }
    return '';
}

function getSopsDownloadURL(version: string): string {
    let downloadSuffix: string
    if (os.platform() === 'win32') {
        downloadSuffix = 'exe'
    } else if(os.arch() === 'x64') {
        downloadSuffix = `${os.platform()}.amd64`
    } else {
        downloadSuffix = `${os.platform()}.${os.arch()}`
    }
    return `https://github.com/getsops/sops/releases/download/${version}/sops-${version}.${downloadSuffix}`
}

async function getStableSopsVersion(): Promise<string> {
    try {
        const downloadPath = await toolCache.downloadTool(sopsAllReleasesUrl);
        const responseArray = JSON.parse(fs.readFileSync(downloadPath, 'utf8').toString().trim());
        let latestSopsVersion = semver.clean(stableSopsVersion);
        responseArray.forEach((response: { tag_name: { toString: () => string; }; }) => {
            if (response && response.tag_name) {
                let currentSopsVerison = semver.clean(response.tag_name.toString());
                if (currentSopsVerison) {
                    if (currentSopsVerison.toString().indexOf('rc') == -1 && semver.gt(currentSopsVerison, latestSopsVersion)) {
                        //If current sops version is not a pre release and is greater than latest sops version
                        latestSopsVersion = currentSopsVerison;
                    }
                }
            }
        });
        latestSopsVersion = "v" + latestSopsVersion;
        return latestSopsVersion;
    } catch (error) {
        core.warning(util.format("Cannot get the latest Sops info from %s. Error %s. Using default Sops version %s.", sopsAllReleasesUrl, error, stableSopsVersion));
    }

    return stableSopsVersion;
}


const walkSync = function (dir: string, filelist: string[], fileToFind: string) {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist, fileToFind);
        } else {
            core.debug(file);
            if (file == fileToFind) {
                filelist.push(path.join(dir, file));
            }
        }
    });
    return filelist;
};

async function downloadSops(version: string): Promise<string> {
    if (!version) { version = await getStableSopsVersion(); }
    let cachedToolPath = toolCache.find(sopsToolName, version);
    if (!cachedToolPath) {
        let sopsDownloadPath: fs.PathLike;
        try {
            sopsDownloadPath = await toolCache.downloadTool(getSopsDownloadURL(version));
        } catch (exception) {
            throw new Error(util.format("Failed to download Sops from location ", getSopsDownloadURL(version)));
        }

        fs.chmodSync(sopsDownloadPath, '777');
        cachedToolPath = await toolCache.cacheFile(sopsDownloadPath, sopsToolName + getExecutableExtension(), sopsToolName, version);
    }

    const sopsPath = findSops(cachedToolPath);
    if (!sopsPath) {
        throw new Error(util.format("Sops executable not found in path ", cachedToolPath));
    }

    fs.chmodSync(sopsPath, '777');
    return sopsPath;
}

function findSops(rootFolder: string): string {
    fs.chmodSync(rootFolder, '777');
    const files: string[] = [];
    walkSync(rootFolder, files, sopsToolName + getExecutableExtension());
    if (!files) {
        throw new Error(util.format("Sops executable not found in path ", rootFolder));
    }
    else {
        return files[0];
    }
}

async function run() {
    let version = core.getInput('version', { 'required': true });
    if (version.toLocaleLowerCase() === 'latest') {
        version = await getStableSopsVersion();
    } else if (!version.toLocaleLowerCase().startsWith('v')) {
        version = 'v' + version;
    }

    let cachedPath = await downloadSops(version);

    try {
        if (!process.env['PATH'].startsWith(path.dirname(cachedPath))) {
            core.addPath(path.dirname(cachedPath));
        }
    }
    catch {
        //do nothing, set as output variable
    }

    console.log(`Sops tool version: '${version}' has been cached at ${cachedPath}`);
    core.setOutput('sops-path', cachedPath);
}

run().catch(core.setFailed);
