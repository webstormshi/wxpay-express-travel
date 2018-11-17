var express = require('express');
var router = express.Router();
var https = require('https')
var iconv = require('iconv-lite')
// 导入MySQL模块
var mysql = require('mysql');
var dbConfig = require('../db/DBConfig')
var userSQL = require('../db/usersql')
var orderSQL = require('../db/ordersql')
var wechat = require('../wechat/config').wechat
var WXBizDataCrypt = require('../wechat/WXBizDataCrypt')
var wxpay = require('../utils/wxpay')
var resParse = require('../utils/resParse')


// 使用DBConfig.js的配置信息创建一个MySQL连接池
var pool = mysql.createPool( dbConfig.mysql )
//获取用户信息——已完成
router.get('/getuserInfo', function(req, res, next){
	pool.getConnection(function(err, connection) {
    if(err){
      resParse.errorInfer(err,res);
      return;
    }
    var param = req.query || req.params;
    if(!(param.code||param.encryptedData||param.iv)){
      resParse.invalidateError(res);
      return;
    }
		var url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wechat.appId}&secret=${wechat.appserect}&js_code=${param.code}&grant_type=authorization_code`    
    https.get(url, function (reslt) {
      var datas = [];
      var size = 0;
      reslt.on('data', function (data) {
          datas.push(data);
          size += data.length;
      });
      reslt.on("end", function () {
          var buff = Buffer.concat(datas, size);
          var result = JSON.parse(iconv.decode(buff, "utf8"));
          if(result.session_key) {    
            var pc = new WXBizDataCrypt(wechat.appId, result.session_key);
            var data = pc.decryptData(param.encryptedData , param.iv); 
            if(!data){
              console.log('解密用户信息失败');
              var result = resParse.httpError({errmsg: '解密用户信息失败'});
              resParse.responseJSON(res, result);  
              return;
            }
            connection.query(userSQL.getUserByOpenId, [data.openId], function(err,res1){
              if(err){
                resParse.errorInfer(err,res);
                return;
              }
              if(res1.length==0){
                var sql = userSQL.insert + ';' + userSQL.getUserByOpenId;
                var params = [data.gender,data.nickName,data.province,data.openId,data.avatarUrl,data.openId];
                connection.query(sql, params, function(err, data){
                  var result = resParse.responseParse(err, data[1][0]);   
                  console.log('用户首次注册账号'); 
                  resParse.responseJSON(res, result);  
                }); 
              }else{
                console.log('用户已经注册账号',res1);
                var result = resParse.responseParse(err, res1[0]); 
                resParse.responseJSON(res, result); 
              }
            })   
           }else{
             var result = resParse.httpError({errmsg: '请求session_key失败'});
             resParse.responseJSON(res, result);   
           }     
    // 释放连接  
      connection.release(); 
      });
  }).on("error", function (err) {
      Logger.error(err.stack)
      callback.apply(null);
  });
	})
});

  // 用户注册一元会员——微信支付——待完成
 router.post('/register', function(req, res, next) {
  if(!(req.body.openId||req.body.uid||req.body.nickName)){
    resParse.invalidateError(res);
    return;
  }
  var openid = req.body.openId;
  var uid = req.body.uid;
  var body = "一元会员";
  var revicer = '江西华财营销顾问有限公司';
  var total_fee = 1;
  var mobile = req.body.mobile || null;
  var notify_url = wechat.baseUrl + "/notify";
  var mch_id = wechat.mch_id;
  var origin_price = 1;
  var type = 0;  // 0 表示会员注册  1 表示购买门票订单
  var attach = "华财旅游一元会员注册";
  var price = 1;
  var num = 1;
  var status = 0;  // 0 表示未待支付 1表示已支付 2表示取消支付
  var curTime = new Date();
  wxpay.order(attach, body, mch_id, openid, total_fee, notify_url).then(function(data){ 
    pool.getConnection(function(err,connection){
      if(err){
        resParse.errorInfer(err,res);
        return;
      }
      var params = [data.out_trade_no,uid,mobile,status,type,price,num,total_fee,revicer,attach,origin_price,curTime];
      connection.query(orderSQL.insert,params, function(err, result){
        var result = resParse.responseParse(err, result);
        console.log('创建订单',result);
        resParse.responseJSON(res, result.code==-1?result:data);
        connection.release();
      })
    })
   }) 
 });

//  购买门票
router.post('/buyTicket', function(req, res, next) {
  if(!(req.body.openId||req.body.uid||req.body.nickName)){
    resParse.invalidateError(res);
    return;
  }
  var openid = req.body.openId;
  var uid = req.body.uid;
  var body = "铜陵峡门票";
  var num = req.body.num;
  var revicer = '江西华财营销顾问有限公司';
  var price = 1;
  var origin_price = 1;
  var total_fee = price * num;
  var mobile = req.body.mobile;
  var type = 1; //  0 表示用户注册会员  1  表示用户购买门票
  var notify_url = wechat.baseUrl + "/ticket/notify";
  var mch_id = wechat.mch_id;
  var attach = "华财旅游景区门票服务";
  var status = 0;  // 0 表示未待支付 1表示已支付  2表示取消支付
  var curTime = new Date();

  wxpay.order(attach, body, mch_id, openid, total_fee, notify_url).then(function(data){ 
    pool.getConnection(function(err,connection){
      if(err){
        resParse.errorInfer(err,res);
        return;
      }
      var params = [data.out_trade_no,uid,mobile,status,type,price,num,total_fee,revicer,body,origin_price,curTime];
      connection.query(orderSQL.insert,params, function(err, result){
        var result = resParse.responseParse(err, result);
        console.log('创建订单',result);
        resParse.responseJSON(res, result.code==-1?result:data);
        connection.release();
      })
    })
   }) 
});

// 获取用户手机号
router.get('/mobile', function(req, res, next){
	pool.getConnection(function(err, connection) {
    if(err){
      resParse.errorInfer(err,res);
      return;
    }
    var param = req.query || req.params;
    if(!(param.code||param.encryptedData||param.iv)){
      resParse.invalidateError(res);
      return;
    }
		var url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wechat.appId}&secret=${wechat.appserect}&js_code=${param.code}&grant_type=authorization_code`    
    https.get(url, function (reslt) {
      var datas = [];
      var size = 0;
      reslt.on('data', function (data) {
          datas.push(data);
          size += data.length;
      });
      reslt.on("end", function () {
          var buff = Buffer.concat(datas, size);
          var result = JSON.parse(iconv.decode(buff, "utf8"));
          console.log('手机号获取',result);
          if(result.session_key) {    
            var pc = new WXBizDataCrypt(wechat.appId, result.session_key);
            var data = pc.decryptData(param.encryptedData , param.iv); 
            console.log('解密后的数据',data);
            if(!data){
                console.log('获取用户手机号失败');
                var result = resParse.httpError({errmsg: '获取手机号失败'});
                resParse.responseJSON(res, data);  
                return;
              } 
              var result = resParse.responseParse(err, data);
              resParse.responseJSON(res, result);
           }else{
             var result = resParse.httpError({errmsg: '请求session_key失败'});
             resParse.responseJSON(res, result);   
           }     
    // 释放连接  
      connection.release(); 
      });
  }).on("error", function (err) {
      Logger.error(err.stack)
      callback.apply(null);
  });
	})
});

