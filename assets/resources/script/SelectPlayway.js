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
        //节点控件
        first: {
            default: null,
            type: cc.Node
        },
        //srcollview所摆放的预制体
        playway: {
            default: null,
            type: cc.Prefab
        },
        //srcollview包含内容
        content: {
            default: null,
            type: cc.Node
        },
    
    },

    // use this for initialization
    onLoad: function () {
       
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
