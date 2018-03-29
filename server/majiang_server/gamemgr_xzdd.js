var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var mjutils = require('./mjutils');
var db = require("../utils/db");
var crypto = require("../utils/crypto");
var games = {};
var gamesIdBase = 0;

var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_HU = 5;
var ACTION_ZIMO = 6;

var gameSeatsOfUsers = {};

function getMJType(id){
    if(id >= 0 && id < 9){
        //筒
        return 0;
    }
    else if(id >= 9 && id < 18){
        //条
        return 1;
    }
    else if(id >= 18 && id < 27){
        //万
        return 2;
    }
}

function shuffle(game) {
    
    var mahjongs = game.mahjongs;

	/*
    var idx = 0;
    for(var i = 0; i < 12; ++i){
        game.mahjongs[idx++] = 0;
    }

    for(var i = 0; i < 12; ++i){
        game.mahjongs[idx++] = 1;
    }

    for(var i = 0; i < 12; ++i){
        game.mahjongs[idx++] = 2;
    }

    for(var i = 0; i < 12; ++i){
        game.mahjongs[idx++] = 3;
    }


    for(var i = idx; i < game.mahjongs.length; ++i){
        game.mahjongs[i] = 4;
    }
    return;
    */

    //筒 (0 ~ 8 表示筒子
    var index = 0;
    for(var i = 0; i < 9; ++i){
        for(var c = 0; c < 4; ++c){
            mahjongs[index] = i;
            index++;
        }
    }

    //条 9 ~ 17表示条子
    for(var i = 9; i < 18; ++i){
        for(var c = 0; c < 4; ++c){
            mahjongs[index] = i;
            index++;
        }
    }

    //万
    //条 18 ~ 26表示万
    for(var i = 18; i < 27; ++i){
        for(var c = 0; c < 4; ++c){
            mahjongs[index] = i;
            index++;
        }
    }

    for(var i = 0; i < mahjongs.length; ++i){
        var lastIndex = mahjongs.length - 1 - i;
        var index = Math.floor(Math.random() * lastIndex);
        var t = mahjongs[index];
        mahjongs[index] = mahjongs[lastIndex];
        mahjongs[lastIndex] = t;
    }
}

function mopai(game,seatIndex) {
    if(game.currentIndex == game.mahjongs.length){
        return -1;
    }
    var data = game.gameSeats[seatIndex];
    var mahjongs = data.holds;
    var pai = game.mahjongs[game.currentIndex];
    mahjongs.push(pai);

    //统计牌的数目 ，用于快速判定（空间换时间）
    var c = data.countMap[pai];
    if(c == null) {
        c = 0;
    }
    data.countMap[pai] = c + 1;
    game.currentIndex ++;
    return pai;
}

function deal(game){
    //强制清0
    game.currentIndex = 0;

    //每人13张 一共 13*4 ＝ 52张 庄家多一张 53张
    var seatIndex = game.button;
    for(var i = 0; i < 52; ++i){
        var mahjongs = game.gameSeats[seatIndex].holds;
        if(mahjongs == null){
            mahjongs = [];
            game.gameSeats[seatIndex].holds = mahjongs;
        }
        mopai(game,seatIndex);
        seatIndex ++;
        seatIndex %= 4;
    }

    //庄家多摸最后一张
    mopai(game,game.button);
    //当前轮设置为庄家
    game.turn = game.button;
}

//检查是否可以碰
function checkCanPeng(game,seatData,targetPai) {
    if(getMJType(targetPai) == seatData.que){
        return;
    }
    var count = seatData.countMap[targetPai];
    if(count != null && count >= 2){
        seatData.canPeng = true;
    }
}

//检查是否可以点杠
function checkCanDianGang(game,seatData,targetPai){
    //检查玩家手上的牌
    //如果没有牌了，则不能再杠
    if(game.mahjongs.length <= game.currentIndex){
        return;
    }
    if(getMJType(targetPai) == seatData.que){
        return;
    }
    var count = seatData.countMap[targetPai];
    if(count != null && count >= 3){
        seatData.canGang = true;
        seatData.gangPai.push(targetPai);
        return;
    }
}

//检查是否可以暗杠
function checkCanAnGang(game,seatData){
    //如果没有牌了，则不能再杠
    if(game.mahjongs.length <= game.currentIndex){
        return;
    }

    for(var key in seatData.countMap){
        var pai = parseInt(key);
        if(getMJType(pai) != seatData.que){
            var c = seatData.countMap[key];
            if(c != null && c == 4){
                seatData.canGang = true;
                seatData.gangPai.push(pai);
            }
        }
    }
}

//检查是否可以弯杠(自己摸起来的时候)
function checkCanWanGang(game,seatData){
    //如果没有牌了，则不能再杠
    if(game.mahjongs.length <= game.currentIndex){
        return;
    }

    //从碰过的牌中选
    for(var i = 0; i < seatData.pengs.length; ++i){
        var pai = seatData.pengs[i];
        if(seatData.countMap[pai] == 1){
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
    }
}

function checkCanHu(game,seatData,targetPai) {
    game.lastHuPaiSeat = -1;
    if(getMJType(targetPai) == seatData.que){
        return;
    }
    seatData.canHu = false;
    for(var k in seatData.tingMap){
        if(targetPai == k){
            seatData.canHu = true;
        }
    }
}

function clearAllOptions(game,seatData){
    var fnClear = function(sd){
        sd.canPeng = false;
        sd.canGang = false;
        sd.gangPai = [];
        sd.canHu = false;
        sd.lastFangGangSeat = -1;    
    }
    if(seatData){
        fnClear(seatData);
    }
    else{
        game.qiangGangContext = null;
        for(var i = 0; i < game.gameSeats.length; ++i){
            fnClear(game.gameSeats[i]);
        }
    }
}

//检查听牌
function checkCanTingPai(game,seatData){
    seatData.tingMap = {};
    
    //检查手上的牌是不是已打缺，如果未打缺，则不进行判定
    for(var i = 0; i < seatData.holds.length; ++i){
        var pai = seatData.holds[i];
        if(getMJType(pai) == seatData.que){
            return;
        }   
    }

    //检查是否是七对 前提是没有碰，也没有杠 ，即手上拥有13张牌
    if(seatData.holds.length == 13){
        //有5对牌
        var hu = false;
        var danPai = -1;
        var pairCount = 0;
        for(var k in seatData.countMap){
            var c = seatData.countMap[k];
            if( c == 2 || c == 3){
                pairCount++;
            }
            else if(c == 4){
                pairCount += 2;
            }

            if(c == 1 || c == 3){
                //如果已经有单牌了，表示不止一张单牌，并没有下叫。直接闪
                if(danPai >= 0){
                    break;
                }
                danPai = k;
            }
        }

        //检查是否有6对 并且单牌是不是目标牌
        if(pairCount == 6){
            //七对只能和一张，就是手上那张单牌
            //七对的番数＝ 2番+N个4个牌（即龙七对）
            seatData.tingMap[danPai] = {
                fan:2,
                pattern:"7pairs"
            };
            //如果是，则直接返回咯
        }
    }

    //检查是否是对对胡  由于四川麻将没有吃，所以只需要检查手上的牌
    //对对胡叫牌有两种情况
    //1、N坎 + 1张单牌
    //2、N-1坎 + 两对牌
    var singleCount = 0;
    var colCount = 0;
    var pairCount = 0;
    var arr = [];
    for(var k in seatData.countMap){
        var c = seatData.countMap[k];
        if(c == 1){
            singleCount++;
            arr.push(k);
        }
        else if(c == 2){
            pairCount++;
            arr.push(k);
        }
        else if(c == 3){
            colCount++;
        }
        else if(c == 4){
            //手上有4个一样的牌，在四川麻将中是和不了对对胡的 随便加点东西
            singleCount++;
            pairCount+=2;
        }
    }

    if((pairCount == 2 && singleCount == 0) || (pairCount == 0 && singleCount == 1) ){
        for(var i = 0; i < arr.length; ++ i){
            //对对胡1番
            var p = arr[i];
            if(seatData.tingMap[p] == null){
                seatData.tingMap[p] = {
                    pattern:"duidui",
                    fan:1
                };
            }
        }
    }

    //console.log(seatData.holds);
    //console.log(seatData.countMap);
    //console.log("singleCount:" + singleCount + ",colCount:" + colCount + ",pairCount:" + pairCount);
    //检查是不是平胡
    if(seatData.que != 0){
        mjutils.checkTingPai(seatData,0,9);        
    }

    if(seatData.que != 1){
        mjutils.checkTingPai(seatData,9,18);        
    }

    if(seatData.que != 2){
        mjutils.checkTingPai(seatData,18,27);        
    }
}

function getSeatIndex(userId){
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null){
        return null;
    }
    return seatIndex;
}

