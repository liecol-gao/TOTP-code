import drawQrcode from '../../utils/weapp.qrcode.js';

Page({
  data: {
    // 如果需要生成二维码的内容可以存储到 data 中
    secretData: ''
  },

  onLoad: function () {
    // 获取 tokens 数据并合并秘钥
    const tokens = wx.getStorageSync('tokens') || [];
    if (tokens.length === 0) {
      wx.showToast({
        title: '没有可导出的秘钥',
        icon: 'none',
      });
      return;
    }
    // 遍历所有 tokens，转换为 Google Authenticator 兼容的 otpauth:// URL
    const otpAuthURLs = tokens.map(token => {
      const issuer = encodeURIComponent(token.issuer || "MyApp"); // 服务商
      const account = encodeURIComponent(token.account); // 账号
      const secret = token.secret; // 直接使用存储的秘钥
      return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
    });

    // 由于 Google Authenticator 只支持逐个导入，我们用 JSON 方式存储多个 URL
    const secretData = JSON.stringify(otpAuthURLs);
    // const secretData = tokens.map(item => item.secret).join(',');
    this.setData({ secretData });
  },

  onReady: function () {
    // 在 onReady 中生成二维码
    if(this.data.secretData == ""){
      return
    }
    drawQrcode({
      width: 200,
      height: 200,
      canvasId: 'myQRCode',
      // ctx: wx.createCanvasContext('myQrcode'),
      text: this.data.secretData,
      // v1.0.0+版本支持在二维码上绘制图片
      image: {
        imageResource: '../../static/logo/cereson.png',
        dx: 80,
        dy: 80,
        dWidth: 40,
        dHeight: 40
      }
    })
    // 生成 JSON 文件
    this.saveJsonToFile(this.data.secretData);
  },

  /**
   * 下载二维码
   */
  downloadQRCode() {
    wx.canvasToTempFilePath({
      canvasId: 'myQRCode',
      success: (res) => {
        const tempFilePath = res.tempFilePath;
        wx.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: () => {
            wx.showToast({ title: '二维码已保存', icon: 'success' });
          },
          fail: (err) => {
            console.error('保存失败', err);
            wx.showModal({
              title: '保存失败',
              content: '请检查相册权限',
              showCancel: false
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '二维码生成失败',
          icon: 'none',
        });
      }
    });
  },

    // 下载 JSON 文件
    saveJsonToFile(jsonData) {
      const fs = wx.getFileSystemManager();
      const filePath = `${wx.env.USER_DATA_PATH}/2fa_backup.txt`;
      fs.writeFile({
        filePath,
        data: jsonData,
        encoding: 'utf8',
        success: () => {
          this.setData({ textFilePath: filePath });
          // wx.showToast({
          //   title: '文件已保存',
          //   icon: 'success',
          // });
        },
        fail: (err) => {
          console.error('文件保存失败', err);
          // wx.showToast({
          //   title: '保存失败',
          //   icon: 'none',
          // });
        }
      });
    },

    downloadFile() {
      console.log.apply("enter")
      wx.openDocument({
        filePath: this.data.textFilePath,
        showMenu: true, // 允许用户选择其他应用打开
        success: () => {
          wx.showToast({ title: '打开成功', icon: 'success' });
        },
        fail: (err) => {
          console.error('打开失败', err);
          wx.showToast({ title: '打开失败', icon: 'none' });
        }
      });
    },    

    // 复制 JSON 到剪贴板
    copyJsonData() {
      console.log("enter")
      wx.setClipboardData({
        data: this.data.secretData,
        success() {
          wx.showToast({ title: '备份文本已复制到剪贴板' });
        }
      });
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
});
