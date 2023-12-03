import { defineUnimportPreset } from '../utils'

// @dcloudio/uni-app/dist/uni-app.d.ts
export default defineUnimportPreset({
  from: '@dcloudio/uni-app',
  imports: [
    'onAddToFavorites',
    'onBackPress',
    'onError',
    'onHide',
    'onLaunch',
    'onLoad',
    'onNavigationBarButtonTap',
    'onNavigationBarSearchInputChanged',
    'onNavigationBarSearchInputClicked',
    'onNavigationBarSearchInputConfirmed',
    'onNavigationBarSearchInputFocusChanged',
    'onPageNotFound',
    'onPageScroll',
    'onPullDownRefresh',
    'onReachBottom',
    'onReady',
    'onResize',
    'onShareAppMessage',
    'onShareTimeline',
    'onShow',
    'onTabItemTap',
    'onThemeChange',
    'onUnhandledRejection',
    'onUnload',
  ],
})