function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null){
        return null;
    }
    var game = games[roomId];
    return game;
}

function hasOperations(seatData){
    if(seatData.canGang || seatData.canPeng || seatData.canHu){
        return true;
    }
    return false;
}

function sendOperations(game,seatData,pai) {
    if(hasOperations(seatData)){
        if(pai == -1){
            pai = seatData.holds[seatData.holds.length - 1];
        }
        
        var data = {
            pai:pai,
            hu:seatData.canHu,
            peng:seatData.canPeng,
            gang:seatData.canGang,
            gangpai:seatData.gangPai
        };

        //如果可以有操作，则进行操作
        userMgr.sendMsg(seatData.userId,'game_action_push',data);

        data.si = seatData.seatIndex;
    }
    else{
        userMgr.sendMsg(seatData.userId,'game_action_push');
    }
}

function moveToNextUser(game,nextSeat){
    game.fangpaoshumu = 0;
    //找到下一个没有和牌的玩家
    if(nextSeat == null){
        while(true){
            game.turn ++;
            game.turn %= 4;
            var turnSeat = game.gameSeats[game.turn];
            if(turnSeat.hued == false){
                return;
            }
        }
    }
    else{
        game.turn = nextSeat;
    }
}

function doUserMoPai(game){
    game.chuPai = -1;
    var turnSeat = game.gameSeats[game.turn];
    turnSeat.lastFangGangSeat = -1;
    turnSeat.guoHuFan = -1;
    var pai = mopai(game,game.turn);
    //牌摸完了，结束
    if(pai == -1){
        doGameOver(game,turnSeat.userId);
        return;
    }
    else{
        var numOfMJ = game.mahjongs.length - game.currentIndex;
        userMgr.broacastInRoom('mj_count_push',numOfMJ,turnSeat.userId,true);
    }

    recordGameAction(game,game.turn,ACTION_MOPAI,pai);

    //通知前端新摸的牌
    userMgr.sendMsg(turnSeat.userId,'game_mopai_push',pai);
    //检查是否可以暗杠或者胡
    //检查胡，直杠，弯杠
    checkCanAnGang(game,turnSeat);
    checkCanWanGang(game,turnSeat,pai);

    //检查看是否可以和
    checkCanHu(game,turnSeat,pai);

    //广播通知玩家出牌方
    turnSeat.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push',turnSeat.userId,turnSeat.userId,true);

    //通知玩家做对应操作
    sendOperations(game,turnSeat,game.chuPai);
}

function isSameType(type,arr){
    for(var i = 0; i < arr.length; ++i){
        var t = getMJType(arr[i]);
        if(type != -1 && type != t){
            return false;
        }
        type = t;
    }
    return true; 
}

function isQingYiSe(gameSeatData){
    var type = getMJType(gameSeatData.holds[0]);

    //检查手上的牌
    if(isSameType(type,gameSeatData.holds) == false){
        return false;
    }

    //检查杠下的牌
    if(isSameType(type,gameSeatData.angangs) == false){
        return false;
    }
    if(isSameType(type,gameSeatData.wangangs) == false){
        return false;
    }
    if(isSameType(type,gameSeatData.diangangs) == false){
        return false;
    }

    //检查碰牌
    if(isSameType(type,gameSeatData.pengs) == false){
        return false;
    }
    return true;
}

function isMenQing(gameSeatData){
    return (gameSeatData.pengs.length + gameSeatData.wangangs.length + gameSeatData.diangangs.length) == 0;
}

function isZhongZhang(gameSeatData){
    var fn = function(arr){
        for(var i = 0; i < arr.length; ++i){
            var pai = arr[i];
            if(pai == 0 || pai == 8 || pai == 9 || pai == 17 || pai == 18 || pai == 26){
                return false;
            }
        }
        return true;
    }
    
    if(fn(gameSeatData.pengs) == false){
        return false;
    }
    if(fn(gameSeatData.angangs) == false){
        return false;
    }
    if(fn(gameSeatData.diangangs) == false){
        return false;
    }
    if(fn(gameSeatData.wangangs) == false){
        return false;
    }
    if(fn(gameSeatData.holds) == false){
        return false;
    }
    return true;
}

function isJiangDui(gameSeatData){
    var fn = function(arr){
        for(var i = 0; i < arr.length; ++i){
            var pai = arr[i];
            if(pai != 1 && pai != 4 && pai != 7
               && pai != 9 && pai != 13 && pai != 16
               && pai != 18 && pai != 21 && pai != 25
               ){
                return false;
            }
        }
        return true;
    }
    
    if(fn(gameSeatData.pengs) == false){
        return false;
    }
    if(fn(gameSeatData.angangs) == false){
        return false;
    }
    if(fn(gameSeatData.diangangs) == false){
        return false;
    }
    if(fn(gameSeatData.wangangs) == false){
        return false;
    }
    if(fn(gameSeatData.holds) == false){
        return false;
    }
    return true;
}

function isTinged(seatData){
    for(var k in seatData.tingMap){
        return true;
    }
    return false;
}

function computeFanScore(game,fan){
    if(fan > game.conf.maxFan){
        fan = game.conf.maxFan;
    }
    return (1 << fan) * game.conf.baseScore;
}

//是否需要查大叫(有两家以上未胡，且有人没有下叫)
function needChaDaJiao(game){
    //查叫
    var numOfHued = 0;
    var numOfTinged = 0;
    var numOfUntinged = 0;
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ts = game.gameSeats[i];
        if(ts.hued){
            numOfHued ++;
            numOfTinged++;
        }
        else if(isTinged(ts)){
            numOfTinged++;
        }
        else{
            numOfUntinged++;
        }
    }
   
    //如果三家都胡牌了，不需要查叫
    if(numOfHued == 3){
        return false;
    }
    
    //如果没有任何一个人叫牌，也没有任何一个胡牌，则不需要查叫
    if(numOfTinged == 0){
        return false;
    }
    
    //如果都听牌了，也不需要查叫
    if(numOfUntinged == 0){
        return false;
    }
    return true;
}

