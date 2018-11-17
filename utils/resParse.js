module.exports = {

    // 响应一个JSON数据
    responseJSON: function (res, ret) {
        if(typeof ret === 'undefined') {     //返回数据格式异常
             res.json({     code:'-200',     msg: '操作失败',  data: ret   
           }); 
       } else { 
         res.json(ret); 
     }},

     // 数据库连接异常提示
    errorInfer: function(err,res){
        var result = {
            code: -2,     // 数据库连接处理异常
            msg: 'failed',
            errmsg: err.sqlMessage
        }
        res.json(result);
    },
    // 返回数据格式规范
    responseParse: function(err, result){
        if(result){
            result = {
                code: 200,     //数据处理正常
                msg: 'success',
                data: result
            }
        }else{
            result = {
                code: -1,
                msg: 'failed',     //数据库处理异常
                errmsg: err.sqlMessage
            }
        }
        return result;
    },
    httpError: function(err){
        var result = {
            code: -3,      //  网络请求数据异常
            msg: 'failed',
            errmsg: err.errmsg || '请求数据异常'
        }
        return result;
    },
    invalidateError: function(res){
        var result = {
            code: 400,
            msg: 'failed',
            errmsg: '请求参数格式错误'
        }
        res.json(result);
    },
    emptyError: function(){
        
    }
}