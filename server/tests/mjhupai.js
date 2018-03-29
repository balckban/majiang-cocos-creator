var nameMap = {
	[0]:'1筒',
	[1]:'2筒',
	[2]:'3筒',
	[3]:'4筒',
	[4]:'5筒',
	[5]:'6筒',
	[6]:'7筒',
	[7]:'8筒',
	[8]:'9筒',
	[9]:'1条',
	[10]:'2条',
	[11]:'3条',
	[12]:'4条',
	[13]:'5条',
	[14]:'6条',
	[15]:'7条',
	[16]:'8条',
	[17]:'9条',
	[18]:'1万',
	[19]:'2万',
	[20]:'3万',
	[21]:'4万',
	[22]:'5万',
	[23]:'6万',
	[24]:'7万',
	[25]:'8万',
	[26]:'9万',
}

var seatData = {
	//holds:[3,1,2,5,7,12,23,13,10,24,24,16,5],
	holds:[1,1,1,3,3,3,5,5,5,24,24,24,17],
	countMap:{},
	tingMap:{}
}

var str = "";

for(var i = 0; i < seatData.holds.length; ++i){
	var pai = seatData.holds[i];
	if(seatData.countMap[pai] == null){
		seatData.countMap[pai] = 1;
	}
	else{
		seatData.countMap[pai] ++;
	}
	
	str += nameMap[pai];
}

console.log(str);

console.log(seatData.countMap);


	
function checkTingPai(seatData,begin,end){
	for(var i = begin; i < end; ++i){
		//将牌加入到计数中
		var old = seatData.countMap[i];
		if(old == null){
			old = null;
			seatData.countMap[i] = 1;
		}
		else{
			seatData.countMap[i] ++;		
		}

		seatData.holds.push(i);
		//逐个判定手上的牌
		var ret = checkCanHu(seatData);
		if(ret){
			seatData.tingMap[i] = true;
		}
		
		//搞完以后，撤消刚刚加的牌
		if(old == null){
			delete seatData.countMap[i];
		}
		else{
			seatData.countMap[i] = old;
		}
		seatData.holds.pop();
	}	
}

var kanzi = [];
var record = false;
function debugRecord(pai){
	if(record){
		kanzi.push(pai);
	}
}

function matchSingle(seatData,selected,d){
	//分开匹配 A-2,A-1,A
	var matched = true;
	var v = selected % 9;
	if(v < 2){
		matched = false;
	}
	else{
		for(var i = 0; i < 3; ++i){
			var t = selected - 2 + i;
			var cc = seatData.countMap[t];
			if(cc == null){
				matched = false;
				break;
			}
			if(cc == 0){
				matched = false;
				break;
			}
		}		
	}
	//匹配成功，扣除相应数值
	if(matched){
		//console.log("A-2,A-1,A" + selected);
		seatData.countMap[selected - 2] --;
		seatData.countMap[selected - 1] --;
		seatData.countMap[selected] --;
		var ret = checkSingle(seatData,d+1);
		seatData.countMap[selected - 2] ++;
		seatData.countMap[selected - 1] ++;
		seatData.countMap[selected] ++;
		if(ret == true){
			debugRecord(selected - 2);
			debugRecord(selected - 1);
			debugRecord(selected);
			return true;
		}		
	}

	//分开匹配 A-1,A,A + 1
	matched = true;
	if(v < 1 || v > 8){
		matched = false;
	}
	else{
		for(var i = 0; i < 3; ++i){
			var t = selected - 1 + i;
			var cc = seatData.countMap[t];
			if(cc == null){
				matched = false;
				break;
			}
			if(cc == 0){
				matched = false;
				break;
			}
		}		
	}

	//匹配成功，扣除相应数值
	if(matched){
		//console.log("A-1,A,A + 1" + selected);
		seatData.countMap[selected - 1] --;
		seatData.countMap[selected] --;
		seatData.countMap[selected + 1] --;
		var ret = checkSingle(seatData,d+1);
		seatData.countMap[selected - 1] ++;
		seatData.countMap[selected] ++;
		seatData.countMap[selected + 1] ++;
		if(ret == true){
			debugRecord(selected - 1);
			debugRecord(selected);
			debugRecord(selected + 1);
			return true;
		}		
	}
	
	
	//分开匹配 A,A+1,A + 2
	matched = true;
	if(v > 6){
		matched = false;
	}
	else{
		for(var i = 0; i < 3; ++i){
			var t = selected + i;
			var cc = seatData.countMap[t];
			if(cc == null){
				matched = false;
				break;
			}
			if(cc == 0){
				matched = false;
				break;
			}
		}		
	}

	//匹配成功，扣除相应数值
	if(matched){
		//console.log("A,A+1,A + 2" + selected);
		seatData.countMap[selected] --;
		seatData.countMap[selected + 1] --;
		seatData.countMap[selected + 2] --;
		var ret = checkSingle(seatData,d+1);
		seatData.countMap[selected] ++;
		seatData.countMap[selected + 1] ++;
		seatData.countMap[selected + 2] ++;
		if(ret == true){
			debugRecord(selected);
			debugRecord(selected + 1);
			debugRecord(selected + 2);
			return true;
		}		
	}
	return false;
}

