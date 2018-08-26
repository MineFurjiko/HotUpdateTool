var HotUpdateEventType = cc.Enum({
    CheckEvent: -1,
    UpdateEvent: -1,
    NotifyEvent: -1
});

var HotUpdateManager = cc.Class({
    extends: cc.Component,

    properties: {
        storageFolder: '',
        manifestUrl: cc.RawAsset,
        fix: false,
        fixHost: '',

        _checking: false,
        _checked: false,
        _checkResult: -1,

        _updating: false,
        _canRetry: false,

        _storagePath: '',
        _initialized: false,
        _loadLocalManifestSucceed: false
    },

    /**
     * use this for initialization
     */
    init() {
        // Reset init
        this._checking = false;
        this._checked = false;
        this._checkResult = -1;
        this._updating = false;
        this._canRetry = false;
        this._initialized = false;
        this._loadLocalManifestSucceed = false;

        this._creatAssetsManager(this.storageFolder, this._versionCompareHandle);

        if (this.fix) {
            cc.log('Start to fix local manifest...');
            this._replyHotUpdateEvent('Start to fix local manifest...');

            //fix manifest url
            cc.loader.load(this.manifestUrl, (err, res) => {
                if (err) {
                    cc.log(err);
                    this._replyHotUpdateEvent(err);
                    return;
                }

                let temp = JSON.parse(res);
                temp.packageUrl = 'http://' + this.fixHost + '/videoPlayer/remote-assets/';
                temp.remoteManifestUrl = 'http://' + this.fixHost + '/videoPlayer/remote-assets/project.manifest';
                temp.remoteVersionUrl = 'http://' + this.fixHost + '/videoPlayer/remote-assets/version.manifest';
                let fixedManifestStr = JSON.stringify(temp);
                cc.log(fixedManifestStr);

                this._loadCustomManifest(
                    new jsb.Manifest(fixedManifestStr, this._storagePath),
                    (rs) => {
                        if (rs == null) {
                            this._loadLocalManifestSucceed = false;
                            cc.log('Failed to load local manifest ...');
                            this._replyHotUpdateEvent('Failed to load local manifest ...');
                        } else {
                            this._loadLocalManifestSucceed = true;
                            cc.log('Local version : ' + rs.getVersion());
                            this._replyHotUpdateEvent('Local version : ' + rs.getVersion());
                        }
                    }
                );
                this._initialized = true;
            });
            return;
        } else {
            cc.log('Start to load local manifest...');
            this._replyHotUpdateEvent('Start to load local manifest...');

            this._loadLocalManifest(
                this.manifestUrl,
                (rs) => {
                    if (rs == null) {
                        this._loadLocalManifestSucceed = false;

                        cc.log('Failed to load local manifest ...');
                        this._replyHotUpdateEvent('Failed to load local manifest ...');
                    } else {
                        this._loadLocalManifestSucceed = true;

                        cc.log('Local version : ' + rs.getVersion());
                        this._replyHotUpdateEvent('Local version : ' + rs.getVersion());
                    }
                }
            );
            this._initialized = true;
        }
    },

    getLocalVersion() {
        if (!this._initialized) {
            return null;
        }

        if (!this._loadLocalManifestSucceed) {
            return null;
        }

        return this._am.getLocalManifest().getVersion();
    },

    checkUpdate() {
        if (!this._initialized) {
            cc.log('Please do init work...');
            this._replyHotUpdateEvent('Please do init work...');
            return;
        }

        if (this._checking) {
            cc.log('Please wait for the check work...');
            this._replyHotUpdateEvent('Please wait for the check work...');
            return;
        }

        if (this._updating) {
            cc.log('Please wait for the update work...');
            this._replyHotUpdateEvent('Please wait for the update work...');
            return;
        }

        if (this._checked) {
            let event = {
                code: this._checkResult,
                getEventCode: function () {
                    return this.code;
                }
            };
            cc.log('Update has been checked. Check result :' + this._checkResult);
            this._replyHotUpdateEvent(event, HotUpdateEventType.CheckEvent);
            return;
        }

        if (!this._loadLocalManifestSucceed) {
            cc.log('Failed to load local manifest ...');
            let event = {
                code: jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST,
                getEventCode: function () {
                    return this.code;
                }
            };
            this._replyHotUpdateEvent(event, HotUpdateEventType.CheckEvent);
            this._checked = true;
            this._checkResult = jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST;
            return;
        }

        cc.log('Do check work...');
        this._replyHotUpdateEvent('Do check work...');

        this._checkListener = new jsb.EventListenerAssetsManager(this._am, this._checkCallback.bind(this));
        cc.eventManager.addListener(this._checkListener, 1);

        this._am.checkUpdate();
        this._checking = true;
    },

    hotUpdate() {
        if (!this._initialized) {
            cc.log('Please do init work...');
            this._replyHotUpdateEvent('Please do init work...');
            return;
        }

        if (this._updating) {
            cc.log('Please wait for the update work...');
            this._replyHotUpdateEvent('Please wait for the update work...');
            return;
        }

        if (!this._checked) {
            if (this._checking) {
                cc.log('Please wait for the check work...');
                this._replyHotUpdateEvent('Please wait for the check work...');
                return;
            }
            cc.log('Please check the update first...');
            this._replyHotUpdateEvent('Please check the update first...');
            return;
        }

        if (this._checkResult == jsb.EventAssetsManager.ALREADY_UP_TO_DATE) {
            cc.log('Already up to date...');
            let event = {
                code: jsb.EventAssetsManager.ALREADY_UP_TO_DATE,
                getEventCode: function () {
                    return this.code;
                }
            };
            this._replyHotUpdateEvent(event, HotUpdateEventType.UpdateEvent);
            return;
        }

        if (this._checkResult == jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST) {
            cc.log('Failed to load local manifest ...');
            let event = {
                code: jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST,
                getEventCode: function () {
                    return this.code;
                }
            };
            this._replyHotUpdateEvent(event, HotUpdateEventType.UpdateEvent);
            return;
        }

        if (this._checkResult == jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST ||
            this._checkResult == jsb.EventAssetsManager.ERROR_PARSE_MANIFEST) {
            cc.log('Fail to download manifest file, hot update skipped.');
            let event = {
                code: this._checkResult,
                getEventCode: function () {
                    return this.code;
                }
            };
            this._replyHotUpdateEvent(event, HotUpdateEventType.UpdateEvent);
            return;
        }

        if (this._checkResult == jsb.EventAssetsManager.NEW_VERSION_FOUND) {
            if (this._am) {
                this._replyHotUpdateEvent('Start update work...');

                this._updateListener = new jsb.EventListenerAssetsManager(this._am, this._updateCallback.bind(this));
                cc.eventManager.addListener(this._updateListener, 1);

                this._failCount = 0;
                this._am.update();

                this._updating = true;
            }
        }
    },

    retry() {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;

            cc.log('Retry failed Assets...');
            this._am.downloadFailedAssets();
        }
    },

    _checkCallback(event) {
        this._replyHotUpdateEvent(event, HotUpdateEventType.CheckEvent);

        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                cc.log('[check] No local manifest file found, hot update skipped.');
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                cc.log('[check] Fail to download manifest file, hot update skipped.');
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                cc.log('[check] Already up to date with the latest remote version.');
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                cc.log('[check] New version found, please try to update.');
                break;
            default:
                return;
        }

        cc.eventManager.removeListener(this._checkListener);
        this._checkListener = null;
        this._checking = false;
        this._checked = true;
        this._checkResult = event.getEventCode();
    },

    _updateCallback(event) {
        this._replyHotUpdateEvent(event, HotUpdateEventType.UpdateEvent);

        let needRestart = false;
        let failed = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                cc.log('[update] byteProgress: ' + event.getPercent());
                cc.log('[update] fileProgress: ' + event.getPercentByFile());

                cc.log('[update] filesDetails: ' + event.getDownloadedFiles() + ' / ' + event.getTotalFiles());
                cc.log('[update] BytesDetails: ' + event.getDownloadedBytes() + ' / ' + event.getTotalBytes());
                let msg = event.getMessage();
                if (msg) {
                    cc.log('[update] ' + event.getPercent() / 100 + '% : ' + msg);
                }
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                cc.log('[update] Update finished. ' + event.getMessage());
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                cc.log('[update] Update failed. ' + event.getMessage());
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                cc.log('[update] Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                cc.log('[update] ' + event.getMessage());
                break;
            default:
                break;
        }

        if (failed) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            // console.log(JSON.stringify(newPaths));
            Array.prototype.unshift(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    },

    addHotUpdateEventCallback(callback) {
        if (this._hotUpdateEventDelegate == null) {
            this._hotUpdateEventDelegate = [];
        }
        this._hotUpdateEventDelegate.push(callback);
    },

    _replyHotUpdateEvent(event, eventType) {
        if (eventType == null) {
            eventType = HotUpdateEventType.NotifyEvent;
        }

        if (this._hotUpdateEventDelegate != null) {
            for (const callback of this._hotUpdateEventDelegate) {
                callback(event, eventType);
            }
        }
    },

    /**
     * load local manifest
     * @param {cc.RawAsset} manifestUrl 
     * @param {function} callback 
     */
    _loadLocalManifest(manifestUrl, callback = null) {
        if (!this._am) retrun;

        this._am.loadLocalManifest(manifestUrl);

        if (callback) {
            if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
                callback(null);
                return;
            }
            callback(this._am.getLocalManifest());
        }
    },

    /**
     * load custom manifest
     * @param {cc.RawAsset} manifestUrl 
     * @param {function} callback 
     */
    _loadCustomManifest(manifestUrl, callback = null) {
        if (!this._am) retrun;

        this._am.loadLocalManifest(manifestUrl, this._storagePath);

        if (callback) {
            if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
                callback(null);
                return;
            }
            callback(this._am.getLocalManifest());
        }
    },

    /**
     * creat AssetsManager
     * @param {string} storageFolder 
     * @param {function} versionCompareHandle 
     */
    _creatAssetsManager(storageFolder, versionCompareHandle) {
        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            return;
        }

        if (storageFolder == null || storageFolder == '') {
            storageFolder = 'hot-update-asset';
        }

        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + storageFolder);
        cc.log('Storage path for remote asset : ' + this._storagePath);


        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager('', this._storagePath, versionCompareHandle);
        if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.retain();
        }

        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this._am.setVerifyCallback(
            (path, asset) => {
                // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
                let compressed = asset.compressed;
                // Retrieve the correct md5 value.
                let expectedMD5 = asset.md5;
                // asset.path is relative path and path is absolute.
                let relativePath = asset.path;
                // The size of asset file, but this value could be absent.
                let size = asset.size;
                if (compressed) {
                    return true;
                }
                else {
                    return true;
                }
            }
        );

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am.setMaxConcurrentTask(2);
        }

        this._replyHotUpdateEvent('Hot update is ready, please check or directly update.');
    },

    /**
     * Setup your own version compare handler
     * @param {string} versionA 
     * @param {string} versionB 
     */
    _versionCompareHandle(versionA, versionB) {
        cc.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);

        let vA = versionA.split('.');
        let vB = versionB.split('.');
        for (let i = 0; i < vA.length; ++i) {
            let a = parseInt(vA[i]);
            let b = parseInt(vB[i] || 0);
            if (a === b) {
                continue;
            }
            else {
                return a - b;
            }
        }
        if (vB.length > vA.length) {
            return -1;
        }
        else {
            return 0;
        }
    },

    onLoad() { },

    onDestroy() {
        if (this._updateListener) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
        }
        if (this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.release();
        }
    }
});

module.exports = {
    HotUpdateEventType: HotUpdateEventType,
    HotUpdateManager: HotUpdateManager
};
