var wechat = require('../wechat/config').wechat;
var https = require('https');
var WXBizDataCrypt = require('../wechat/WXBizDataCrypt')
var iconv = require('iconv-lite')


module.exports = {
    // 解密微信openid和session_key
    wx_decode: function(params){
        var url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wechat.appId}&secret=${wechat.appserect}&js_code=${params.code}&grant_type=authorization_code`;
        return function(){
            https.get(url, function(reslt){
                var datas = [];
                var size = 0;
                reslt.on('data', function (data) {
                    datas.push(data);
                    size += data.length;
                });
                reslt.on("end", function () {
                    var buff = Buffer.concat(datas, size);
                    var result = JSON.parse(iconv.decode(buff, "utf8"));
                    console.log('微信平台解密后的数据', result.session_key);
                    return result;
                })
            })
        }
    },
    
    // 本地解密算法获取用户信息
    decode: function(params,session_key){
       return function(){
        if(result.session_key) {      
            var pc = new WXBizDataCrypt(wechat.appId, session_key);
            var data = pc.decryptData(params.encryptedData , params.iv); 
            console.log('解密后的用户数据', data);
            return data;
        }else{
            return 'session_key未获取成功'
        }
       }
    },
    
    // 生成核销码
    create_code: function(){
        var code = Math.random().toString(36).substr(2);
        return code;
    }
}