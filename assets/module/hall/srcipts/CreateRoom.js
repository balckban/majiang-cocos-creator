//麻将创建房间脚本
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
        _difenxuanze:null,  //低分选择
        _zimo:null,         //自摸 
        _wanfaxuanze:null,   //玩法选择
        _zuidafanshu:null,    //最大番数
        _jushuxuanze:null, //局数选择
        _dianganghua:null,   //点杠花选择
        _leixingxuanze:null,  //类型选择
    },

    // use this for initialization
    onLoad: function () {
        //初始化类型数组
        this._leixingxuanze = [];  
        //获取类型子节点
        var t = this.node.getChildByName("leixingxuanze");  
        //选择item个数 存进数组
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent("RadioButton");
            if(n != null){
                this._leixingxuanze.push(n);
            }
        }
        //同上低分选择
        this._difenxuanze = [];
        var t = this.node.getChildByName("difenxuanze");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent("RadioButton");
            if(n != null){
                this._difenxuanze.push(n);
            }
        }
        //console.log(this._difenxuanze);
        //同上自摸选择
        this._zimo = [];
        var t = this.node.getChildByName("zimojiacheng");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent("RadioButton");
            if(n != null){
                this._zimo.push(n);
            }
        }
        //console.log(this._zimo);
        //checkbox选择框选择 玩法
        this._wanfaxuanze = [];
        var t = this.node.getChildByName("wanfaxuanze");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent("CheckBox");
            if(n != null){
                this._wanfaxuanze.push(n);
            }
        }
        //console.log(this._wanfaxuanze);
        //checkbox选择框选择 玩法
        this._zuidafanshu = [];
        var t = this.node.getChildByName("zuidafanshu");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent("RadioButton");
            if(n != null){
                this._zuidafanshu.push(n);
            }
        }
        //console.log(this._zuidafanshu);
        //局数选择
        this._jushuxuanze = [];
        var t = this.node.getChildByName("xuanzejushu");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent("RadioButton");
            if(n != null){
                this._jushuxuanze.push(n);
            }
        }
        //点杠花
        this._dianganghua = [];
        var t = this.node.getChildByName("dianganghua");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent("RadioButton");
            if(n != null){
                this._dianganghua.push(n);
            }
        }
        //console.log(this._jushuxuanze);
    },
    
    //关闭创建房间框
    onBtnBack:function(){
        this.node.active = false;
    },
    
    //点击确定创建房间
    onBtnOK:function(){
        this.node.active = false;
        this.createRoom();
    },
    
    //创建房间
    createRoom:function(){
        var self = this;  
        var onCreate = function(ret){
            if(ret.errcode !== 0){
                //console.log(ret.errmsg);
                //判断房卡
                if(ret.errcode == 2222){
                    cc.vv.alert.show("提示","房卡不足，创建房间失败!");  
                }
                else{
                    cc.vv.alert.show("提示","创建房间失败,错误码:" + ret.errcode);
                }
            }
            else{
                //创建正常 连接服务器
                cc.vv.gameNetMgr.connectGameServer(ret);
                
            }
        };
        //取底分选择
        var difen = 0;
        for(var i = 0; i < self._difenxuanze.length; ++i){
            if(self._difenxuanze[i].checked){
                difen = i;
                break;
            }
        }
        //取自摸方式
        var zimo = 0;
        for(var i = 0; i < self._zimo.length; ++i){
            if(self._zimo[i].checked){
                zimo = i;
                break;
            }     
        }
       //checkbox取值
        var huansanzhang = self._wanfaxuanze[0].checked;        
        var jiangdui = self._wanfaxuanze[1].checked;
        var menqing = self._wanfaxuanze[2].checked;
        var tiandihu = self._wanfaxuanze[3].checked;
        //上方类型选择
        var type = 0;
        for(var i = 0; i < self._leixingxuanze.length; ++i){
            if(self._leixingxuanze[i].checked){
                type = i;
                break;
            }     
        }
        //判断是血战麻将 还是血流麻将
        if(type == 0){
            type = "xzdd";
        }
        else{
            type = "xlch";
        }
        //最大番
        var zuidafanshu = 0;
        for(var i = 0; i < self._zuidafanshu.length; ++i){
            if(self._zuidafanshu[i].checked){
                zuidafanshu = i;
                break;
            }     
        }
        
        //局数
        var jushuxuanze = 0;
        for(var i = 0; i < self._jushuxuanze.length; ++i){
            if(self._jushuxuanze[i].checked){
                jushuxuanze = i;
                break;
            }     
        }
        //点杠花
        var dianganghua = 0;
        for(var i = 0; i < self._dianganghua.length; ++i){
            if(self._dianganghua[i].checked){
                dianganghua = i;
                break;
            }     
        }
        //包裹成对象
        var conf = {
            type:type,
            difen:difen,
            zimo:zimo,
            jiangdui:jiangdui,
            huansanzhang:huansanzhang,
            zuidafanshu:zuidafanshu,
            jushuxuanze:jushuxuanze,
            dianganghua:dianganghua,
            menqing:menqing,
            tiandihu:tiandihu,   
        }; 
        //请求
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            conf:JSON.stringify(conf)
        };
        console.log(data);
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/create_private_room",data,onCreate);   
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
