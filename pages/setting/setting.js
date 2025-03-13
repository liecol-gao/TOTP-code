Page({
  /**
   * 页面分享 - 分享到微信好友
   */
  onShareAppMessage() {
    return {
      title: '身份验证器',  // 自定义分享标题
      path: '/pages/index/index',  // 分享路径
      imageUrl: '../../static/share-image.png' // 自定义分享图片（可选）
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '这是一款安全的小程序', // 自定义分享标题
      query: 'from=timeline' // 可选参数，用于区分不同来源
    };
  },

  /**
   * 跳转到首页
   */
  goToIndex() {
    wx.redirectTo({
      url: '/pages/index/index'  
    });
  },

  /**
   * 跳转到设置页面
   */
  goToSetting() {
    wx.redirectTo({
      url: '/pages/setting/setting'
    });
  },

  /**
   * 跳转到下载页面
   */
  goToDownload() {
    wx.redirectTo({
      url: '/pages/download/download'
    });
  }
});
