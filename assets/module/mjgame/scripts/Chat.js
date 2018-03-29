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
        _chatRoot:null,
        _tabQuick:null,
        _tabEmoji:null,
        _iptChat:null,
        
        _quickChatInfo:null,
        _btnChat:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        cc.vv.chat = this;
        
        this._btnChat = this.node.getChildByName("btn_chat");
        this._btnChat.active = cc.vv.replayMgr.isReplay() == false;
        
        this._chatRoot = this.node.getChildByName("chat");
        this._chatRoot.active = false;
        
        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        
        this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
        
        
        this._quickChatInfo = {};
        this._quickChatInfo["item0"] = {index:0,content:"快点啊，都等到我花儿都谢谢了！",sound:"fix_msg_1.mp3"};
        this._quickChatInfo["item1"] = {index:1,content:"怎么又断线了，网络怎么这么差啊！",sound:"fix_msg_2.mp3"};
        this._quickChatInfo["item2"] = {index:2,content:"不要走，决战到天亮！",sound:"fix_msg_3.mp3"};
        this._quickChatInfo["item3"] = {index:3,content:"你的牌打得也太好了！",sound:"fix_msg_4.mp3"};
        this._quickChatInfo["item4"] = {index:4,content:"你是妹妹还是哥哥啊？",sound:"fix_msg_5.mp3"};
        this._quickChatInfo["item5"] = {index:5,content:"和你合作真是太愉快了！",sound:"fix_msg_6.mp3"};
        this._quickChatInfo["item6"] = {index:6,content:"大家好，很高兴见到各位！",sound:"fix_msg_7.mp3"};
        this._quickChatInfo["item7"] = {index:7,content:"各位，真是不好意思，我得离开一会儿。",sound:"fix_msg_8.mp3"};
        this._quickChatInfo["item8"] = {index:8,content:"不要吵了，专心玩游戏吧！",sound:"fix_msg_9.mp3"};
    },
    
    getQuickChatInfo(index){
        var key = "item" + index;
        return this._quickChatInfo[key];   
    },
    
    onBtnChatClicked:function(){
        this._chatRoot.active = true;
    },
    
    onBgClicked:function(){
        this._chatRoot.active = false;
    },
    
    onTabClicked:function(event){
        if(event.target.name == "tabQuick"){
            this._tabQuick.active = true;
            this._tabEmoji.active = false;
        }
        else if(event.target.name == "tabEmoji"){
            this._tabQuick.active = false;
            this._tabEmoji.active = true;
        }
    },
    
    onQuickChatItemClicked:function(event){
        this._chatRoot.active = false;
        var info = this._quickChatInfo[event.target.name];
        cc.vv.net.send("quick_chat",info.index); 
    },
    
    onEmojiItemClicked:function(event){
        console.log(event.target.name);
        this._chatRoot.active = false;
        cc.vv.net.send("emoji",event.target.name);
    },
    
    onBtnSendChatClicked:function(){
        this._chatRoot.active = false;
        if(this._iptChat.string == ""){
            return;
        }
        cc.vv.net.send("chat",this._iptChat.string);
        this._iptChat.string = "";
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