//  绑定用户手机号
router.post('/mobile', function(req, res, next) {
  if(!(req.body.uid||req.body.mobile)){
    resParse.invalidateError(res);
    return;
  }
  pool.getConnection(function(err, connection) {
    if(err){
      resParse.errorInfer(err,res);
      return;
    }
    console.log('数据库链接正常');
    var params = req.body;
    var sql = userSQL.setUserMobile + ';' + userSQL.getUserById;
    connection.query(sql,[ params.mobile, params.uid, params.uid], function(err, result){
      var result = resParse.responseParse(err, result);
      resParse.responseJSON(res, result);
      connection.release();
    });
  })
});

//  绑定用户介绍人——已完成
router.post('/intro', function(req, res, next){
    if(!req.body.shareOpenId){
      resParse.invalidateError(res);
      return;
    }
    console.log('用户分享信息已经进入');
    pool.getConnection(function(err, connection) {
      if(err){
        resParse.errorInfer(err,res);
        return;
      }
      console.log('数据库链接成功'); 
      var params = req.body;
      connection.query(userSQL.getUserByOpenId,[params.shareOpenId], function(err, result) {
          var second = result.length>0?result[0].first:null;
          var shareParams = [params.shareOpenId,second,params.uid,params.uid];
          var sql = userSQL.updateIntro +';'+ userSQL.getUserById;
          connection.query(sql,shareParams, function(err, data) {
            var result = resParse.responseParse(err, data[1]);      
            resParse.responseJSON(res, result);   
            connection.release();  
        });
      })
    })
});

// 按照uid查询用户
router.get('/query', function(req, res, next){
	pool.getConnection(function(err, connection) { 
    if(err){
      resParse.errorInfer(err,res);
      return;
    }
		console.log('数据库链接正常');
    var param = req.query || req.params;   
    connection.query(userSQL.getUserById, [param.uid], function(err, result) {
        var result = resParse.responseParse(err, result[0]);
        // 以json形式，把操作结果返回给前台页面     
        resParse.responseJSON(res, result);   
        // 释放连接  
        connection.release();  
       });
    })
});

// 查询所有用户信息
router.get('/list', function(req, res, next){
  pool.getConnection(function(err, connection) {
    if(err){
      console.log('连接数据库异常',err);
      resParse.errorInfer(err,res);
      return;
    }
    console.log('数据库链接正常');
    connection.query(userSQL.queryAll,[],function(err, result) {
      var result = resParse.responseParse(err, result);
      resParse.responseJSON(res,result);     
    });
    connection.release(); 
  })
})

// 删除用户信息
router.post('/deleteUser', function(req, res, next){
  if(!req.body.uid){
    resParse.invalidateError(res);
    return;
  }
  pool.getConnection(function(err, connection) {
    if(err){
      console.log('连接数据库异常',err.sqlMessage);
      resParse.errorInfer(err,res);
      return;
    }
    console.log('数据库链接正常');
    var params = req.body;
    connection.query(userSQL.deleteUser,[params.uid], function(err, result){
      var result = resParse.responseParse(err, result);   
      resParse.responseJSON(res, result);    
      connection.release(); 
    });
  });
});

// 获取我的分享列表
router.get('/share', function(req, res, next){
  if(!req.query.shareOpenId){
    resParse.invalidateError(res);
    return;
  }
  pool.getConnection(function(err, connection){
    if(err){
      console.log('连接数据库异常',err.sqlMessage);
      resParse.errorInfer(err,res);
      return;
    }
    console.log('数据库链接正常');
    var params = req.query || req.params;
    connection.query(userSQL.shareUser,[params.shareOpenId,params.shareOpenId],function(err, result) {
      var result = resParse.responseParse(err, result.length==2? {
        first: result[0],
        second: result[1]
      }: result);           
      resParse.responseJSON(res, result);    
      connection.release(); 
    })
  })
})


module.exports = router;