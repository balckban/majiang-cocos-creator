//字符串拼接
String.prototype.format = function(args) { 
    //调用的实际参数的个数>0
    if (arguments.length>0) { 
        var result = this; 
        if (arguments.length == 1 && typeof (args) == "object") { 
            for (var key in args) { 
                var reg=new RegExp ("({"+key+"})","g"); 
                result = result.replace(reg, args[key]); 
            } 
        } 
        else { 
            for (var i = 0; i < arguments.length; i++) { 
                if(arguments[i]==undefined) { 
                    return ""; 
                } 
                else { 
                    var reg=new RegExp ("({["+i+"]})","g"); 
                    result = result.replace(reg, arguments[i]); 
                } 
            } 
        } 
        return result; 
    } 
    else { 
        return this; 
    } 
};
 
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _mima:null,
        _mimaIndex:0,
    },

    // 初始化
    onLoad: function () {
        if(!cc.sys.isNative && cc.sys.isMobile){
            var cvs = this.node.getComponent(cc.Canvas); //获取当前节点Canvas
            //填充宽高度
            cvs.fitHeight = true; 
            cvs.fitWidth = true;
        }
        //检查cc.vv是否初始化成功 
        if(!cc.vv){
            cc.director.loadScene("loading");
            return;
        }
        //url 赋值master_url
        cc.vv.http.url = cc.vv.http.master_url;
        //sockect连接模块  参数 事件 方法
        cc.vv.net.addHandler('push_need_create_role',function(){
            console.log("onLoad:push_need_create_role");
            cc.director.loadScene("createrole");   //加载创建用户名场景
        });
        
        cc.vv.audioMgr.playBGM("bgMain.mp3");
        
        this._mima = ["A","A","B","B","A","B","A","B","A","A","A","B","B","B"];
        
        //判断是否原生 是否是windows
        if(!cc.sys.isNative || cc.sys.os == cc.sys.OS_WINDOWS){
            cc.find("Canvas/global/button/btn_yk").active = true;//显示游客登入按钮
        }
    },
    
    start:function(){
      
    },
    
    //游客登录按钮点击方法
    onBtnQuickStartClicked:function(){
        cc.vv.userMgr.guestAuth();  //调用游客登入
        cc.vv.audioMgr.playSFX("button.mp3");
    },
    

    //按钮密码点击方法
    onBtnMIMAClicked:function(event){
        if(this._mima[this._mimaIndex] == event.target.name){
            this._mimaIndex++;
            if(this._mimaIndex == this._mima.length){
                cc.find("Canvas/global/button/btn_yk").active = true;
            }
        }
        else{
            console.log("oh ho~~~");
            this._mimaIndex = 0;
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});