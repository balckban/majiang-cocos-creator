// Compatible with v1.5.0+
if (!cc.loader.loadResAll) {
    cc.loader.loadResAll = cc.loader.loadResDir;
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
        _splash:null,    //启动页引导图
        tipLabel:cc.Label,  //加载标签
        _stateStr:'',        //标签文字
        _progress:0.0,      //进度条
        _isLoading:false,    //是否加载中

    },

    // use this for initialization
    onLoad: function () {
        //判断是否原生，是否为手机
        if(!cc.sys.isNative ){   //&& cc.sys.isMobile
            //获取canvas节点
            var cvs = this.node.getComponent(cc.Canvas);
            //填充宽高度
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        this.initMgr();//初始化各组件脚本
        //标签内容赋值
        this.tipLabel.string = this._stateStr;  
        this._splash = cc.find("Canvas/splash"); //获取引导图
        this._splash.active = true; //设为可见

    },
    //引导图显示加载
    start:function(){        
        var self = this;
        var SHOW_TIME = 3000; //显示时间
        var FADE_TIME = 500;  //褪去时间
        //判断是否为原生，运行的os名称不是IOS
        if(cc.sys.os != cc.sys.OS_IOS || !cc.sys.isNative){
            self._splash.active = true; //设为可见
            var t = Date.now(); //当前时间
            var fn = function(){
                var dt = Date.now() - t; //显示时间差
                //未到显示时间
                if(dt < SHOW_TIME){
                    setTimeout(fn,33);
                }
                //已到时间
                else {
                    //显示完成后计算隐藏时间
                    var op = (1 - ((dt - SHOW_TIME) / FADE_TIME)) * 255;
                    //是否刚到褪色时间
                    if(op < 0){
                        self._splash.opacity = 0;
                        self.checkVersion();    //检查版本更新
                    }
                    else{
                        //未到褪色时间继续显示
                        self._splash.opacity = op;
                        setTimeout(fn,33);   
                    }
                }
            };
            setTimeout(fn,33); 
        }
        else{
            this._splash.active = false;
            self.checkVersion();//检查版本更新
        }
    },
    //初始化组件方法
    initMgr:function(){
        cc.vv = {};
        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();   //用户信息
        
        var ReplayMgr = require("ReplayMgr");
        cc.vv.replayMgr = new ReplayMgr();  //重播
        //网络接口
        cc.vv.http = require("HTTP");
        cc.vv.global = require("Global");
        cc.vv.net = require("Net");
        
        var GameNetMgr = require("GameNetMgr");
        cc.vv.gameNetMgr = new GameNetMgr();
        cc.vv.gameNetMgr.initHandlers();
        //anysdk
        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();
        //声音音频控制
        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();
        
        var AudioMgr = require("AudioMgr");
        cc.vv.audioMgr = new AudioMgr();
        cc.vv.audioMgr.init();
        //工具类
        var Utils = require("Utils");
        cc.vv.utils = new Utils();
        
        cc.args = this.urlParse();
    },
    
    //获取url及url参数
    urlParse:function(){
        var params = {};
        if(window.location == null){
            return params;
        }
        var name,value; 
        var str=window.location.href; //取得整个地址栏
        var num=str.indexOf("?") 
        str=str.substr(num+1); //取得所有参数   stringvar.substr(start [, length ]
        
        var arr=str.split("&"); //各个参数放到数组里
        for(var i=0;i < arr.length;i++){ 
            num=arr[i].indexOf("="); 
            if(num>0){ 
                name=arr[i].substring(0,num);
                value=arr[i].substr(num+1);
                params[name]=value;
            } 
        }
        return params;
    },
    //检查版本更新
    checkVersion:function(){
        var self=this;
        //获得版本
      var onGetVersion=function(ret){
          //如果版本号为空
         if(ret.version==null){
            console.log("error.");
         }
         else{
            cc.vv.SI = ret; //定义si接受ret
            //是否和线上版本一致
            if(ret.version!=cc.VERSION){
               
            }else
            {
                self.startPreloading();
            }
         }
      };
      
      var xhr = null;
      var complete = false;  //请求是否完成
      //定义request回调方法
      var fnRequest = function(){
        self._stateStr = "正在连接服务器";
        xhr = cc.vv.http.sendRequest("/get_serverinfo",null,function(ret){
            xhr = null;
            complete = true;  
            onGetVersion(ret);   //成功取到对象调用方法
        });
        setTimeout(fn,5000);            
    }
    
    //连接失败重新请求
    var fn = function(){
        if(!complete){
            if(xhr){
                xhr.abort();
                self._stateStr = "连接失败，即将重试";
                setTimeout(function(){
                    fnRequest();
                },5000);
            }
            else{
                fnRequest();
            }
        }
    };
    fn();
    },
     
    //版本一致结束加载
    startPreloading:function(){
        this._stateStr = "正在加载资源，请稍候";
        this._isLoading = true;
        var self = this;
        
        cc.loader.onProgress = function ( completedCount, totalCount,  item ){
            //console.log("completedCount:" + completedCount + ",totalCount:" + totalCount );
            if(self._isLoading){
                self._progress = completedCount/totalCount;
            }
        };
        
        cc.loader.loadResAll("textures", function (err, assets) {
            self.onLoadComplete();
        });      
    },
    //加载完成
    onLoadComplete:function(){
        this._isLoading = false;
        this._stateStr = "准备登陆";
        cc.director.loadScene("login");
        cc.loader.onComplete = null;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._stateStr.length == 0){
            return;
        }
        this.tipLabel.string = this._stateStr + ' ';
        if(this._isLoading){
            this.tipLabel.string += Math.floor(this._progress * 100) + "%";   
        }
        else{
            var t = Math.floor(Date.now() / 1000) % 4;
            for(var i = 0; i < t; ++ i){
                this.tipLabel.string += '.';
            }            
        }
    }
    
});