function checkSingle(seatData,d){
	//console.log(d);
	var holds = seatData.holds;
	var selected = -1;
	var c = 0;
	for(var i = 0; i < holds.length; ++i){
		var pai = holds[i];
		c = seatData.countMap[pai];
		if(c != 0){
			selected = pai;
			break;
		}
	}
	
	//如果没有找到剩余牌，则表示匹配成功了
	if(selected == -1){
		return true;
	}
	//否则，进行匹配
	if(c == 3){
		//直接作为一坎
		seatData.countMap[selected] = 0;
		debugRecord(selected);
		debugRecord(selected);
		debugRecord(selected);
		var ret = checkSingle(seatData,d+1);
		//立即恢复对数据的修改
		seatData.countMap[selected] = c;
		if(ret == true){
			return true;
		}
	}
	else if(c == 4){
		//直接作为一坎
		seatData.countMap[selected] = 1;
		debugRecord(selected);
		debugRecord(selected);
		debugRecord(selected);
		var ret = checkSingle(seatData,d+1);
		//立即恢复对数据的修改
		seatData.countMap[selected] = c;
		//如果作为一坎能够把牌匹配完，直接返回TRUE。
		if(ret == true){
			return true;
		}
	}
	
	//按单牌处理
	return matchSingle(seatData,selected,d);
}

function checkCanHu(seatData){
	for(var k in seatData.countMap){
		k = parseInt(k);
		var c = seatData.countMap[k];
		if(c < 2){
			continue;
		}
		//如果当前牌大于等于２，则将它选为将牌
		seatData.countMap[k] -= 2;
		//逐个判定剩下的牌是否满足　３Ｎ规则,一个牌会有以下几种情况
		//1、0张，则不做任何处理
		//2、2张，则只可能是与其它牌形成匹配关系
		//3、3张，则可能是单张形成 A-2,A-1,A  A-1,A,A+1  A,A+1,A+2，也可能是直接成为一坎
		//4、4张，则只可能是一坎+单张
		kanzi = [];
		var ret = checkSingle(seatData,1);
		seatData.countMap[k] += 2;
		if(ret){
			kanzi.push(k);
			kanzi.push(k);
			console.log(kanzi);
			return true;
		}
	}
}

console.log(Date.now());
//检查筒子
checkTingPai(seatData,0,9);
//检查条子
checkTingPai(seatData,9,18);
//检查万字
checkTingPai(seatData,18,27);
console.log(Date.now());

for(k in seatData.tingMap){
	console.log(nameMap[k]);	
}