function findMaxFanTingPai(ts){
    //找出最大番
    var cur = null;
    for(var k in ts.tingMap){
        var tpai = ts.tingMap[k];
        if(cur == null || tpai.fan > cur.fan){
            cur = tpai;
        }
    }
    return cur;
}

function findUnTingedPlayers(game){
    var arr = [];
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ts = game.gameSeats[i];
        //如果没有胡，且没有听牌
        if(!ts.hued && !isTinged(ts)){
            arr.push(i);
            recordUserAction(game,ts,"beichadajiao",-1);
        }
    }
    return arr;
}

function chaJiao(game){
    var arr = findUnTingedPlayers(game);
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ts = game.gameSeats[i];
        //如果没有胡，但是听牌了，则未叫牌的人要给钱
        if(!ts.hued && isTinged(ts)){
            var cur = findMaxFanTingPai(ts);
            ts.fan = cur.fan;
            ts.pattern = cur.pattern;
            recordUserAction(game,ts,"chadajiao",arr);
        }
    }
}

function calculateResult(game,roomInfo){
    
    var isNeedChaDaJia = needChaDaJiao(game);
    if(isNeedChaDaJia){
        chaJiao(game);
    }
    
    var baseScore = game.conf.baseScore;
    var numOfHued = 0;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].hued == true){
            numOfHued++;
        }
    }
    
    for(var i = 0; i < game.gameSeats.length; ++i){
        var sd = game.gameSeats[i];
        
        //统计杠的数目
        sd.numAnGang = sd.angangs.length;
        sd.numMingGang = sd.wangangs.length + sd.diangangs.length;
        
        //对所有胡牌的玩家进行统计
        if(isTinged(sd)){
            //统计自己的番子和分数
            //基础番(平胡0番，对对胡1番、七对2番) + 清一色2番 + 杠+1番
            //杠上花+1番，杠上炮+1番 抢杠胡+1番，金钩胡+1番，海底胡+1番
            var fan = sd.fan;
            if(isQingYiSe(sd)){
                sd.qingyise = true;
                fan += 2;
            }
            
            var numOfGangs = sd.diangangs.length + sd.wangangs.length + sd.angangs.length;
            for(var j = 0; j < sd.pengs.length; ++j){
                var pai = sd.pengs[j];
                if(sd.countMap[pai] == 1){
                    numOfGangs++;
                }
            }
            for(var k in sd.countMap){
                if(sd.countMap[k] == 4){
                    numOfGangs++;
                }
            }
            sd.numofgen = numOfGangs;
            
            //金钩胡
            if(sd.holds.length == 1 || sd.holds.length == 2){
                fan += 1;
                sd.isJinGouHu = true;
            }
            
            if(sd.isHaiDiHu){
                fan += 1;
            }
            
            if(game.conf.tiandihu){
                if(sd.isTianHu){
                    fan += 3;
                }
                else if(sd.isDiHu){
                    fan += 2;
                }
            }
            
            var isjiangdui = false;
            if(game.conf.jiangdui){
                if(sd.pattern == "7pairs"){
                    if(sd.numofgen > 0){
                        sd.numofgen -= 1;
                        sd.pattern == "l7pairs";
                        isjiangdui = isJiangDui(sd);
                        if(isjiangdui){
                            sd.pattern == "j7paris";
                            fan += 2;    
                        }   
                        else{
                            fan += 1;
                        }
                    }
                }
                else if(sd.pattern == "duidui"){
                    isjiangdui = isJiangDui(sd);
                    if(isjiangdui){
                        sd.pattern = "jiangdui";
                        fan += 2;   
                    }
                }   
            }
            
            if(game.conf.menqing){
                //不是将对，才检查中张
                if(!isjiangdui){
                    sd.isZhongZhang = isZhongZhang(sd);
                    if(sd.isZhongZhang){
                        fan += 1;
                    }                
                }
                
                sd.isMenQing = isMenQing(sd);
                if(sd.isMenQing){
                    fan += 1;
                }                
            }
            
            fan += sd.numofgen;
            if(sd.isGangHu){
                fan += 1;
            }
            if(sd.isQiangGangHu){
                fan += 1;
            }

            //收杠钱
            var additonalscore = 0;
            for(var a = 0; a < sd.actions.length; ++a){
                var ac = sd.actions[a];
                if(ac.type == "fanggang"){
                    var ts = game.gameSeats[ac.targets[0]];
                    //检查放杠的情况，如果目标没有和牌，且没有叫牌，则不算 用于优化前端显示
                    if(isNeedChaDaJia && (ts.hued) == false && (isTinged(ts) == false)){
                        ac.state = "nop";
                    }
                }
                else if(ac.type == "angang" || ac.type == "wangang" || ac.type == "diangang"){
                    if(ac.state != "nop"){
                        var acscore = ac.score;
                        additonalscore += ac.targets.length * acscore * baseScore;
                        //扣掉目标方的分
                        for(var t = 0; t < ac.targets.length; ++t){
                            var six = ac.targets[t];
                            game.gameSeats[six].score -= acscore * baseScore;
                        }                   
                    }
                }
                else if(ac.type == "maozhuanyu"){
                    //对于呼叫转移，如果对方没有叫牌，表示不得行
                    if(isTinged(ac.owner)){
                        //如果
                        var ref = ac.ref;
                        var acscore = ref.score;
                        var total = ref.targets.length * acscore * baseScore;
                        additonalscore += total;
                        //扣掉目标方的分
                        if(ref.payTimes == 0){
                            for(var t = 0; t < ref.targets.length; ++t){
                                var six = ref.targets[t];
                                game.gameSeats[six].score -= acscore * baseScore;
                            }                            
                        }
                        else{
                            //如果已经被扣过一次了，则由杠牌这家赔
                            ac.owner.score -= total;
                        }
                        ref.payTimes++;
                        ac.owner = null;
                        ac.ref = null;
                    }
                }
                else if(ac.type == "zimo" || ac.type == "hu" || ac.type == "ganghua" || ac.type == "dianganghua" || ac.type == "gangpaohu" || ac.type == "qiangganghu" || ac.type == "chadajiao"){
                    var extraScore = 0;
                    if(ac.iszimo){
                        if(game.conf.zimo == 0){
                            //自摸加底
                            extraScore = baseScore;
                        }
                        if(game.conf.zimo == 1){
                            fan += 1;
                        }
                        else{
                            //nothing.
                        }
                        sd.numZiMo ++;
                    }
                    else{
                        if(ac.type != "chadajiao"){
                            sd.numJiePao ++;
                        }
                    }
                    
                    var score = computeFanScore(game,fan) + extraScore;
                    sd.score += score * ac.targets.length;

                    for(var t = 0; t < ac.targets.length; ++t){
                        var six = ac.targets[t];
                        var td = game.gameSeats[six]; 
                        td.score -= score;
                        if(td != sd){
                            if(ac.type == "chadajiao"){
                                td.numChaJiao ++;
                            }
                            else if(!ac.iszimo){
                                td.numDianPao ++;
                            }                            
                        }
                    }
                }
            }

            if(fan > game.conf.maxFan){
                fan = game.conf.maxFan;
            }
            //一定要用 += 。 因为此时的sd.score可能是负的
            sd.score += additonalscore;
            if(sd.pattern != null){
                sd.fan = fan;
            }
        }
        else{
            for(var a = sd.actions.length -1; a >= 0; --a){
                var ac = sd.actions[a];
                if(ac.type == "angang" || ac.type == "wangang" || ac.type == "diangang"){
                    //如果3家都胡牌，则需要结算。否则认为是查叫
                    if(numOfHued < 3){
                        sd.actions.splice(a,1);                        
                    }
                    else{
                        if(ac.state != "nop"){
                            var acscore = ac.score;
                            sd.score += ac.targets.length * acscore * baseScore;
                            //扣掉目标方的分
                            for(var t = 0; t < ac.targets.length; ++t){
                                var six = ac.targets[t];
                                game.gameSeats[six].score -= acscore * baseScore;
                            }                   
                        }   
                    }
                }
            }
        }
    }
}

