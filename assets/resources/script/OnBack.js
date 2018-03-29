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
    },

    // 初始化
    onLoad: function () {
        //根据节点名字获取按钮
        var btn = this.node.getChildByName("btn_back");
        //添加点击事件
        cc.vv.utils.addClickEvent(btn,this.node,"OnBack","onBtnClicked");        
    },
    
    onBtnClicked:function(event){
        //判断按钮等于back按钮 关闭当前节点
        if(event.target.name == "btn_back"){
            this.node.active = false;
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
