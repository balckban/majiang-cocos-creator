var Net = require("Net")  //长连接socket
var Global = require("Global")  //mj所需方法
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
        createRoomWin:cc.Node,//创建房间
        settingsWin:cc.Node, //设置
        helpWin:cc.Node, //帮助
        xiaoxiWin:cc.Node,//消息
        zhanjiWin:cc.Node,//战绩
        dezhoutitle:cc.Node,//德州扑克
        mjtitle:cc.Node,//麻将
        btnJoinGame:cc.Node, //加入游戏
        btnReturnGame:cc.Node,//返回游戏
        joinGameWin:cc.Node,//加入房间
        dezhoupk:{
            default:null,
            type:cc.Sprite
        },
        doudizhu:{
            default:null,
            type:cc.Sprite
        },
        xzmj:{
            default:null,
            type:cc.Sprite
        },
        ermj:{
            default:null,
            type:cc.Sprite
        },
        xiangqi:{
            default:null,
            type:cc.Sprite
        },
        buyu:{
            default:null,
            type:cc.Sprite
        },
        woman:{
            default:null,
            type:cc.Node
        },
        sencond:{
            default:null,
            type:cc.Node
        },
        back:{
            default:null,
            type:cc.Sprite
        },
        notice:{
            default:null,
            type:cc.Label
        },
        lblName:cc.Label,
        lblMoney:cc.Label,
        lblGems:cc.Label,
      
    },
    //获取该this
    initNetHandlers:function(){
        var self = this;
    },
    
    // use this for initialization
    onLoad: function () {
        if(!cc.sys.isNative && cc.sys.isMobile){
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        if(!cc.vv){
            cc.director.loadScene("loading");
            return;
        }
        //加载用户信息
        this.initLabels();
         //判断房间id是否为空 显示创建房间和返回房间
         cc.log("roomid",cc.vv.gameNetMgr.roomId);
        if(cc.vv.gameNetMgr.roomId == null){
            this.btnJoinGame.active = true;
            this.btnReturnGame.active = false;
        }
        else{
            this.btnJoinGame.active = false;
            this.btnReturnGame.active = true;
        }
        
        //var params = cc.vv.args;
        //获取到roomid
        var roomId = cc.vv.userMgr.oldRoomId; 
        cc.log("roomold",roomId);
        if( roomId != null){
            //不为空进入房间
            cc.vv.userMgr.oldRoomId = null;
            cc.vv.userMgr.enterRoom(roomId);
        }

    
        
        if(cc.vv.halltype===1){
            this.hidenode();
            this.dezhoutitle.active=false;
            this.mjtitle.active=true;
            this.woman.x=0;
            this.woman.y=-111;
        }

        //按钮点击事件
        this.dezhoupk.node.on('touchstart',()=>{
            this.hidenode();
            this.woman.x=0;
            this.woman.y=-111;
            this.dezhoutitle.active=true;
            this.mjtitle.active=false;
        })
        this.xzmj.node.on('touchstart',()=>{
            this.hidenode();
            this.woman.x=0;
            this.woman.y=-111;
            this.dezhoutitle.active=false;
            this.mjtitle.active=true;
        })
        this.back.node.on('touchstart',()=>{
            this.shownode();
            this.woman.x=-402;
            this.woman.y=-111;
        })

      
        cc.vv.audioMgr.playBGM("bgMain.mp3");
        //获取设置 帮助 邮件 按钮
        this.initButtonHandler("Canvas/global/main/menu/btn_setting");
        this.initButtonHandler("Canvas/global/main/menu/btn_help");
        this.initButtonHandler("Canvas/global/main/menu/btn_xiaoxi");
        this.initButtonHandler("Canvas/global/main/menu/btn_zhanji");
        //设置按钮返回事件
        this.helpWin.addComponent("OnBack");
        this.xiaoxiWin.addComponent("OnBack");
        this.zhanjiWin.addComponent("OnBack");

        //notice滚动条获取值
        //初始化notice值
        if(!cc.vv.userMgr.notice){
            cc.vv.userMgr.notice = {
                version:null,
                msg:"数据请求中...",
            }
        }
        
        //赋值
        this.notice.string = cc.vv.userMgr.notice.msg;
        
        this.refreshInfo();//刷新房卡信息
        this.refreshNotice();//刷新滚动条信息
        // this.refreshGemsTip(); //刷新房卡信息






    },
    //刷新房卡信息
    refreshInfo:function(){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                if(ret.gems != null){
                    this.lblGems.string = ret.gems;    //房卡刷新
                }
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_status",data,onGet.bind(this));
    },

    //刷新滚动条信息
    refreshNotice:function(){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                cc.vv.userMgr.notice.version = ret.version;
                cc.vv.userMgr.notice.msg = ret.msg;
                this.notice.string = ret.msg;
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            type:"notice",
            version:cc.vv.userMgr.notice.version
        };
        cc.vv.http.sendRequest("/get_message",data,onGet.bind(this));
    },
   
    //通过路径获取按钮并且添加点击事件
    initButtonHandler:function(btnPath){
        var btn = cc.find(btnPath);
        cc.vv.utils.addClickEvent(btn,this.node,"hall","onBtnClicked");        
    },
   
    //点击事件返回值
    onBtnClicked:function(event){
        if(event.target.name == "btn_setting"){
            this.settingsWin.active = true;
        }   
        else if(event.target.name == "btn_help"){
            this.helpWin.active = true;
        }
        else if(event.target.name == "btn_xiaoxi"){
            this.xiaoxiWin.active = true;
        }
        else if(event.target.name == "btn_zhanji"){
            this.zhanjiWin.active=true;
        }
        // else if(event.target.name == "head"){
        //     cc.vv.userinfoShow.show(cc.vv.userMgr.userName,cc.vv.userMgr.userId,this.sprHeadImg,cc.vv.userMgr.sex,cc.vv.userMgr.ip);
        // }
    },
    
   //获取用户信息 
    initLabels:function(){
        this.lblName.string = cc.vv.userMgr.userName; //用户名
        this.lblMoney.string = cc.vv.userMgr.coins;//金币
        this.lblGems.string = cc.vv.userMgr.gems;//房卡
    },
    
    //隐藏节点
    hidenode:function(){
        this.dezhoupk.node.active=false
        this.doudizhu.node.active=false
        this.xzmj.node.active=false
        this.ermj.node.active=false
        this.xiangqi.node.active=false
        this.buyu.node.active=false
        this.sencond.active=true
    },
     //显示节点
     shownode:function(){
        this.dezhoupk.node.active=true
        this.doudizhu.node.active=true
        this.xzmj.node.active=true
        this.ermj.node.active=true
        this.xiangqi.node.active=true
        this.buyu.node.active=true
        this.sencond.active=false
    },
    //创建房间按钮显示
    onJoinGameClicked:function(){
        this.joinGameWin.active = true;
    },
    
    //返回按钮显示
    onReturnGameClicked:function(){
        cc.director.loadScene("mjgame");  
    },
    
    //创建房间按钮点击
    onCreateRoomClicked:function(){
        if(cc.vv.gameNetMgr.roomId != null){
            cc.vv.alert.show("提示","房间已经创建!\n必须解散当前房间才能创建新的房间");
            return;
        }
        console.log("onCreateRoomClicked");
        this.createRoomWin.active = true;   
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var x = this.notice.node.x;
        x -= dt*120;
        if(x + this.notice.node.width < -360){
            x = 600;
        }
        this.notice.node.x = x;
        if(cc.vv && cc.vv.userMgr.roomData != null){
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        }
    },
});