function doGameOver(game,userId,forceEnd){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    var results = [];
    var dbresult = [0,0,0,0];
    
    var fnNoticeResult = function(isEnd){
        var endinfo = null;
        if(isEnd){
            endinfo = [];
            for(var i = 0; i < roomInfo.seats.length; ++i){
                var rs = roomInfo.seats[i];
                endinfo.push({
                    numzimo:rs.numZiMo,
                    numjiepao:rs.numJiePao,
                    numdianpao:rs.numDianPao,
                    numangang:rs.numAnGang,
                    numminggang:rs.numMingGang,
                    numchadajiao:rs.numChaJiao, 
                });
            }   
        }
        userMgr.broacastInRoom('game_over_push',{results:results,endinfo:endinfo},userId,true);
        //如果局数已够，则进行整体结算，并关闭房间
        if(isEnd){
            setTimeout(function(){
                if(roomInfo.numOfGames > 1){
                    store_history(roomInfo);    
                }
                
                userMgr.kickAllInRoom(roomId);
                roomMgr.destroy(roomId);
                db.archive_games(roomInfo.uuid);            
            },1500);
        }
    }

    if(game != null){
        if(!forceEnd){
            calculateResult(game,roomInfo);    
        }
       
        for(var i = 0; i < roomInfo.seats.length; ++i){
            var rs = roomInfo.seats[i];
            var sd = game.gameSeats[i];

            rs.ready = false;
            rs.score += sd.score;
            rs.numZiMo += sd.numZiMo;
            rs.numJiePao += sd.numJiePao;
            rs.numDianPao += sd.numDianPao;
            rs.numAnGang += sd.numAnGang;
            rs.numMingGang += sd.numMingGang;
            rs.numChaJiao += sd.numChaJiao;
            
            var userRT = {
                userId:sd.userId,
                pengs:sd.pengs,
                actions:[],
                wangangs:sd.wangangs,
                diangangs:sd.diangangs,
                angangs:sd.angangs,
                numofgen:sd.numofgen,
                holds:sd.holds,
                fan:sd.fan,
                score:sd.score,
                totalscore:rs.score,
                qingyise:sd.qingyise,
                pattern:sd.pattern,
                isganghu:sd.isGangHu,
                menqing:sd.isMenQing,
                zhongzhang:sd.isZhongZhang,
                jingouhu:sd.isJinGouHu,
                haidihu:sd.isHaiDiHu,
                tianhu:sd.isTianHu,
                dihu:sd.isDiHu,
                huorder:game.hupaiList.indexOf(i),
            };
            
            for(var k in sd.actions){
                userRT.actions[k] = {
                    type:sd.actions[k].type,
                };
            }
            results.push(userRT);


            dbresult[i] = sd.score;
            delete gameSeatsOfUsers[sd.userId];
        }
        delete games[roomId];
        
        var old = roomInfo.nextButton;
        if(game.yipaoduoxiang >= 0){
            roomInfo.nextButton = game.yipaoduoxiang;
        }
        else if(game.firstHupai >= 0){
            roomInfo.nextButton = game.firstHupai;
        }
        else{
            roomInfo.nextButton = (game.turn + 1) % 4;
        }

        if(old != roomInfo.nextButton){
            db.update_next_button(roomId,roomInfo.nextButton);
        }
    }
    
    if(forceEnd || game == null){
        fnNoticeResult(true);   
    }
    else{
        //保存游戏
        store_game(game,function(ret){
            
            db.update_game_result(roomInfo.uuid,game.gameIndex,dbresult);
            
            //记录打牌信息
            var str = JSON.stringify(game.actionList);
            db.update_game_action_records(roomInfo.uuid,game.gameIndex,str);
        
            //保存游戏局数
            db.update_num_of_turns(roomId,roomInfo.numOfGames);
            
            //如果是第一次，并且不是强制解散 则扣除房卡
            if(roomInfo.numOfGames == 1){
                var cost = 2;
                if(roomInfo.conf.maxGames == 8){
                    cost = 3;
                }
                db.cost_gems(game.gameSeats[0].userId,cost);
            }

            var isEnd = (roomInfo.numOfGames >= roomInfo.conf.maxGames);
            fnNoticeResult(isEnd);
        });   
    }
}

function recordUserAction(game,seatData,type,target){
    var d = {type:type,targets:[]};
    if(target != null){
        if(typeof(target) == 'number'){
            d.targets.push(target);    
        }
        else{
            d.targets = target;
        }
    }
    else{
        for(var i = 0; i < game.gameSeats.length; ++i){
            var s = game.gameSeats[i];
            if(i != seatData.seatIndex && s.hued == false){
                d.targets.push(i);
            }
        }        
    }

    seatData.actions.push(d);
    return d;
}

function recordGameAction(game,si,action,pai){
    game.actionList.push(si);
    game.actionList.push(action);
    if(pai != null){
        game.actionList.push(pai);
    }
}

exports.setReady = function(userId,callback){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    roomMgr.setReady(userId,true);

    var game = games[roomId];
    if(game == null){
        if(roomInfo.seats.length == 4){
            for(var i = 0; i < roomInfo.seats.length; ++i){
                var s = roomInfo.seats[i];
                if(s.ready == false || userMgr.isOnline(s.userId)==false){
                    return;
                }
            }
            //4个人到齐了，并且都准备好了，则开始新的一局
            exports.begin(roomId);
        }
    }
    else{
        var numOfMJ = game.mahjongs.length - game.currentIndex;
        var remainingGames = roomInfo.conf.maxGames - roomInfo.numOfGames;

        var data = {
            state:game.state,
            numofmj:numOfMJ,
            button:game.button,
            turn:game.turn,
            chuPai:game.chuPai,
            huanpaimethod:game.huanpaiMethod
        };

        data.seats = [];
        var seatData = null;
        for(var i = 0; i < 4; ++i){
            var sd = game.gameSeats[i];

            var s = {
                userid:sd.userId,
                folds:sd.folds,
                angangs:sd.angangs,
                diangangs:sd.diangangs,
                wangangs:sd.wangangs,
                pengs:sd.pengs,
                que:sd.que,
                hued:sd.hued,
                iszimo:sd.iszimo,
            }
            if(sd.userId == userId){
                s.holds = sd.holds;
                s.huanpais = sd.huanpais;
                seatData = sd;
            }
            else{
                s.huanpais = sd.huanpais? []:null;
            }
            data.seats.push(s);
        }

        //同步整个信息给客户端
        userMgr.sendMsg(userId,'game_sync_push',data);
        sendOperations(game,seatData,game.chuPai);
    }
}

function store_single_history(userId,history){
    db.get_user_history(userId,function(data){
        if(data == null){
            data = [];
        }
        while(data.length >= 10){
            data.shift();
        }
        data.push(history);
        db.update_user_history(userId,data);
    });
}

