
cc.Class({
    extends: cc.Component,

    properties: {
        logger: cc.Label
    },

    playerEventHandler(videoPlayer, eventType, customEventData) {
        switch (eventType) {
            case cc.VideoPlayer.EventType.META_LOADED: {
                if (this.logger.node.active) {
                    this.logger.string += '\n视频信息加载完成';
                }
            } break;
            case cc.VideoPlayer.EventType.READY_TO_PLAY: {
                if (this.logger.node.active) {
                    this.logger.string += '\n播放准备完成';
                }

                videoPlayer.play();
            } break;
            case cc.VideoPlayer.EventType.PLAYING: {
                if (this.logger.node.active) {
                    this.logger.string += '\n播放中';
                }
            } break;
            case cc.VideoPlayer.EventType.COMPLETED: {
                if (this.logger.node.active) {
                    this.logger.string += '\n播放完成';
                }

            } break;
            default: break;
        }
    }

});
