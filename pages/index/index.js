import drawQrcode from '../../utils/weapp.qrcode.js';
const TOTP = require('../../utils/totp')
let util = require('../../utils/util')

Page({

    /**
     * 页面的初始数据
     */
    data: {
        current_index: 0,
        tokens: [],
        showAddCode: false, // 控制 add-code 是否显示
        showInputPopup: false, // 控制弹框显示
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const second = util.getSeconds() % 30;
        let tokens = wx.getStorageSync('tokens');
        if (!tokens) {
            tokens = [];
        }
        console.log(tokens)
        this.setData({
            current_index: Math.floor(second / 5),
            tokens: tokens,
            second: second,
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        const timer = setInterval(() => {
            let i = util.getSeconds() % 30;
            this.setData({
                second: 30-i
            });
            if (i % 5 === 0) {
                if (i === 0) {
                    this.updateCode();
                    this.setData({
                        second: 30
                    });
                }
                this.setData({
                    current_index: Math.floor(i / 5)
                });
            }
        }, 1000)
        this.updateCode();
    },
    /**
     * 更新验证码
     */
    updateCode: function () {
        const tokens = this.data.tokens
        if (tokens.length === 0) {
          this.setData({
              tokens
          });
            return;
        }
        for (let i = 0; i < tokens.length; i++) {
            tokens[i].code = TOTP.now(tokens[i].secret);
        }
        this.setData({
            tokens
        })
    },
    /**
     * 添加按钮回调函数
     */
    ClickAddScan: function () {
        const self = this
        wx.scanCode({
            scanType: ['qrCode'],
            success: res => {
              // 假设 res.result 包含多个 token 信息
            const tokenList = self.parseTokensFromQRCode(res.result); // 解析多个 token 数据
            tokenList.forEach(token => {
              console.log(token.secret, token.issuer, token.account)
                self.addToken(token.secret, token.issuer, token.account);  // 循环添加每个 token
            });
                // self.addScanToken(res.result)
                this.setData({
                  showAddCode: false
                });
            },
            fail: error => {
                console.log("失败了", error)
            }

        })

    },

    parseTokensFromQRCode: function(qrData) {
        const tokenList = [];
    
        // 先按 "otpauth://totp/" 分割整个字符串，获取每个单独的 URI 部分
        const tokensData = qrData.split("otpauth://totp/").filter(item => item !== "");
        
        tokensData.forEach((data) => {
            // 为每个部分加上前缀 "otpauth://totp/"
            const fullData = "otpauth://totp/" + data;
    
            // 使用正则表达式提取 secret 和 issuer
            const tokenPattern = /otpauth:\/\/totp\/([^?]+)\?secret=([^&]+)&issuer=([^&]+)/;
    
            const match = tokenPattern.exec(fullData);
    
            if (match) {
                // 解码路径中的 URL 编码字符（如 %2F → /）
                const decodedPath = decodeURIComponent(match[1]);
    
                // 分割路径部分（如 "Issuer:Account" 格式）
                const pathParts = decodedPath.split(':');
                
                // 提取账户名和发布者（issuer）
                const account = pathParts.length > 1 ? pathParts.slice(1).join(':') : pathParts[0];
                const issuer = match[3];
    
                // 构建 token 数据对象
                const tokenData = {
                    account: account,   // 账户名（从路径提取）
                    secret: match[2],   // 密钥
                    issuer: issuer      // 发布者（从 URI 查询参数提取）
                };
    
                // 将 token 添加到列表
                tokenList.push(tokenData);
            }
        });
    
        // 打印调试信息
        console.log("Parsed tokens:", tokenList);
    
        return tokenList;
    },



    AddCode: function () {
      // 点击 + 按钮时切换 add-code 显示状态
      this.setData({
        showAddCode: !this.data.showAddCode,
      });
    },

    closeAddCode: function () {
      // 点击 + 按钮时切换 add-code 显示状态
      this.setData({
        showAddCode: false,
      });
    },

    // 防止点击 add-code 内部时触发关闭动作
    preventHide: function(e) {
      e.stopPropagation(); // 阻止事件冒泡
    },

    // 点击“手动添加”按钮，显示弹框
    ClickAddInput() {
      this.setData({
        showInputPopup: true
      });
    },

    // 关闭弹框
    CloseInputPopup() {
      this.setData({
        showInputPopup: false
      });
    },

    // 监听输入框内容
    InputAccount(e) {
      console.log("输入账号名:", e.detail.value); // 调试输出
      this.setData({ input_account: e.detail.value });
    },
    InputProvider(e) {
        console.log("输入备注:", e.detail.value); // 调试输出
        this.setData({ input_provider: e.detail.value });
    },
    InputSecret(e) {
        console.log("输入秘钥:", e.detail.value); // 调试输出
        this.setData({ input_secret: e.detail.value });
    },

    // 保存输入内容
    SaveInput() {
      console.log('账号名:', this.data.input_account);
      console.log('备注:', this.data.input_provider);
      console.log('秘钥:', this.data.input_secret);
      let input_secret = this.data.input_secret
      let input_issuer = this.data.input_provider
      let input_account = this.data.input_account

      if (!input_secret || !input_account) {
        wx.showModal({
            title: '错误',
            content: '秘钥和账号名不能为空',
            showCancel: false,
        });
        return;
    }
      // 关闭弹框
      this.setData({ 
        showInputPopup: false,
        showAddCode: false
      });

      // todo 这里可以调用 API 保存数据
      this.addToken(input_secret, input_issuer, input_account)
      
    },

    /**
     * 长按对 token 进行操作
     * @param event 长按事件
     */
    tokenOperation: function (event) {
        const self = this;
        const index = event.currentTarget.dataset.index
        wx.showActionSheet({
            itemList: ['删除', '编辑', '展示二维码'],
            success: (res) => {
                if (res.tapIndex === 0) {
                    self.deleteToke(index)
                }
                if (res.tapIndex === 1) {
                    wx.redirectTo({
                        url: '/pages/edit/edit?index=' + index
                    })
                }
                if (res.tapIndex === 2) {
                  let show_token = this.data.tokens;
                  this.get_token_qrcode(show_token[index])
                }
            }
        })
    },

    // 关闭二维码
    closeQRCode() {
      this.setData({
        TokenQrcode: '', // 清空二维码数据，从而隐藏二维码
        TokenSecretData: ""
      });
    },

    get_token_qrcode: function (show_token) {
        // 在 onReady 中生成二维码
        if(show_token == ""){
          return
        }
        const issuer = encodeURIComponent(show_token.issuer || "MyApp"); // 服务商
        const account = encodeURIComponent(show_token.account); // 账号
        const secret = show_token.secret; // 直接使用存储的秘钥
        let show_token_str = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
        console.log(show_token_str)
        this.setData({
          TokenQrcode: show_token_str, // 清空二维码数据，从而隐藏二维码
          TokenSecretData: secret
        });
        drawQrcode({
          width: 200,
          height: 200,
          canvasId: 'myQRCode',
          // ctx: wx.createCanvasContext('myQrcode'),
          text: show_token_str,
          // v1.0.0+版本支持在二维码上绘制图片
          image: {
            imageResource: '../../static/logo/cereson.png',
            dx: 80,
            dy: 80,
            dWidth: 40,
            dHeight: 40
          }
        })
    },

    /**
     * 删除 token
     * @param index 索引
     */
    deleteToke: function (index) {
        let tokens = this.data.tokens;
        const self = this
        wx.showModal({
            title: '温馨提示',
            content: '确定要删除吗？',
            success: (res) => {
                if (res.confirm) {
                    tokens.splice(index, 1)
                    const result = self.updateTokenStorage(tokens);
                    if (result) {
                        wx.showToast({
                            title: '删除成功',
                        })
                    } else {
                        wx.showToast({
                            title: '删除失败',
                            icon: 'none'
                        })
                    }
                }
            }
        })
    },
    /**
     * 长按验证码区域复制验证码
     * @param event 验证码区域长按事件
     */
    copyCode: function (event) {
        const index = event.currentTarget.dataset.index
        const code = this.data.tokens[index].code;
        wx.setClipboardData({
            data: code,
            success: () => {
                wx.showToast({
                    title: '验证码已复制',
                    icon: 'success'
                })
            }
        })
    },

     /**
     * 识别 url 获取相关参数写入 token
     * @param result_url
     */
    addScanToken: function (result_url) {
      const secret = util.getQueryByName(result_url, "secret");
      let issuer = util.getQueryByName(result_url, "issuer");
      const account = util.getAccount(result_url)
      this.addToken(secret, issuer, account)
    },


    addToken: function (secret, issuer, account) {
        issuer = issuer === null ? "" : issuer
        if (!secret || !account) {
            wx.showModal({
                title: '错误',
                content: '不是合法的 TOTP 码',
                showCancel: false,
            });
            return;
        } else if (null == TOTP.now(secret)) {
            wx.showModal({
                title: '错误',
                content: 'secret 不合法',
                showCancel: false,
            });
            return;
        }
        let token = {
            secret: secret,
            issuer: issuer,
            account: account,
            logo_url: '../../static/logo/cereson.png'
        }
        let tokens = wx.getStorageSync('tokens');
        let index = this.checkTokenIsExist(issuer, account, tokens);
        if (index !== -1) {
            tokens[index] = token;
        } else {
            if (!tokens) {
                tokens = []
            }
            tokens.push(token);
        }
        console.log(tokens)
        let result = this.updateTokenStorage(tokens);
        if (!result) {
            wx.showModal({
                title: '错误',
                content: '更新数据发生异常',
                showCancel: false,
            })
        }
        this.updateCode()
        wx.showToast({
            title: '密钥已保存',
            icon: 'success',
            duration: 2000
        });
    },
    /**
     * 检查在同一发布人下是否已经存在账户
     * @param issuer 发布人
     * @param account 账户
     * @param tokens token数组
     * @returns {number} 不存在返回 -1 存在返回索引
     */
    checkTokenIsExist: function (issuer, account, tokens) {
        if (!tokens) {
            return -1;
        }
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].issuer === issuer && tokens[i].account === account) {
                return i;
            }
        }
        return -1;
    },
    /**
     * 更新本地缓存和 data 里面的 tokens 值
     * @param tokens
     * @returns {boolean} 成功返回 true 失败返回 false
     */
    updateTokenStorage: function (tokens) {
        if (!tokens) {
            return false;
        }
        try {
            wx.setStorageSync("tokens", tokens);
        } catch (error) {
            return false;
        }
        this.setData({
            tokens
        })
        return true;
    },

      /**
     * 跳转到页面1
     */
    goToIndex() {
      wx.redirectTo({
        url: '/pages/index/index'  // 替换为实际页面路径
      });
    },

    /**
     * 跳转到页面2
     */
    goToSetting() {
      wx.redirectTo({
        url: '/pages/setting/setting'  // 替换为实际页面路径
      });
    },

    /**
     * 跳转到页面3
     */
    goToDownload() {
      wx.redirectTo({
        url: '/pages/download/download'  // 替换为实际页面路径
      });
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
      return {
        title: '2FA（TOTP）身份验证器',  // 自定义分享标题
        path: '/pages/index/index',  // 分享路径
        // imageUrl: '../../static/share-image.png' // 自定义分享图片（可选）
      };
    },
})
