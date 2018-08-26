var _HotUpdateManager = require('HotUpdateManager');
var HotUpdateManager = _HotUpdateManager.HotUpdateManager;
var HotUpdateEventType = _HotUpdateManager.HotUpdateEventType;

cc.Class({
    extends: cc.Component,

    properties: {
        hotUpdateManager: HotUpdateManager,
        logger: cc.Label,
        loadBtn: cc.Node,
        checkBtn: cc.Node,
        updateBtn: cc.Node,
        retryBtn: cc.Node,
        fileProgress: cc.ProgressBar,
        byteProgress: cc.ProgressBar,
        fileLabel: cc.Label,
        byteLabel: cc.Label,
        fixToggle: cc.Toggle,
        hostInput: cc.EditBox,
        _needReload: false
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad() {
        this.hotUpdateManager.addHotUpdateEventCallback(this.hotUpdateEventHandler.bind(this));

        this.hotUpdateManager.fix = this.fixToggle.isChecked;
        this.hotUpdateManager.fixHost = this.hostInput.string;
    },

    onFixToggleValueChange(toggle, customEventData) {
        this.hotUpdateManager.fix = toggle.isChecked;
        this._needReload = true;
    },

    onEditingDidEnded(editbox, customEventData) {
        this.hotUpdateManager.fixHost = editbox.string;
        this._needReload = true;
    },

    hotUpdateEventHandler(event, eventType) {
        switch (eventType) {
            case HotUpdateEventType.CheckEvent:
                this._checkEventHandler(event);
                break;
            case HotUpdateEventType.UpdateEvent:
                this._updateEventHandler(event);
                break;
            case HotUpdateEventType.NotifyEvent:
                this._notifyEventHanlder(event);
                break;
            default: break;
        }
    },

    _checkEventHandler(event) {
        // cc.log('Check Code: ' + event.getEventCode());

        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.logger.string += "\n(Check) No local manifest file found, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.logger.string += "\n(Check) Fail to download manifest file, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.logger.string += "\n(Check) Already up to date with the latest remote version.";
                this.logger.string += "\n(Check) 已是最新版本.";

                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                this.logger.string += "\n(Check) New version found, please try to update.";
                this.logger.string += "\n(Check) 检测到新版本.";

                this.fileProgress.progress = 0;
                this.byteProgress.progress = 0;

                // this.checkBtn.active = false;
                break;
            default: return;
        }
    },

    _updateEventHandler(event) {
        cc.log('Update Code: ' + event.getEventCode());

        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                this.fileProgress.progress = event.getPercentByFile();
                this.byteProgress.progress = event.getPercent();

                this.fileLabel.string = 'files: ' + event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                this.byteLabel.string = 'bytes: ' + event.getDownloadedBytes() + ' / ' + event.getTotalBytes();

                let msg = event.getMessage();
                if (msg) {
                    this.logger.string += '\n(Update) Updated file: ' + msg;
                }
                break;

            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.logger.string += '\n(Update) Update finished. ' + event.getMessage();

                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.logger.string += '\n(Update) Update failed. ' + event.getMessage();
                this.retryBtn.active = true;

                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.logger.string += '\n(Update) Asset update error: ' + event.getAssetId() + ', ' + event.getMessage();

                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.logger.string += '\n(Update) ' + event.getMessage();

                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.logger.string += '\n(Update) Already up to date with the latest remote version.';
                this.logger.string += "\n(Update) 已是最新版本.";

                break;
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.logger.string += "\n(Update) No local manifest file found, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.logger.string += "\n(Update) Fail to download manifest file, hot update skipped.";
                break;
            default: break;
        }

    },

    _notifyEventHanlder(message) {
        this.logger.string += '\n' + message;
    },

    onCheckButtomClick() {
        if (this._needReload) {
            this._notifyEventHanlder('Please reload ...');
            return;
        }
        this.hotUpdateManager.checkUpdate();
    },

    onUpdateButtomClick() {
        if (this._needReload) {
            this._notifyEventHanlder('Please reload ...');
            return;
        }
        this.hotUpdateManager.hotUpdate();
    },

    onRetryButtomClick() {
        if (this._needReload) {
            this._notifyEventHanlder('Please reload ...');
            return;
        }

        this.logger.string += '\nRetry failed Assets...';

        this.retryBtn.active = false;
        this.hotUpdateManager.retry();
    },

    onLoadButtomClick() {
        this.logger.string = 'Log:';
        this.hotUpdateManager.init();
        this._needReload = false;
    }
});