function store_history(roomInfo){
    var seats = roomInfo.seats;
    var history = {
        uuid:roomInfo.uuid,
        id:roomInfo.id,
        time:roomInfo.createTime,
        seats:new Array(4)
    };

    for(var i = 0; i < seats.length; ++i){
        var rs = seats[i];
        var hs = history.seats[i] = {};
        hs.userid = rs.userId;
        hs.name = crypto.toBase64(rs.name);
        hs.score = rs.score;
    }

    for(var i = 0; i < seats.length; ++i){
        var s = seats[i];
        store_single_history(s.userId,history);
    }
}

function construct_game_base_info(game){
    var baseInfo = {
        type:game.conf.type,
        button:game.button,
        index:game.gameIndex,
        mahjongs:game.mahjongs,
        game_seats:new Array(4)
    }
    
    for(var i = 0; i < 4; ++i){
        baseInfo.game_seats[i] = game.gameSeats[i].holds;
    }
    game.baseInfoJson = JSON.stringify(baseInfo);
}

function store_game(game,callback){
    db.create_game(game.roomInfo.uuid,game.gameIndex,game.baseInfoJson,callback);
}

//开始新的一局
exports.begin = function(roomId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    var seats = roomInfo.seats;

    var game = {
        conf:roomInfo.conf,
        roomInfo:roomInfo,
        gameIndex:roomInfo.numOfGames,

        button:roomInfo.nextButton,
        mahjongs:new Array(108),
        currentIndex:0,
        gameSeats:new Array(4),

        numOfQue:0,
        turn:0,
        chuPai:-1,
        state:"idle",
        firstHupai:-1,
        yipaoduoxiang:-1,
        fangpaoshumu:-1,
        actionList:[],
        hupaiList:[],
        chupaiCnt:0,
    };

    roomInfo.numOfGames++;

    for(var i = 0; i < 4; ++i){
        var data = game.gameSeats[i] = {};

        data.game = game;

        data.seatIndex = i;

        data.userId = seats[i].userId;
        //持有的牌
        data.holds = [];
        //打出的牌
        data.folds = [];
        //暗杠的牌
        data.angangs = [];
        //点杠的牌
        data.diangangs = [];
        //弯杠的牌
        data.wangangs = [];
        //碰了的牌
        data.pengs = [];
        //缺一门
        data.que = -1;

        //换三张的牌
        data.huanpais = null;

        //玩家手上的牌的数目，用于快速判定碰杠
        data.countMap = {};
        //玩家听牌，用于快速判定胡了的番数
        data.tingMap = {};
        data.pattern = "";

        //是否可以杠
        data.canGang = false;
        //用于记录玩家可以杠的牌
        data.gangPai = [];

        //是否可以碰
        data.canPeng = false;
        //是否可以胡
        data.canHu = false;
        //是否可以出牌
        data.canChuPai = false;

        //如果guoHuFan >=0 表示处于过胡状态，
        //如果过胡状态，那么只能胡大于过胡番数的牌
        data.guoHuFan = -1;

        //是否胡了
        data.hued = false;
        //是否是自摸
        data.iszimo = false;

        data.isGangHu = false;

        //
        data.actions = [];

        data.fan = 0;
        data.score = 0;
        data.lastFangGangSeat = -1;
        
        //统计信息
        data.numZiMo = 0;
        data.numJiePao = 0;
        data.numDianPao = 0;
        data.numAnGang = 0;
        data.numMingGang = 0;
        data.numChaJiao = 0;

        gameSeatsOfUsers[data.userId] = data;
    }
    games[roomId] = game;
    //洗牌
    shuffle(game);
    //发牌
    deal(game);

    

    var numOfMJ = game.mahjongs.length - game.currentIndex;
    var huansanzhang = roomInfo.conf.hsz;

    for(var i = 0; i < seats.length; ++i){
        //开局时，通知前端必要的数据
        var s = seats[i];
        //通知玩家手牌
        userMgr.sendMsg(s.userId,'game_holds_push',game.gameSeats[i].holds);
        //通知还剩多少张牌
        userMgr.sendMsg(s.userId,'mj_count_push',numOfMJ);
        //通知还剩多少局
        userMgr.sendMsg(s.userId,'game_num_push',roomInfo.numOfGames);
        //通知游戏开始
        userMgr.sendMsg(s.userId,'game_begin_push',game.button);

        if(huansanzhang == true){
            game.state = "huanpai";
            //通知准备换牌
            userMgr.sendMsg(s.userId,'game_huanpai_push');
        }
        else{
            game.state = "dingque";
            //通知准备定缺
            userMgr.sendMsg(s.userId,'game_dingque_push');
        }
    }
};

exports.huanSanZhang = function(userId,p1,p2,p3){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var game = seatData.game;
    if(game.state != "huanpai"){
        console.log("can't recv huansanzhang when game.state == " + game.state);
        return;
    }

    if(seatData.huanpais != null){
        console.log("player has done this action.");
        return;
    }

    if(seatData.countMap[p1] == null || seatData.countMap[p1] == 0){
        return;
    }
    seatData.countMap[p1]--;

    if(seatData.countMap[p2] == null || seatData.countMap[p2] == 0){
        seatData.countMap[p1]++;
        return;
    }
    seatData.countMap[p2]--;

    if(seatData.countMap[p3] == null || seatData.countMap[p3] == 0){
        seatData.countMap[p1]++;
        seatData.countMap[p2]++;
        return;
    }

    seatData.countMap[p1]++;
    seatData.countMap[p2]++;

    seatData.huanpais = [p1,p2,p3];
    
    for(var i = 0; i < seatData.huanpais.length; ++i){
        var p = seatData.huanpais[i];
        var idx = seatData.holds.indexOf(p);
        seatData.holds.splice(idx,1);
        seatData.countMap[p] --;
    }
    userMgr.sendMsg(seatData.userId,'game_holds_push',seatData.holds);
    
    for(var i = 0; i < game.gameSeats.length; ++i){
        var sd = game.gameSeats[i];
        if(sd == seatData){
            var rd = {
                si:seatData.userId,
                huanpais:seatData.huanpais
            };
            userMgr.sendMsg(sd.userId,'huanpai_notify',rd);            
        }
        else{
            var rd = {
                si:seatData.userId,
                huanpais:[]
            };
            userMgr.sendMsg(sd.userId,'huanpai_notify',rd);
        }
    }

    //如果还有未换牌的玩家，则继承等待
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].huanpais == null){
            return;
        }
    }


    //换牌函数
    var fn = function(s1,huanjin){
        for(var i = 0; i < huanjin.length; ++i){
            var p = huanjin[i];
            s1.holds.push(p);
            if(s1.countMap[p] == null){
                s1.countMap[p] = 0;    
            }
            s1.countMap[p] ++;
        }
    }

    //开始换牌
    var f = Math.random();
    var s = game.gameSeats;
    var huanpaiMethod = 0;
    //对家换牌
    if(f < 0.33){
        fn(s[0],s[2].huanpais);
        fn(s[1],s[3].huanpais);
        fn(s[2],s[0].huanpais);
        fn(s[3],s[1].huanpais);
        huanpaiMethod = 0;
    }
    //换下家的牌
    else if(f < 0.66){
        fn(s[0],s[1].huanpais);
        fn(s[1],s[2].huanpais);
        fn(s[2],s[3].huanpais);
        fn(s[3],s[0].huanpais);
        huanpaiMethod = 1;
    }
    //换上家的牌
    else{
        fn(s[0],s[3].huanpais);
        fn(s[1],s[0].huanpais);
        fn(s[2],s[1].huanpais);
        fn(s[3],s[2].huanpais);
        huanpaiMethod = 2;
    }
    
    var rd = {
        method:huanpaiMethod,
    }
    game.huanpaiMethod = huanpaiMethod;

    game.state = "dingque";
    for(var i = 0; i < s.length; ++i){
        var userId = s[i].userId;
        userMgr.sendMsg(userId,'game_huanpai_over_push',rd);

        userMgr.sendMsg(userId,'game_holds_push',s[i].holds);
        //通知准备定缺
        userMgr.sendMsg(userId,'game_dingque_push');
    }
};

