var orderSQL = {
    insert: 'INSERT INTO `Order`(orderno, uid, mobile, status, type, price, num, total_fee, revicer, product_name, orgin_price, order_time) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
    update: 'UPDATE `Order` SET pay_time = ? , status = ? , code = ? WHERE orderno = ?',
    getOrderByOrderno: 'SELECT * FROM `Order` WHERE orderno = ?',
    getOrderByUid: 'SELECT * FROM `Order` WHERE uid = ?',
    delete: 'DELETE FROM `Order` WHERE orderno = ? and uid = ?',
    getOrderList: 'SELECT * FROM `Order` WHERE  uid = ? and type = 1',
    getOrderListByStatus: 'SELECT * FROM `Order` WHERE  uid = ? and type = 1 and status = ?',
    getAllOrder: 'SELECT * FROM `Order` WHERE type = 0'
}

module.exports = orderSQL;