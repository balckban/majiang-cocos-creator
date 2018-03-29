var radix = 12;
var base = 128 - radix;
function crypto(value){
    value -= base;
    var h = Math.floor(value/radix) + base;
    var l = value%radix + base;
    return String.fromCharCode(h) + String.fromCharCode(l);
}

var encodermap = {}
var decodermap = {}
for(var i = 0; i < 256; ++i){
    var code = null;
    var v = i + 1;
    if(v >= base){
        code = crypto(v);
    }
    else{
        code = String.fromCharCode(v);    
    }
    
    encodermap[i] = code;
    decodermap[code] = i;
}

function encode(data){
    var content = "";
    var len = data.length;
    var a = (len >> 24) & 0xff;
    var b = (len >> 16) & 0xff;
    var c = (len >> 8) & 0xff;
    var d = len & 0xff;
    content += encodermap[a];
    content += encodermap[b];
    content += encodermap[c];
    content += encodermap[d];
    for(var i = 0; i < data.length; ++i){
        content += encodermap[data[i]];
    }
    return content;
}

function getCode(content,index){
    var c = content.charCodeAt(index);
    if(c >= base){
        c = content.charAt(index) + content.charAt(index + 1);
    }
    else{
        c = content.charAt(index);
    }
    return c;
}
function decode(content){
    var index = 0;
    var len = 0;
    for(var i = 0; i < 4; ++i){
        var c = getCode(content,index);
        index += c.length;
        var v = decodermap[c];
        len |= v << (3-i)*8;
    }
    
    var newData = new Uint8Array(len);
    var cnt = 0;
    while(index < content.length){
        var c = getCode(content,index);
        index += c.length;
        newData[cnt] = decodermap[c];
        cnt++;
    }
    return newData;
}

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
        onPlayCallback:null,
        _voiceMediaPath:null,
    },

    // use this for initialization
    init: function () {
        /*
        var url = cc.url.raw("resources/test.amr");
        var fileData = jsb.fileUtils.getDataFromFile(url);
        var content = "";
        var sep = "";
        for(var i = 0; i < fileData.length; ++i){
            content += sep + fileData[i];
            sep = ",";
        }
        
        var url = cc.url.raw("resources/test.txt");
        jsb.fileUtils.writeStringToFile(content,url);
        
        var url = cc.url.raw("resources/test2.amrs");
        var content = encode(fileData);
        jsb.fileUtils.writeStringToFile(content,url);
        
        var url = cc.url.raw("resources/test2.amr");
        jsb.fileUtils.writeDataToFile(decode(content),url);
        */
        
        if(cc.sys.isNative){
            this._voiceMediaPath = jsb.fileUtils.getWritablePath() + "/voicemsgs/";
            this.setStorageDir(this._voiceMediaPath);
        }
    },
    
    prepare:function(filename){
        if(!cc.sys.isNative){
            return;
        }
        cc.vv.audioMgr.pauseAll();
        this.clearCache(filename);
        if(cc.sys.os == cc.sys.OS_ANDROID){
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "prepare", "(Ljava/lang/String;)V",filename);
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod("VoiceSDK", "prepareRecord:",filename);
        }
    },
    
    release:function(){
        if(!cc.sys.isNative){
            return;
        }
        cc.vv.audioMgr.resumeAll();
        if(cc.sys.os == cc.sys.OS_ANDROID){
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "release", "()V");
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod("VoiceSDK", "finishRecord");
        }
    },
    
    cancel:function(){
        if(!cc.sys.isNative){
            return;
        }
        cc.vv.audioMgr.resumeAll();
        if(cc.sys.os == cc.sys.OS_ANDROID){
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "cancel", "()V");
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod("VoiceSDK", "cancelRecord");
        }
    },

    writeVoice:function(filename,voiceData){
        if(!cc.sys.isNative){
            return;
        }
        if(voiceData && voiceData.length > 0){
            var fileData = decode(voiceData);
            var url = this._voiceMediaPath + filename;
            this.clearCache(filename);
            jsb.fileUtils.writeDataToFile(fileData,url); 
        }
    },
    
    clearCache:function(filename){
        if(cc.sys.isNative){
            var url = this._voiceMediaPath + filename;
            //console.log("check file:" + url);
            if(jsb.fileUtils.isFileExist(url)){
                //console.log("remove:" + url);
                jsb.fileUtils.removeFile(url);
            }
            if(jsb.fileUtils.isFileExist(url + ".wav")){
                //console.log("remove:" + url + ".wav");
                jsb.fileUtils.removeFile(url + ".wav");
            }   
        }
    },
    
    play:function(filename){
        if(!cc.sys.isNative){
            return;
        }
        cc.vv.audioMgr.pauseAll();
        if(cc.sys.os == cc.sys.OS_ANDROID){
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoicePlayer", "play", "(Ljava/lang/String;)V",filename); 
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod("VoiceSDK", "play:",filename);
        }
        else{
        }
    },
    
    stop:function(){
        if(!cc.sys.isNative){
            return;
        }
        cc.vv.audioMgr.resumeAll();
        if(cc.sys.os == cc.sys.OS_ANDROID){
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoicePlayer", "stop", "()V"); 
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod("VoiceSDK", "stopPlay");
        }
        else{
        }
    },
    
    getVoiceLevel:function(maxLevel){
        return Math.floor(Math.random() * maxLevel + 1);
        if(cc.sys.os == cc.sys.OS_ANDROID){ 
            return jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "getVoiceLevel", "(I)I",maxLevel);
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
        }
        else{
            return Math.floor(Math.random() * maxLevel + 1);
        }
    },
    
    getVoiceData:function(filename){
        if(cc.sys.isNative){
            var url = this._voiceMediaPath + filename;
            console.log("getVoiceData:" + url);
            var fileData = jsb.fileUtils.getDataFromFile(url);
            if(fileData){
                var content = encode(fileData);
                return content;
            }
        }
        return "";
    },
    
    download:function(){
        
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    
    setStorageDir:function(dir){
        if(!cc.sys.isNative){
            return;
        }
        if(cc.sys.os == cc.sys.OS_ANDROID){ 
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "setStorageDir", "(Ljava/lang/String;)V",dir);    
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod("VoiceSDK", "setStorageDir:",dir);
            if(!jsb.fileUtils.isDirectoryExist(dir)){
                jsb.fileUtils.createDirectory(dir);
            }
        }
    }
});
