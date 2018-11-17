var express = require('express');
var router = express.Router();
var fs = require('fs')
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray : false, ignoreAttrs : true})
var resParse = require('../utils/resParse')
var orderSQL = require('../db/ordersql')
var userSQL = require('../db/usersql')
var builder = new xml2js.Builder();
var dbConfig = require('../db/DBConfig');
var mysql = require('mysql')
var wxcode = require('../utils/wxcode');
// 使用DBConfig.js的配置信息创建一个MySQL连接池
var pool = mysql.createPool( dbConfig.mysql )
var wxpay = require('../utils/wxpay')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*
 * 微信支付回调
 */
router.all('/notify', function(req, res, next) {
  var body = req.body;
  var str = JSON.stringify(body);
  var xmlStr = '<xml>' + str.split('<xml>')[1].split('</xml>')[0] + '</xml>';
    xmlParser.parseString(xmlStr, function (err, result) {
      if(err){
        resParse.errorInfer(err,res);
        return;
      }
     console.log(JSON.stringify(result));
     var return_code = result.xml.return_code == 'SUCCESS';
     var result_code = result.xml.result_code == 'SUCCESS';
      if(return_code&&result_code) {
        console.log('用户信息处理中');
        pool.getConnection(function(err,connection) {
          console.log('connection',connection?connection:err.sqlMessage);
          if(err){
            resParse.errorInfer(err,res);
            return;
          }
          var orderno = result.xml.out_trade_no;
          var openid = result.xml.openid;
          console.log('orderno,openid',orderno,openid);
          var pay_time = new Date();
          var status = 1;
          var isRegister = 1;
          // 修改订单状态
          var sql = orderSQL.update + ';' + userSQL.register; 
          var params = [ pay_time, status, orderno, isRegister, pay_time, openid ];
          connection.query(sql, params, function(err, result){
            if(err){
              resParse.errorInfer(err,res);
              return;
            }
            console.log('会员付费成功回调函数',result);

            var openid = 'oQIf948swDggT4g_DWykXMo0cyDo';
            var amount = 25;
            var desc = '一元会员分销零钱';
            wxpay.wxtransfer(openid,amount,desc).then(function(data){
                console.log(data);
            });
            var result = {
              return_code: 'SUCCESS',
              return_msg: 'OK'
            }
            var jsonxml = builder.buildObject(result);
            console.log('返回的数据格式',jsonxml);
            res.setHeader('content-type','text/xml');
            res.send(jsonxml);
            connection.release();
          })
        });
      }else{
        console.log('订单信息获取失败');
        var result = {
          return_code: 'FAILED',
          return_msg: 'OK'
        }
        var jsonxml = builder.buildObject(result);
        res.setHeader('content-type','text/xml');
        res.send(jsonxml);
      }
  });
})


// 微信支付买票通知
router.all('/ticket/notify', function(req, res, next) {
  console.log(req.body);
  var body = req.body;
  var str = JSON.stringify(body);
  var xmlStr = '<xml>' + str.split('<xml>')[1].split('</xml>')[0] + '</xml>';
    xmlParser.parseString(xmlStr, function (err, result) {
      if(err){
        resParse.errorInfer(err,res);
        return;
      }
     console.log(JSON.stringify(result));
     var return_code = result.xml.return_code == 'SUCCESS';
     var result_code = result.xml.result_code == 'SUCCESS';
      if(return_code&&result_code) {
        console.log('用户信息处理中');
        pool.getConnection(function(err,connection) {
          console.log('connection',connection?connection:err.sqlMessage);
          if(err){
            resParse.errorInfer(err,res);
            return;
          }
          var orderno = result.xml.out_trade_no;
          var pay_time = new Date();
          var status = 1;
          var code = wxcode.create_code();
          // 修改订单状态
          var params = [ pay_time, status, code, orderno ];
          connection.query(orderSQL.update, params, function(err, result){
            if(err){
              resParse.errorInfer(err,res);
              return;
            }

            var result = {
              return_code: 'SUCCESS',
              return_msg: 'OK'
            }
            var jsonxml = builder.buildObject(result);
            console.log('返回的数据格式',jsonxml);
            res.setHeader('content-type','text/xml');
            res.send(jsonxml);
            connection.release();
          })
        });
      }else{
        console.log('订单信息获取失败');
        var result = {
          return_code: 'FAILED',
          return_msg: 'OK'
        }
        var jsonxml = builder.buildObject(result);
        res.setHeader('content-type','text/xml');
        res.send(jsonxml);
      }
  });
})

// 微信转账
router.get('/transfer', function(req, res, next) {
  var openid = 'oQIf948swDggT4g_DWykXMo0cyDo';
  var amount = 25;
  var desc = '一元会员分销零钱';
  wxpay.wxtransfer(openid,amount,desc).then(function(data){
      console.log(data);
      res.json({data: data});
  });
})

module.exports = router;