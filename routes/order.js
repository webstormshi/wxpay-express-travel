var express = require('express');
var router = express.Router();
var https = require('https')
var iconv = require('iconv-lite')
// 导入MySQL模块
var mysql = require('mysql');
var dbConfig = require('../db/DBConfig');
var userSQL = require('../db/usersql')
var orderSQL = require('../db/ordersql');
var wechat = require('../wechat/config').wechat
var WXBizDataCrypt = require('../wechat/WXBizDataCrypt')
var wxpay = require('../utils/wxpay')

// 使用DBConfig.js的配置信息创建一个MySQL连接池
var pool = mysql.createPool( dbConfig.mysql );
var resParse = require('../utils/resParse')

// 获取所有会员的订单列表
router.get('/userlist', function(req, res, next){
    pool.getConnection(function(err, connection){
        if(err){
            resParse.reerrorInfer(err);
            return;
        }
        connection.query(orderSQL.getAllOrder,[], function(result) {
            var result = resParse.responseParse(err,result);
            resParse.responseJSON(res,result);
            connection.release();
        })
        
    })
})

// 查看我的订单
router.get('/list', function(req, res, next){
    var params = req.query || req.params;
    if(!(params.uid)){
        resParse.invalidateError(res);
        return;
    }
    pool.getConnection(function(err, connection){
        if(err){
            resParse.reerrorInfer(err);
            return;
        }
        var params = req.query || req.params;
        var status = params.status;
        // 获取不同状态的订单
        if (status) {
            connection.query(orderSQL.getOrderListByStatus, [params.uid ,params.status], function(err, result){
                var result = resParse.responseParse(err,result);
                resParse.responseJSON(res,result);
                connection.release();
            })   
        }else{
            connection.query(orderSQL.getOrderList, [params.uid], function(err, result){
                var result = resParse.responseParse(err,result);
                resParse.responseJSON(res,result);
                connection.release();
            }) 
        }
    })
});

// 查看订单详情
router.get('/detail',function(req, res, next) {
    pool.getConnection(function(err, connection) {
        if(err){
            console.log('数据库连接异常',err.sqlMessage);
            resParse.reerrorInfer(err);
            return;
        }
        console.log('数据录连接正常');
        var parmas = req.query || req.params;
        connection.query(orderSQL.getOrderByOrderno,[parmas.orderno], function(err,result){
            var result = resParse.responseParse(err,result);
            resParse.responseJSON(res, result);
            connection.release();
        })
    });
});

// 创建订单信息
router.post('/createOrder', function(req, res, next){
    
});

// 更新订单信息
router.post('/updateOrder', function(req, res, next){

});

// 取消订单信息
router.post('/delete', function(req, res, next){

})

// 分销金额
router.post('/transfer', function(req, res, next) {
    var openid = 'oQIf948swDggT4g_DWykXMo0cyDo';
    var amount = 25;
    var desc = '一元会员分销';
    wxpay.wxtransfer(openid,amount,desc).then(function(data){
        console.log(data);
        resParse.responseJSON(res,data);
    });
})


  module.exports = router;