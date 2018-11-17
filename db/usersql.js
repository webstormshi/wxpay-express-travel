var UserSQL = {  
                insert:'INSERT INTO User(gender, nickName, province, openId, avatarUrl) VALUES(?,?,?,?,?)', 
                queryAll:'SELECT * FROM User',  
                getUserById:'SELECT * FROM User WHERE uid = ? ',
                updateIntro: 'UPDATE User set first = ? , second = ? WHERE uid = ?',
                getUserByOpenId: 'SELECT * from User WHERE openId = ?',
                setUserMobile: 'UPDATE User set mobile = ? WHERE uid = ?',
                deleteUser: 'DELETE FROM User WHERE uid = ?',
                shareUser: 'SELECT uid,avatarUrl,nickName,registerTime,first,second FROM User WHERE first = ?;SELECT avatarUrl,nickName FROM User WHERE second = ?',
                register: 'UPDATE User SET isRegister = ?, registerTime = ? WHERE openId = ?'
              };
 module.exports = UserSQL;