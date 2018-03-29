//checkbox 选择
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
        target:cc.Node,
        sprite:cc.SpriteFrame,
        checkedSprite:cc.SpriteFrame,
        checked:false,
    },

    // use this for initialization
    onLoad: function () {
        this.refresh();
    },
    //点击后选择切换
    onClicked:function(){
        this.checked = !this.checked;
        this.refresh();   
    },
    
    //刷新节点
    refresh:function(){
        var targetSprite = this.target.getComponent(cc.Sprite);
        if(this.checked){
            targetSprite.spriteFrame = this.checkedSprite;
        }
        else{
            targetSprite.spriteFrame = this.sprite;
        }
    }
    
    

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
