var wechat = require('../wechat/config').wechat
var Q = require("q") 
var request = require("request") 
var crypto = require('crypto') 
var fs = require('fs')
var https = require('https')
var key = wechat.key
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray : false, ignoreAttrs : true})
var builder = new xml2js.Builder();
module.exports = {
 // 获取prepay_id
 getXMLNodeValue: function(node_name, xml) { 
  var tmp = xml.split("<" + node_name + ">") 
  var _tmp = tmp[1].split("</" + node_name + ">") 
  return _tmp[0] 
 },
 // object-->string
 raw: function(args) { 
  var keys = Object.keys(args) 
  keys = keys.sort() 
  var newArgs = {} 
  keys.forEach(function(key) { 
    newArgs[key] = args[key] 
  }) 
  var string = ''
  for (var k in newArgs) { 
    string += '&' + k + '=' + newArgs[k] 
  } 
  string = string.substr(1) 
  return string 
 }, 
  // 随机字符串产生函数 
 createNonceStr: function() { 
   return Math.random().toString(36).substr(2, 15) 
 }, 
 // 时间戳产生函数 
 createTimeStamp: function() { 
   return parseInt(new Date().getTime() / 1000) + ''
 },
 // 支付md5加密获取sign
 paysignjs: function(appid, nonceStr, package, signType, timeStamp) { 
  var ret = { 
    appId: appid, 
    nonceStr: nonceStr, 
    package: package, 
    signType: signType, 
    timeStamp: timeStamp 
  } 
  var string = this.raw(ret) 
  string = string + '&key=' + key 
  var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex') 
  return sign.toUpperCase() 
 },
 // 统一下单接口加密获取sign
 paysignjsapi: function(appid, attach, body, mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, trade_type) { 
  var ret = { 
   appid: appid, 
   attach: attach, 
   body: body, 
   mch_id: mch_id, 
   nonce_str: nonce_str, 
   notify_url: notify_url, 
   openid: openid, 
   out_trade_no: out_trade_no, 
   spbill_create_ip: spbill_create_ip, 
   total_fee: total_fee, 
   trade_type: trade_type 
  } 
  var string = this.raw(ret) 
  string = string + '&key=' + key 
  var crypto = require('crypto') 
  var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex') 
  return sign.toUpperCase() 
 },
 
 // 下单接口
 order: function(attach, body, mch_id, openid, total_fee, notify_url) {
  var bookingNo = 'huacai' + this.createNonceStr() + this.createTimeStamp();
  var deferred = Q.defer() 
  var appid = wechat.appId;
  var nonce_str = this.createNonceStr() 
  var timeStamp = this.createTimeStamp() 
  var url = "https://api.mch.weixin.qq.com/pay/unifiedorder"
  var formData = "<xml>"
  formData += "<appid>" + appid + "</appid>" //appid 
  formData += "<attach>" + attach + "</attach>" //附加数据 
  formData += "<body>" + body + "</body>"
  formData += "<mch_id>" + mch_id + "</mch_id>" //商户号 
  formData += "<nonce_str>" + nonce_str + "</nonce_str>" //随机字符串，不长于32位。 
  formData += "<notify_url>" + notify_url + "</notify_url>"
  formData += "<openid>" + openid + "</openid>"
  formData += "<out_trade_no>" + bookingNo + "</out_trade_no>"
  formData += "<spbill_create_ip>139.199.165.202</spbill_create_ip>"
  formData += "<total_fee>" + total_fee + "</total_fee>"
  formData += "<trade_type>JSAPI</trade_type>"
  formData += "<sign>" + this.paysignjsapi(appid, attach, body, mch_id, nonce_str, notify_url, openid, bookingNo, '139.199.165.202', total_fee, 'JSAPI') + "</sign>"
  formData += "</xml>"
  var self = this;
  request({ 
   url: url, 
   method: 'POST', 
   body: formData 
  }, function(err, response, body) { 
    console.log(body);
   if (!err && response.statusCode == 200) { 
    var prepay_id = self.getXMLNodeValue('prepay_id', body.toString("utf-8")) 
    var tmp = prepay_id.split('[') 
    var tmp1 = tmp[2].split(']') 
    //签名 
    var _paySignjs = self.paysignjs(appid, nonce_str, 'prepay_id=' + tmp1[0], 'MD5', timeStamp) 
    var args = { 
     appId: appid, 
     timeStamp: timeStamp, 
     nonceStr: nonce_str, 
     signType: "MD5", 
     package: 'prepay_id='+tmp1[0], 
     paySign: _paySignjs,
     out_trade_no: bookingNo
    }
    deferred.resolve(args) 
   } else { 
    console.log(body) 
   } 
  }) 
  return deferred.promise 
 },
 signPay: function(ret){
  var string = this.raw(ret) 
  string = string + '&key=' + key 
  var crypto = require('crypto') 
  var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex') 
  return sign.toUpperCase() 
 },
 wxtransfer: function(openid,amount,desc) {
   console.log('openid,amount,desc',openid,amount,desc);
   var deferred = Q.defer() 
   var mch_appid = wechat.appId;
   var mchid = wechat.mch_id;
   var nonce_str = this.createNonceStr();
   console.log('mch_appid,mchid,nonce_str',mch_appid,mchid,nonce_str);
   var partner_trade_no = 'huacai' + this.createNonceStr() + this.createTimeStamp();
   var check_name = 'NO_CHECK';
   var spbill_create_ip = wechat.IP;
   console.log('partner_trade_no,check_name,spbill_create_ip',partner_trade_no,check_name,spbill_create_ip);
   var ret = {
    mch_appid: mch_appid,
    mchid: mchid,
    nonce_str: nonce_str,
    partner_trade_no: partner_trade_no,
    check_name: check_name,
    spbill_create_ip: spbill_create_ip,
    openid: openid,
    amount: amount,
    desc: desc
   }
   var sign = this.signPay(ret);
   console.log('sign',sign);
    var transfers = {xml:{
        ...ret,
        sign: sign
      }
    }
    console.log('transfers',transfers);
    var jsonxml = builder.buildObject(transfers);
    console.log('返回的数据格式',jsonxml);
    // var url = 'https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers';
    // var options = {
    //   hostname:'api.mch.weixin.qq.com',
    //   port:3000,
    //   path:'/mmpaymkttransfers/promotion/transfers',
    //   method:'GET',
    //   pfx:fs.readFileSync('/Users/shiyong/Desktop/huacai/huacai-node-express/wechat/apiclient_cert.p12'),
    //   passphrase:wechat.mch_id,
    //   agent:false,
    //   body: jsonxml
    // };
    // console.log("options", options);
    // options.agent = new https.Agent(options);
    // console.log('请求数据数据中',options);
    // var req = https.request(options, function(err, response, body) { 
    //    console.log('转账请求错误信息',err);
    //    console.log('转账请求回应消息',response);
    //    console.log('转账请求消息体',body);
    //   xmlParser.parseString(body, function (err, result) {
    //   if(err){
    //     resParse.errorInfer(err,res);
    //     return;
    //   }
    //     deferred.resolve(result) 
    // });
    // req.end();
    // req.on('error',function(e){
	  //   console.log(e);
    // })
    var options = {
        url:'https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers',
        method:'POST',
        pfx:fs.readFileSync('/Users/shiyong/Desktop/huacai/huacai-node-express/wechat/apiclient_cert.p12'),
        passphrase:wechat.mch_id,
        agent:false,
        body: jsonxml
      };
    request(options, function(err, response, body) {
      xmlParser.parseString(body, function (err, result) {
        console.log('转账回调数据',result);
        deferred.resolve(result) 
      })
    })
    return deferred.promise 
//  })
}}