exports.dingQue = function(userId,type){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var game = seatData.game;
    if(game.state != "dingque"){
        console.log("can't recv dingQue when game.state == " + game.state);
        return;
    }

    if(seatData.que < 0){
        game.numOfQue++;    
    }

    seatData.que = type;
    

    //检查玩家可以做的动作
    //如果4个人都定缺了，通知庄家出牌
    if(game.numOfQue == 4){
        construct_game_base_info(game);
        var arr = [1,1,1,1];
        for(var i = 0; i < game.gameSeats.length; ++i){
            arr[i] = game.gameSeats[i].que;
        }
        userMgr.broacastInRoom('game_dingque_finish_push',arr,seatData.userId,true);
        userMgr.broacastInRoom('game_playing_push',null,seatData.userId,true);

        //进行听牌检查
        for(var i = 0; i < game.gameSeats.length; ++i){
            var duoyu = -1;
            var gs = game.gameSeats[i];
            if(gs.holds.length == 14){
                duoyu = gs.holds.pop();
                gs.countMap[duoyu] -= 1;
            }
            checkCanTingPai(game,gs);
            if(duoyu >= 0){
                gs.holds.push(duoyu);
                gs.countMap[duoyu] ++;
            }
        }
        
        var turnSeat = game.gameSeats[game.turn];
        game.state = "playing";
        //通知玩家出牌方
        turnSeat.canChuPai = true;
        userMgr.broacastInRoom('game_chupai_push',turnSeat.userId,turnSeat.userId,true);
        //检查是否可以暗杠或者胡
        //直杠
        checkCanAnGang(game,turnSeat);
        //检查胡 用最后一张来检查
        checkCanHu(game,turnSeat,turnSeat.holds[turnSeat.holds.length - 1]);
        //通知前端
        sendOperations(game,turnSeat,game.chuPai);
    }
    else{
        userMgr.broacastInRoom('game_dingque_notify_push',seatData.userId,seatData.userId,true);
    }
};

exports.chuPai = function(userId,pai){

    pai = Number.parseInt(pai);
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var game = seatData.game;
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if(game.turn != seatData.seatIndex){
        console.log("not your turn.");
        return;
    }

    if(seatData.hued){
        console.log('you have already hued. no kidding plz.');
        return;
    }

    if(seatData.canChuPai == false){
        console.log('no need chupai.');
        return;
    }

    if(hasOperations(seatData)){
        console.log('plz guo before you chupai.');
        return;
    }

    //从此人牌中扣除
    var index = seatData.holds.indexOf(pai);
    if(index == -1){
        console.log("holds:" + seatData.holds);
        console.log("can't find mj." + pai);
        return;
    }
    
    seatData.canChuPai = false;
    game.chupaiCnt ++;
    seatData.guoHuFan = -1;
    
    seatData.holds.splice(index,1);
    seatData.countMap[pai] --;
    game.chuPai = pai;
    recordGameAction(game,seatData.seatIndex,ACTION_CHUPAI,pai);
    checkCanTingPai(game,seatData);
   
    userMgr.broacastInRoom('game_chupai_notify_push',{userId:seatData.userId,pai:pai},seatData.userId,true);

    //如果出的牌可以胡，则算过胡
    if(seatData.tingMap[game.chuPai]){
        seatData.guoHuFan = seatData.tingMap[game.chuPai].fan;
    }
    
    //检查是否有人要胡，要碰 要杠
    var hasActions = false;
    for(var i = 0; i < game.gameSeats.length; ++i){
        //玩家自己不检查
        if(game.turn == i){
            continue;
        }
        var ddd = game.gameSeats[i];
        //已经和牌的不再检查
        if(ddd.hued){
            continue;
        }

        checkCanHu(game,ddd,pai);
        if(seatData.lastFangGangSeat == -1){
            if(ddd.canHu && ddd.guoHuFan >= 0 && ddd.tingMap[pai].fan <= ddd.guoHuFan){
                console.log("ddd.guoHuFan:" + ddd.guoHuFan);
                ddd.canHu = false;
                userMgr.sendMsg(ddd.userId,'guohu_push');            
            }     
        }
        checkCanPeng(game,ddd,pai);
        checkCanDianGang(game,ddd,pai);
        if(hasOperations(ddd)){
            sendOperations(game,ddd,game.chuPai);
            hasActions = true;    
        }
    }
    
    //如果没有人有操作，则向下一家发牌，并通知他出牌
    if(!hasActions){
        setTimeout(function(){
            userMgr.broacastInRoom('guo_notify_push',{userId:seatData.userId,pai:game.chuPai},seatData.userId,true);
            seatData.folds.push(game.chuPai);
            game.chuPai = -1;
            moveToNextUser(game);
            doUserMoPai(game);
        },500);
    }
};

exports.peng = function(userId){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var game = seatData.game;

    //如果是他出的牌，则忽略
    if(game.turn == seatData.seatIndex){
        console.log("it's your turn.");
        return;
    }

    //如果没有碰的机会，则不能再碰
    if(seatData.canPeng == false){
        console.log("seatData.peng == false");
        return;
    }

    //和的了，就不要再来了
    if(seatData.hued){
        console.log('you have already hued. no kidding plz.');
        return;
    }
    
    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while(true){
        var i = (i + 1)%4;
        if(i == game.turn){
            break;
        }
        else{
            var ddd = game.gameSeats[i];
            if(ddd.canHu && i != seatData.seatIndex){
                return;    
            }
        }
    }


    clearAllOptions(game);

    //验证手上的牌的数目
    var pai = game.chuPai;
    var c = seatData.countMap[pai];
    if(c == null || c < 2){
        console.log("pai:" + pai + ",count:" + c);
        console.log(seatData.holds);
        console.log("lack of mj.");
        return;
    }

    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for(var i = 0; i < 2; ++i){
        var index = seatData.holds.indexOf(pai);
        if(index == -1){
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index,1);
        seatData.countMap[pai] --;
    }
    seatData.pengs.push(pai);
    game.chuPai = -1;

    recordGameAction(game,seatData.seatIndex,ACTION_PENG,pai);

    //广播通知其它玩家
    userMgr.broacastInRoom('peng_notify_push',{userid:seatData.userId,pai:pai},seatData.userId,true);

    //碰的玩家打牌
    moveToNextUser(game,seatData.seatIndex);
    
    //广播通知玩家出牌方
    seatData.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push',seatData.userId,seatData.userId,true);
};

exports.isPlaying = function(userId){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        return false;
    }

    var game = seatData.game;

    if(game.state == "idle"){
        return false;
    }
    return true;
}

