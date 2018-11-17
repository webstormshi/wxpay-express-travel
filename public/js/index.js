var cid = '';
(function(){
        cid = getParam('cid')||0;
        renderFinshed(cid);
}());

// 到达落地页显示上报
function renderFinshed(cid){
    // console.log(cid);
    $.ajax({
        url: 'http://reward.qinglong365.com/travel',
        method: 'GET',
        data: {
            cid: cid
        },
        success: res => {
            console.log('页面加载完成');
        }
    });
}

//截取url数据方法
function getParam(name){
    var search = document.location.search;
    var pattern = new RegExp("[?&]" + name + "\=([^&]+)", "g");
    var matcher = pattern.exec(search);
    var items = null;
    if (null != matcher) {
        try {
            items = decodeURIComponent(decodeURIComponent(matcher[1]));
        } catch (e) {
            try {
                items = decodeURIComponent(matcher[1]);
            } catch (e) {
                items = matcher[1];
            }
        }
    }
    return items;
};

// 提交报名表单
function submit(){
    var name = $("input[name='name']").val();
    var phone = $("input[name='phone']").val();
    var province = $("#param_province option:selected").val();
    var city = $("#param_city option:selected").val();
    var address = $("input[name='address']").val();
    
    var r=/^((0\d{2,3}-\d{7,8})|(1[3584]\d{9}))$/;

    if(!(name&&address&&city&&province&&city)){
        alert('填写信息不完整');
        return;
    }
    if(province == '请选择省份'){
        alert('填写信息不完整');
        return;
    }
    if(city == '请选择城市'){
        alert('填写信息不完整');
        return;
    }

    if(!r.test(phone)){
        alert('手机号格式错误');
        return;
    };

    $.ajax({
        url: 'http://reward.qinglong365.com/travel/user/create',
        method: 'POST',
        data: {
            cid: cid,
            name: name,
            phone: phone,
            province: province,
            city: city,
            address: address
        },
        success: res => {
            if(res.status===1){
                alert('报名成功');
                $("input[name='name']").val('');
                $("input[name='phone']").val('');
                $("input[name='address']").val('');
            }else{
                alert('报名失败',res.msg);
            }
        }
    });
}