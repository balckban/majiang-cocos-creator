cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _lastTouchTime:null,
        _voice:null,
        _volume:null,
        _voice_failed:null,
        _lastCheckTime:-1,
        _timeBar:null,
        MAX_TIME:15000,
    },

    // use this for initialization
    onLoad: function () {
        
        this._voice = cc.find("Canvas/voice");
        this._voice.active = false;
        
        this._voice_failed = cc.find("Canvas/voice/voice_failed");
        this._voice_failed.active = false;
        
        this._timeBar = cc.find("Canvas/voice/time");
        this._timeBar.scaleX = 0.0;
        
        this._volume = cc.find("Canvas/voice/volume");
        for(var i = 1; i < this._volume.children.length; ++i){
            this._volume.children[i].active = false;
        }
        
        var btnVoice = cc.find("Canvas/voice/voice_failed/btn_ok");
        if(btnVoice){
            cc.vv.utils.addClickEvent(btnVoice,this.node,"Voice","onBtnOKClicked");
        }
        
        var self = this;
        var btnVoice = cc.find("Canvas/btn_voice");
        if(btnVoice){
            btnVoice.on(cc.Node.EventType.TOUCH_START,function(){
                console.log("cc.Node.EventType.TOUCH_START");
                cc.vv.voiceMgr.prepare("record.amr");
                self._lastTouchTime = Date.now();
                self._voice.active = true;
                self._voice_failed.active = false;
            });

            btnVoice.on(cc.Node.EventType.TOUCH_MOVE,function(){
                console.log("cc.Node.EventType.TOUCH_MOVE");
            });
                        
            btnVoice.on(cc.Node.EventType.TOUCH_END,function(){
                console.log("cc.Node.EventType.TOUCH_END");
                if(Date.now() - self._lastTouchTime < 1000){
                    self._voice_failed.active = true;
                    cc.vv.voiceMgr.cancel();
                }
                else{
                    self.onVoiceOK();
                }
                self._lastTouchTime = null;
            });
            
            btnVoice.on(cc.Node.EventType.TOUCH_CANCEL,function(){
                console.log("cc.Node.EventType.TOUCH_CANCEL");
                cc.vv.voiceMgr.cancel();
                self._lastTouchTime = null;
                self._voice.active = false;
            });
        }
    },
    
    onVoiceOK:function(){
        if(this._lastTouchTime != null){
            cc.vv.voiceMgr.release();
            var time = Date.now() - this._lastTouchTime;
            var msg = cc.vv.voiceMgr.getVoiceData("record.amr");
            cc.vv.net.send("voice_msg",{msg:msg,time:time});
        }
        this._voice.active = false;
    },
    
    onBtnOKClicked:function(){
        this._voice.active = false;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._voice.active == true && this._voice_failed.active == false){
            if(Date.now() - this._lastCheckTime > 300){
                for(var i = 0; i < this._volume.children.length; ++i){
                    this._volume.children[i].active = false;
                }
                var v = cc.vv.voiceMgr.getVoiceLevel(7);
                if(v >= 1 && v <= 7){
                    this._volume.children[v-1].active = true;   
                }
                this._lastCheckTime = Date.now();
            }
        }
        
        if(this._lastTouchTime){
            var time = Date.now() - this._lastTouchTime;
            if(time >= this.MAX_TIME){
                this.onVoiceOK();
                this._lastTouchTime = null;
            }
            else{
                var percent = time / this.MAX_TIME;
                this._timeBar.scaleX = 1 - percent;
            }
        }
    },
});