function checkCanQiangGang(game,turnSeat,seatData,pai){
    var hasActions = false;
    for(var i = 0; i < game.gameSeats.length; ++i){
        //杠牌者不检查
        if(seatData.seatIndex == i){
            continue;
        }
        var ddd = game.gameSeats[i];
        //已经和牌的不再检查
        if(ddd.hued){
            continue;
        }

        checkCanHu(game,ddd,pai);
        if(ddd.canHu){
            sendOperations(game,ddd,pai);
            hasActions = true;
        }
    }
    if(hasActions){
        game.qiangGangContext = {
            turnSeat:turnSeat,
            seatData:seatData,
            pai:pai,
            isValid:true,
        }
    }
    else{
        game.qiangGangContext = null;
    }
    return game.qiangGangContext != null;
}

function doGang(game,turnSeat,seatData,gangtype,numOfCnt,pai){
    var seatIndex = seatData.seatIndex;
    var gameTurn = turnSeat.seatIndex;
    
    var isZhuanShouGang = false;
    if(gangtype == "wangang"){
        var idx = seatData.pengs.indexOf(pai);
        if(idx >= 0){
            seatData.pengs.splice(idx,1);
        }
        
        //如果最后一张牌不是杠的牌，则认为是转手杠
        if(seatData.holds[seatData.holds.length - 1] != pai){
            isZhuanShouGang = true;
        }
    }
    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for(var i = 0; i < numOfCnt; ++i){
        var index = seatData.holds.indexOf(pai);
        if(index == -1){
            console.log(seatData.holds);
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index,1);
        seatData.countMap[pai] --;
    }

    recordGameAction(game,seatData.seatIndex,ACTION_GANG,pai);

    //记录下玩家的杠牌
    if(gangtype == "angang"){
        seatData.angangs.push(pai);
        var ac = recordUserAction(game,seatData,"angang");
        ac.score = game.conf.baseScore*2;
    }
    else if(gangtype == "diangang"){
        seatData.diangangs.push(pai);
        var ac = recordUserAction(game,seatData,"diangang",gameTurn);
        ac.score = game.conf.baseScore*2;
        var fs = turnSeat;
        recordUserAction(game,fs,"fanggang",seatIndex);
    }
    else if(gangtype == "wangang"){
        seatData.wangangs.push(pai);
        if(isZhuanShouGang == false){
            var ac = recordUserAction(game,seatData,"wangang");
            ac.score = game.conf.baseScore;            
        }
        else{
            recordUserAction(game,seatData,"zhuanshougang");
        }
    }

    checkCanTingPai(game,seatData);
    //通知其他玩家，有人杠了牌
    userMgr.broacastInRoom('gang_notify_push',{userid:seatData.userId,pai:pai,gangtype:gangtype},seatData.userId,true);

    //变成自己的轮子
    moveToNextUser(game,seatIndex);
    //再次摸牌
    doUserMoPai(game);   
    
    //只能放在这里。因为过手就会清除杠牌标记
    seatData.lastFangGangSeat = gameTurn;
}

exports.gang = function(userId,pai){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //如果没有杠的机会，则不能再杠
    if(seatData.canGang == false) {
        console.log("seatData.gang == false");
        return;
    }

    //和的了，就不要再来了
    if(seatData.hued){
        console.log('you have already hued. no kidding plz.');
        return;
    }

    if(seatData.gangPai.indexOf(pai) == -1){
        console.log("the given pai can't be ganged.");
        return;   
    }
    
    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while(true){
        var i = (i + 1)%4;
        if(i == game.turn){
            break;
        }
        else{
            var ddd = game.gameSeats[i];
            if(ddd.canHu && i != seatData.seatIndex){
                return;    
            }
        }
    }

    var numOfCnt = seatData.countMap[pai];

    var gangtype = ""
    //弯杠 去掉碰牌
    if(numOfCnt == 1){
        gangtype = "wangang"
    }
    else if(numOfCnt == 3){
        gangtype = "diangang"
    }
    else if(numOfCnt == 4){
        gangtype = "angang";
    }
    else{
        console.log("invalid pai count.");
        return;
    }
    
    game.chuPai = -1;
    clearAllOptions(game);
    seatData.canChuPai = false;
    
    userMgr.broacastInRoom('hangang_notify_push',seatIndex,seatData.userId,true);
    
    //如果是弯杠，则需要检查是否可以抢杠
    var turnSeat = game.gameSeats[game.turn];
    if(numOfCnt == 1){
        var canQiangGang = checkCanQiangGang(game,turnSeat,seatData,pai);
        if(canQiangGang){
            return;
        }
    }
    
    doGang(game,turnSeat,seatData,gangtype,numOfCnt,pai);
};

