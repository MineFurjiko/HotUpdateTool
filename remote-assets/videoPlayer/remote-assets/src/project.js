require = function i(r, c, o) {
function l(t, e) {
if (!c[t]) {
if (!r[t]) {
var s = "function" == typeof require && require;
if (!e && s) return s(t, !0);
if (d) return d(t, !0);
var a = new Error("Cannot find module '" + t + "'");
throw a.code = "MODULE_NOT_FOUND", a;
}
var n = c[t] = {
exports: {}
};
r[t][0].call(n.exports, function(e) {
return l(r[t][1][e] || e);
}, n, n.exports, i, r, c, o);
}
return c[t].exports;
}
for (var d = "function" == typeof require && require, e = 0; e < o.length; e++) l(o[e]);
return l;
}({
HotUpdateManager: [ function(e, t, s) {
"use strict";
cc._RF.push(t, "2d822IyYZ1PXK5i+dpKeyl5", "HotUpdateManager");
var c = cc.Enum({
CheckEvent: -1,
UpdateEvent: -1,
NotifyEvent: -1
}), a = cc.Class({
extends: cc.Component,
properties: {
storageFolder: "",
manifestUrl: cc.RawAsset,
_checking: !1,
_checked: !1,
_checkResult: -1,
_updating: !1,
_canRetry: !1,
_storagePath: "",
_initialized: !1,
_loadLocalManifestSucceed: !1
},
init: function() {
var t = this;
this._creatAssetsManager(this.storageFolder, this._versionCompareHandle);
this._loadLocalManifest(this.manifestUrl, function(e) {
if (null == e) {
t._loadLocalManifestSucceed = !1;
cc.log("Failed to load local manifest ...");
t._replyHotUpdateEvent("Failed to load local manifest ...");
} else {
t._loadLocalManifestSucceed = !0;
cc.log("Local version : " + e.getVersion());
t._replyHotUpdateEvent("Local version : " + e.getVersion());
}
});
this._initialized = !0;
},
getLocalVersion: function() {
return this._initialized && this._loadLocalManifestSucceed ? this._am.getLocalManifest().getVersion() : null;
},
checkUpdate: function() {
if (this._initialized) if (this._checking) {
cc.log("Please wait for the last check...");
this._replyHotUpdateEvent("Please wait for the last check...");
} else if (this._checked) {
var e = {
code: this._checkResult,
getEventCode: function() {
return this.code;
}
};
cc.log("Update has been checked. Check result :" + this._checkResult);
this._replyHotUpdateEvent(e, c.CheckEvent);
} else if (this._loadLocalManifestSucceed) {
cc.log("Do check work...");
this._replyHotUpdateEvent("Do check work...");
this._checkListener = new jsb.EventListenerAssetsManager(this._am, this._checkCallback.bind(this));
cc.eventManager.addListener(this._checkListener, 1);
this._am.checkUpdate();
this._checking = !0;
} else {
cc.log("Failed to load local manifest ...");
var t = {
code: jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST,
getEventCode: function() {
return this.code;
}
};
this._replyHotUpdateEvent(t, c.CheckEvent);
this._checked = !0;
this._checkResult = jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST;
} else {
cc.log("Please do init work...");
this._replyHotUpdateEvent("Please do init work...");
}
},
hotUpdate: function() {
if (this._initialized) if (this._updating) {
cc.log("Please wait for the update work...");
this._replyHotUpdateEvent("Please wait for the update work...");
} else if (this._checked) if (this._checkResult != jsb.EventAssetsManager.ALREADY_UP_TO_DATE) if (this._checkResult != jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST) if (this._checkResult != jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST && this._checkResult != jsb.EventAssetsManager.ERROR_PARSE_MANIFEST) {
if (this._checkResult == jsb.EventAssetsManager.NEW_VERSION_FOUND && this._am) {
this._replyHotUpdateEvent("Start update work...");
this._updateListener = new jsb.EventListenerAssetsManager(this._am, this._updateCallback.bind(this));
cc.eventManager.addListener(this._updateListener, 1);
this._failCount = 0;
this._am.update();
this._updating = !0;
}
} else {
cc.log("Fail to download manifest file, hot update skipped.");
var e = {
code: this._checkResult,
getEventCode: function() {
return this.code;
}
};
this._replyHotUpdateEvent(e, c.UpdateEvent);
} else {
cc.log("Failed to load local manifest ...");
var t = {
code: jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST,
getEventCode: function() {
return this.code;
}
};
this._replyHotUpdateEvent(t, c.UpdateEvent);
} else {
cc.log("Already up to date...");
var s = {
code: jsb.EventAssetsManager.ALREADY_UP_TO_DATE,
getEventCode: function() {
return this.code;
}
};
this._replyHotUpdateEvent(s, c.UpdateEvent);
} else {
if (this._checking) {
cc.log("Please wait for the check work...");
this._replyHotUpdateEvent("Please wait for the check work...");
return;
}
cc.log("Please check the update first...");
this._replyHotUpdateEvent("Please check the update first...");
} else {
cc.log("Please do init work...");
this._replyHotUpdateEvent("Please do init work...");
}
},
retry: function() {
if (!this._updating && this._canRetry) {
this._canRetry = !1;
cc.log("Retry failed Assets...");
this._am.downloadFailedAssets();
}
},
_checkCallback: function(e) {
this._replyHotUpdateEvent(e, c.CheckEvent);
switch (e.getEventCode()) {
case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
cc.log("[check] No local manifest file found, hot update skipped.");
break;

case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
cc.log("[check] Fail to download manifest file, hot update skipped.");
break;

case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
cc.log("[check] Already up to date with the latest remote version.");
break;

case jsb.EventAssetsManager.NEW_VERSION_FOUND:
cc.log("[check] New version found, please try to update.");
break;

default:
return;
}
cc.eventManager.removeListener(this._checkListener);
this._checkListener = null;
this._checking = !1;
this._checked = !0;
this._checkResult = e.getEventCode();
},
_updateCallback: function(e) {
this._replyHotUpdateEvent(e, c.UpdateEvent);
var t = !1;
switch (e.getEventCode()) {
case jsb.EventAssetsManager.UPDATE_PROGRESSION:
cc.log("[update] byteProgress: " + e.getPercent());
cc.log("[update] fileProgress: " + e.getPercentByFile());
cc.log("[update] filesDetails: " + e.getDownloadedFiles() + " / " + e.getTotalFiles());
cc.log("[update] BytesDetails: " + e.getDownloadedBytes() + " / " + e.getTotalBytes());
var s = e.getMessage();
s && cc.log("[update] " + e.getPercent() / 100 + "% : " + s);
break;

case jsb.EventAssetsManager.UPDATE_FINISHED:
cc.log("[update] Update finished. " + e.getMessage());
t = !0;
break;

case jsb.EventAssetsManager.UPDATE_FAILED:
cc.log("[update] Update failed. " + e.getMessage());
this._updating = !1;
this._canRetry = !0;
break;

case jsb.EventAssetsManager.ERROR_UPDATING:
cc.log("[update] Asset update error: " + e.getAssetId() + ", " + e.getMessage());
break;

case jsb.EventAssetsManager.ERROR_DECOMPRESS:
cc.log("[update] " + e.getMessage());
}
!1;
if (t) {
cc.eventManager.removeListener(this._updateListener);
this._updateListener = null;
var a = jsb.fileUtils.getSearchPaths(), n = this._am.getLocalManifest().getSearchPaths();
Array.prototype.unshift(a, n);
cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify(a));
jsb.fileUtils.setSearchPaths(a);
cc.audioEngine.stopAll();
cc.game.restart();
}
},
addHotUpdateEventCallback: function(e) {
null == this._hotUpdateEventDelegate && (this._hotUpdateEventDelegate = []);
this._hotUpdateEventDelegate.push(e);
},
_replyHotUpdateEvent: function(e, t) {
null == t && (t = c.NotifyEvent);
if (null != this._hotUpdateEventDelegate) {
var s = !0, a = !1, n = void 0;
try {
for (var i, r = this._hotUpdateEventDelegate[Symbol.iterator](); !(s = (i = r.next()).done); s = !0) {
(0, i.value)(e, t);
}
} catch (e) {
a = !0;
n = e;
} finally {
try {
!s && r.return && r.return();
} finally {
if (a) throw n;
}
}
}
},
_loadLocalManifest: function(e) {
var t = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : null;
this._am || retrun;
this._am.loadLocalManifest(e);
if (t) {
if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
t(null);
return;
}
t(this._am.getLocalManifest());
}
},
_creatAssetsManager: function(e, t) {
if (cc.sys.isNative) {
null != e && "" != e || (e = "hot-update-asset");
this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + e;
cc.log("Storage path for remote asset : " + this._storagePath);
this._am = new jsb.AssetsManager("", this._storagePath, t);
cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS || this._am.retain();
this._am.setVerifyCallback(function(e, t) {
t.compressed, t.md5, t.path, t.size;
return !0;
});
cc.sys.os === cc.sys.OS_ANDROID && this._am.setMaxConcurrentTask(2);
this._replyHotUpdateEvent("Hot update is ready, please check or directly update.");
}
},
_versionCompareHandle: function(e, t) {
cc.log("JS Custom Version Compare: version A is " + e + ", version B is " + t);
for (var s = e.split("."), a = t.split("."), n = 0; n < s.length; ++n) {
var i = parseInt(s[n]), r = parseInt(a[n] || 0);
if (i !== r) return i - r;
}
return a.length > s.length ? -1 : 0;
},
onLoad: function() {},
onDestroy: function() {
if (this._updateListener) {
cc.eventManager.removeListener(this._updateListener);
this._updateListener = null;
}
this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS && this._am.release();
}
});
t.exports = {
HotUpdateEventType: c,
HotUpdateManager: a
};
cc._RF.pop();
}, {} ],
HotUpdateUI: [ function(e, t, s) {
"use strict";
cc._RF.push(t, "1da9cO79kZCu4SsxzBulrnp", "HotUpdateUI");
var a = e("HotUpdateManager"), n = a.HotUpdateManager, i = a.HotUpdateEventType;
cc.Class({
extends: cc.Component,
properties: {
hotUpdateManager: n,
logger: cc.Label,
checkBtn: cc.Node,
updateBtn: cc.Node,
retryBtn: cc.Node,
fileProgress: cc.ProgressBar,
byteProgress: cc.ProgressBar,
fileLabel: cc.Label,
byteLabel: cc.Label
},
onLoad: function() {
this.hotUpdateManager.addHotUpdateEventCallback(this.hotUpdateEventHandler.bind(this));
this.hotUpdateManager.init();
},
start: function() {},
hotUpdateEventHandler: function(e, t) {
switch (t) {
case i.CheckEvent:
this._checkEventHandler(e);
break;

case i.UpdateEvent:
this._updateEventHandler(e);
break;

case i.NotifyEvent:
this._notifyEventHanlder(e);
}
},
_checkEventHandler: function(e) {
switch (e.getEventCode()) {
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
break;

default:
return;
}
},
_updateEventHandler: function(e) {
cc.log("Update Code: " + e.getEventCode());
switch (e.getEventCode()) {
case jsb.EventAssetsManager.UPDATE_PROGRESSION:
this.fileProgress.progress = e.getPercentByFile();
this.byteProgress.progress = e.getPercent();
this.fileLabel.string = "files: " + e.getDownloadedFiles() + " / " + e.getTotalFiles();
this.byteLabel.string = "bytes: " + e.getDownloadedBytes() + " / " + e.getTotalBytes();
var t = e.getMessage();
t && (this.logger.string += "\n(Update) Updated file: " + t);
break;

case jsb.EventAssetsManager.UPDATE_FINISHED:
this.logger.string += "\n(Update) Update finished. " + e.getMessage();
break;

case jsb.EventAssetsManager.UPDATE_FAILED:
this.logger.string += "\n(Update) Update failed. " + e.getMessage();
this.retryBtn.active = !0;
break;

case jsb.EventAssetsManager.ERROR_UPDATING:
this.logger.string += "\n(Update) Asset update error: " + e.getAssetId() + ", " + e.getMessage();
break;

case jsb.EventAssetsManager.ERROR_DECOMPRESS:
this.logger.string += "\n(Update) " + e.getMessage();
break;

case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
this.logger.string += "\n(Update) Already up to date with the latest remote version.";
this.logger.string += "\n(Update) 已是最新版本.";
break;

case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
this.logger.string += "\n(Update) No local manifest file found, hot update skipped.";
break;

case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
this.logger.string += "\n(Update) Fail to download manifest file, hot update skipped.";
}
},
_notifyEventHanlder: function(e) {
this.logger.string += "\n" + e;
},
onCheckButtomClick: function() {
this.hotUpdateManager.checkUpdate();
},
onUpdateButtomClick: function() {
this.hotUpdateManager.hotUpdate();
},
onRetryButtomClick: function() {
this.logger.string += "\nRetry failed Assets...";
this.retryBtn.active = !1;
this.hotUpdateManager.retry();
}
});
cc._RF.pop();
}, {
HotUpdateManager: "HotUpdateManager"
} ],
SceneManager: [ function(e, t, s) {
"use strict";
cc._RF.push(t, "84c30tGmYtPyrQDkEc/YEij", "SceneManager");
cc.Class({
extends: cc.Component,
nextScene: function() {
cc.director.loadScene("Main");
}
});
cc._RF.pop();
}, {} ],
videoPlayerHandler: [ function(e, t, s) {
"use strict";
cc._RF.push(t, "603f4d58xlBT448pmkNdl0+", "videoPlayerHandler");
cc.Class({
extends: cc.Component,
properties: {
logger: cc.Label
},
playerEventHandler: function(e, t, s) {
switch (t) {
case cc.VideoPlayer.EventType.META_LOADED:
this.logger.node.active && (this.logger.string += "\n视频信息加载完成");
break;

case cc.VideoPlayer.EventType.READY_TO_PLAY:
this.logger.node.active && (this.logger.string += "\n播放准备完成");
e.play();
break;

case cc.VideoPlayer.EventType.PLAYING:
this.logger.node.active && (this.logger.string += "\n播放中");
break;

case cc.VideoPlayer.EventType.COMPLETED:
this.logger.node.active && (this.logger.string += "\n播放完成");
}
}
});
cc._RF.pop();
}, {} ]
}, {}, [ "videoPlayerHandler", "HotUpdateManager", "HotUpdateUI", "SceneManager" ]);