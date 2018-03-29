cc.Class({
    extends: cc.Component,

    properties: {
        HistoryItemPrefab:{
            default:null,
            type:cc.Prefab,
        },
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _history:null,
        _viewlist:null,
        _content:null,
        _viewitemTemp:null,
        _historyData:null,
        _curRoomInfo:null,
        _emptyTip:null,
    },

    // use this for initialization
    onLoad: function () {
        this._history = this.node.getChildByName("history");
        this._history.active = false;
        
        this._emptyTip = this._history.getChildByName("emptyTip");
        this._emptyTip.active = true;
        
        this._viewlist = this._history.getChildByName("viewlist");
        this._content = cc.find("view/content",this._viewlist);
        
        this._viewitemTemp = this._content.children[0];
        this._content.removeChild(this._viewitemTemp);

        var node = cc.find("Canvas/global/main/menu/btn_zhanji");        
        this.addClickEvent(node,this.node,"History","onBtnHistoryClicked");
        
        var node = cc.find("Canvas/history/btn_back");  
        this.addClickEvent(node,this.node,"History","onBtnBackClicked");
    },
    
    addClickEvent:function(node,target,component,handler){
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;

        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },
    
    onBtnBackClicked:function(){
        if(this._curRoomInfo == null){
            this._historyData = null;
            this._history.active = false;            
        }
        else{
            this.initRoomHistoryList(this._historyData);   
        }
    },
    
    onBtnHistoryClicked:function(){
        this._history.active = true;
        var self = this;
        cc.vv.userMgr.getHistoryList(function(data){
            data.sort(function(a,b){
                return a.time < b.time; 
            });
            self._historyData = data;
            for(var i = 0; i < data.length; ++i){
                for(var j = 0; j < 4; ++j){
                    var s = data[i].seats[j];
                    s.name = new Buffer(s.name,'base64').toString();
                }
            }
            self.initRoomHistoryList(data);
        });
    },
    
    dateFormat:function(time){
        var date = new Date(time);
        var datetime = "{0}-{1}-{2} {3}:{4}:{5}";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10? month : ("0"+month);
        var day = date.getDate();
        day = day >= 10? day : ("0"+day);
        var h = date.getHours();
        h = h >= 10? h : ("0"+h);
        var m = date.getMinutes();
        m = m >= 10? m : ("0"+m);
        var s = date.getSeconds();
        s = s >= 10? s : ("0"+s);
        datetime = datetime.format(year,month,day,h,m,s);
        return datetime;
    },
    
    initRoomHistoryList:function(data){
        for(var i = 0; i < data.length; ++i){
            var node = this.getViewItem(i);
            node.idx = i;
            var titleId = "" + (i + 1);
            node.getChildByName("title").getComponent(cc.Label).string = titleId;
            node.getChildByName("roomNo").getComponent(cc.Label).string = "房间ID:" + data[i].id;
            var datetime = this.dateFormat(data[i].time * 1000);
            node.getChildByName("time").getComponent(cc.Label).string = datetime;
            
            var btnOp = node.getChildByName("btnOp");
            btnOp.idx = i;
            btnOp.getChildByName("Label").getComponent(cc.Label).string = "详情";
            
            for(var j = 0; j < 4; ++j){
                var s = data[i].seats[j];
                var info = s.name + ":" +  s.score;
                //console.log(info);
                node.getChildByName("info" + j).getComponent(cc.Label).string = info;
            }
        }
        this._emptyTip.active = data.length == 0;
        this.shrinkContent(data.length);
        this._curRoomInfo = null;
    },
    
    initGameHistoryList:function(roomInfo,data){
        data.sort(function(a,b){
           return a.create_time < b.create_time; 
        });
        for(var i = 0; i < data.length; ++i){
            var node = this.getViewItem(i);
            var idx = data.length - i - 1;
            node.idx = idx;
            var titleId = "" + (idx + 1);
            node.getChildByName("title").getComponent(cc.Label).string = titleId;
            node.getChildByName("roomNo").getComponent(cc.Label).string = "房间ID:" + roomInfo.id;
            var datetime = this.dateFormat(data[i].create_time * 1000);
            node.getChildByName("time").getComponent(cc.Label).string = datetime;
            
            var btnOp = node.getChildByName("btnOp");
            btnOp.idx = idx; 
            btnOp.getChildByName("Label").getComponent(cc.Label).string = "回放";
            
            var result = JSON.parse(data[i].result);
            for(var j = 0; j < 4; ++j){
                var s = roomInfo.seats[j];
                var info = s.name + ":" + result[j];
                //console.log(info);
                node.getChildByName("info" + j).getComponent(cc.Label).string = info;
            }
        }
        this.shrinkContent(data.length);
        this._curRoomInfo = roomInfo;
    },
    
    getViewItem:function(index){
        var content = this._content;
        if(content.childrenCount > index){
            return content.children[index];
        }
        var node = cc.instantiate(this._viewitemTemp);
        content.addChild(node);
        return node;
    },
    shrinkContent:function(num){
        while(this._content.childrenCount > num){
            var lastOne = this._content.children[this._content.childrenCount -1];
            this._content.removeChild(lastOne,true);
        }
    },
    
    getGameListOfRoom:function(idx){
        var self = this;
        var roomInfo = this._historyData[idx];        
        cc.vv.userMgr.getGamesOfRoom(roomInfo.uuid,function(data){
            if(data != null && data.length > 0){
                self.initGameHistoryList(roomInfo,data);
            }
        });
    },
    
    getDetailOfGame:function(idx){
        var self = this;
        var roomUUID = this._curRoomInfo.uuid;
        cc.vv.userMgr.getDetailOfGame(roomUUID,idx,function(data){
            data.base_info = JSON.parse(data.base_info);
            data.action_records = JSON.parse(data.action_records);
            cc.vv.gameNetMgr.prepareReplay(self._curRoomInfo,data);
            cc.vv.replayMgr.init(data);
            cc.director.loadScene("mjgame"); 
        });
    },
    
    onViewItemClicked:function(event){
        var idx = event.target.idx;
        console.log(idx);
        if(this._curRoomInfo == null){
            this.getGameListOfRoom(idx);
        }
        else{
            this.getDetailOfGame(idx);      
        }
    },
    
    onBtnOpClicked:function(event){
        var idx = event.target.parent.idx;
        console.log(idx);
        if(this._curRoomInfo == null){
            this.getGameListOfRoom(idx);
        }
        else{
            this.getDetailOfGame(idx);      
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