exports.hu = function(userId){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //如果他不能和牌，那和个啥啊
    if(seatData.canHu == false){
        console.log("invalid request.");
        return;
    }

    //和的了，就不要再来了
    if(seatData.hued){
        console.log('you have already hued. no kidding plz.');
        return;
    }

    //标记为和牌
    seatData.hued = true;
    var hupai = game.chuPai;
    var isZimo = false;

    var turnSeat = game.gameSeats[game.turn];
    seatData.isGangHu = turnSeat.lastFangGangSeat >= 0;
    var notify = -1;
    
    if(game.qiangGangContext != null){
        var gangSeat = game.qiangGangContext.seatData;
        hupai = game.qiangGangContext.pai;
        notify = hupai;
        var ac = recordUserAction(game,seatData,"qiangganghu",gangSeat.seatIndex);    
        ac.iszimo = false;
        recordGameAction(game,seatIndex,ACTION_HU,hupai);
        seatData.isQiangGangHu = true;
        game.qiangGangContext.isValid = false;
        
        
        var idx = gangSeat.holds.indexOf(hupai);
        if(idx != -1){
            gangSeat.holds.splice(idx,1);
            gangSeat.countMap[hupai]--;
            userMgr.sendMsg(gangSeat.userId,'game_holds_push',gangSeat.holds);
        }
        //将牌添加到玩家的手牌列表，供前端显示
        seatData.holds.push(hupai);
        if(seatData.countMap[hupai]){
            seatData.countMap[hupai]++;
        }
        else{
            seatData.countMap[hupai] = 1;
        }
        
        recordUserAction(game,gangSeat,"beiqianggang",seatIndex);
    }
    else if(game.chuPai == -1){
        hupai = seatData.holds[seatData.holds.length - 1];
        notify = -1;
        if(seatData.isGangHu){
            if(turnSeat.lastFangGangSeat == seatIndex){
                var ac = recordUserAction(game,seatData,"ganghua");    
                ac.iszimo = true;
            }
            else{
                var diangganghua_zimo = game.conf.dianganghua == 1;
                if(diangganghua_zimo){
                    var ac = recordUserAction(game,seatData,"dianganghua");
                    ac.iszimo = true;
                }
                else{
                    var ac = recordUserAction(game,seatData,"dianganghua",turnSeat.lastFangGangSeat);
                    ac.iszimo = false;
                }
            }
        }
        else{
            var ac = recordUserAction(game,seatData,"zimo");
            ac.iszimo = true;
        }

        isZimo = true;
        recordGameAction(game,seatIndex,ACTION_ZIMO,hupai);
    }
    else{
        notify = game.chuPai;
        //将牌添加到玩家的手牌列表，供前端显示
        seatData.holds.push(game.chuPai);
        if(seatData.countMap[game.chuPai]){
            seatData.countMap[game.chuPai]++;
        }
        else{
            seatData.countMap[game.chuPai] = 1;
        }

        console.log(seatData.holds);

        var at = "hu";
        //炮胡
        if(turnSeat.lastFangGangSeat >= 0){
            at = "gangpaohu";
        }

        var ac = recordUserAction(game,seatData,at,game.turn);
        ac.iszimo = false;

        //毛转雨
        if(turnSeat.lastFangGangSeat >= 0){
            for(var i = turnSeat.actions.length-1; i >= 0; --i){
                var t = turnSeat.actions[i];
                if(t.type == "diangang" || t.type == "wangang" || t.type == "angang"){
                    t.state = "nop";
                    t.payTimes = 0;

                    var nac = {
                        type:"maozhuanyu",
                        owner:turnSeat,
                        ref:t
                    }
                    seatData.actions.push(nac);
                    break;
                }
            }
        }

        //记录玩家放炮信息
        var fs = game.gameSeats[game.turn];
        recordUserAction(game,fs,"fangpao",seatIndex);

        recordGameAction(game,seatIndex,ACTION_HU,hupai);

        game.fangpaoshumu++;

        if(game.fangpaoshumu > 1){
            game.yipaoduoxiang = seatIndex;
        }
    }

    if(game.firstHupai < 0){
        game.firstHupai = seatIndex;
    }

    //保存番数
    var ti = seatData.tingMap[hupai];
    seatData.fan = ti.fan;
    seatData.pattern = ti.pattern;
    seatData.iszimo = isZimo;
    //如果是最后一张牌，则认为是海底胡
    seatData.isHaiDiHu = game.currentIndex == game.mahjongs.length;
    game.hupaiList.push(seatData.seatIndex);
    
    if(game.conf.tiandihu){
        if(game.chupaiCnt == 0 && game.button == seatData.seatIndex && game.chuPai == -1){
            seatData.isTianHu = true;
        }
        else if(game.chupaiCnt == 1 && game.turn == game.button && game.button != seatData.seatIndex && game.chuPai != -1){
            seatData.isDiHu = true;   
        }   
    }

    clearAllOptions(game,seatData);

    //通知前端，有人和牌了
    userMgr.broacastInRoom('hu_push',{seatindex:seatIndex,iszimo:isZimo,hupai:notify},seatData.userId,true);
    
    //
    if(game.lastHuPaiSeat == -1){
        game.lastHuPaiSeat = seatIndex;
    }
    else{
        var lp = (game.lastFangGangSeat - game.turn + 4) % 4;
        var cur = (seatData.seatIndex - game.turn + 4) % 4;
        if(cur > lp){
            game.lastHuPaiSeat = seatData.seatIndex;
        }
    }

    //如果只有一家没有胡，则结束
    var numOfHued = 0;
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ddd = game.gameSeats[i];
        if(ddd.hued){
            numOfHued ++;
        }
    }
    //和了三家
    if(numOfHued == 3){
        doGameOver(game,seatData.userId);
        return;
    }

    //清空所有非胡牌操作
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ddd = game.gameSeats[i];
        ddd.canPeng = false;
        ddd.canGang = false;
        ddd.canChuPai = false;
        sendOperations(game,ddd,hupai);
    }

    //如果还有人可以胡牌，则等待
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ddd = game.gameSeats[i];
        if(ddd.canHu){
            return;
        }
    }
    
    //和牌的下家继续打
    clearAllOptions(game);
    game.turn = game.lastHuPaiSeat;
    moveToNextUser(game);
    doUserMoPai(game);
};

exports.guo = function(userId){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //如果玩家没有对应的操作，则也认为是非法消息
    if((seatData.canGang || seatData.canPeng || seatData.canHu) == false){
        console.log("no need guo.");
        return;
    }

    //如果是玩家自己的轮子，不是接牌，则不需要额外操作
    var doNothing = game.chuPai == -1 && game.turn == seatIndex;

    userMgr.sendMsg(seatData.userId,"guo_result");
    clearAllOptions(game,seatData);
    
    //这里还要处理过胡的情况
    if(game.chuPai >= 0 && seatData.canHu){
        seatData.guoHuFan = seatData.tingMap[game.chuPai].fan;
    }

    if(doNothing){
        return;
    }
    
    //如果还有人可以操作，则等待
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ddd = game.gameSeats[i];
        if(hasOperations(ddd)){
            return;
        }
    }

    //如果是已打出的牌，则需要通知。
    if(game.chuPai >= 0){
        var uid = game.gameSeats[game.turn].userId;
        userMgr.broacastInRoom('guo_notify_push',{userId:uid,pai:game.chuPai},seatData.userId,true);
        seatData.folds.push(game.chuPai);
        game.chuPai = -1;
    }
    
    
    var qiangGangContext = game.qiangGangContext;
    //清除所有的操作
    clearAllOptions(game);
    
    if(qiangGangContext != null && qiangGangContext.isValid){
        doGang(game,qiangGangContext.turnSeat,qiangGangContext.seatData,"wangang",1,qiangGangContext.pai);        
    }
    else{
        //下家摸牌
        moveToNextUser(game);
        doUserMoPai(game);   
    }
};

exports.hasBegan = function(roomId){
    var game = games[roomId];
    if(game != null){
        return true;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo != null){
        return roomInfo.numOfGames > 0;
    }
    return false;
};


var dissolvingList = [];

exports.doDissolve = function(roomId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return null;
    }

    var game = games[roomId];
    doGameOver(game,roomInfo.seats[0].userId,true);
};

exports.dissolveRequest = function(roomId,userId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return null;
    }

    if(roomInfo.dr != null){
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null){
        return null;
    }

    roomInfo.dr = {
        endTime:Date.now() + 30000,
        states:[false,false,false,false]
    };
    roomInfo.dr.states[seatIndex] = true;

    dissolvingList.push(roomId);

    return roomInfo;
};

exports.dissolveAgree = function(roomId,userId,agree){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return null;
    }

    if(roomInfo.dr == null){
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null){
        return null;
    }

    if(agree){
        roomInfo.dr.states[seatIndex] = true;
    }
    else{
        roomInfo.dr = null;
        var idx = dissolvingList.indexOf(roomId);
        if(idx != -1){
            dissolvingList.splice(idx,1);           
        }
    }
    return roomInfo;
};



function update() {
    for(var i = dissolvingList.length - 1; i >= 0; --i){
        var roomId = dissolvingList[i];
        
        var roomInfo = roomMgr.getRoom(roomId);
        if(roomInfo != null && roomInfo.dr != null){
            if(Date.now() > roomInfo.dr.endTime){
                console.log("delete room and games");
                exports.doDissolve(roomId);
                dissolvingList.splice(i,1); 
            }
        }
        else{
            dissolvingList.splice(i,1);
        }
    }
}

setInterval(update,1000);

/*
var mokgame = {
    gameSeats:[{folds:[]}],
    mahjongs:[],
    currentIndex:-1,
    conf:{
        wz_yaojidai:2,
    }
}
var mokseat = {
    holds:[9,9,9,9,1,2,3,3,4,5,18,18,18,18],
    isBaoTing:true,
    countMap:{},
    pengs:[],
    feis:[],
    diangangs:[],
    angangs:[],
    wangangs:[],
    diansuos:[],
    wansuos:[],
    ansuos:[],
    gangPai:[]
}

for(var k in mokseat.holds){
    var pai = mokseat.holds[k];
    if(mokseat.countMap[pai]){
        mokseat.countMap[pai] ++;
    }
    else{
        mokseat.countMap[pai] = 1;
    }
}
checkCanAnGang(mokgame,mokseat);
console.log(mokseat.gangPai);
*/