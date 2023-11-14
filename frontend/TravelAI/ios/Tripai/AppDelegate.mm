#import "AppDelegate.h"

#import <FBSDKCoreKit/FBSDKCoreKit-swift.h> // facebook sdk
#import <NaverThirdPartyLogin/NaverThirdPartyLoginConnection.h> // naver sdk
#import <RNKakaoLogins.h> // kakao sdk
#import <GoogleMaps/GoogleMaps.h> // google map

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // google map
  [GMSServices provideAPIKey:@"AIzaSyDYdHuOiPhFs1JH76PKMyTHRYAqaP1Ckzk"];

  // facebook sdk
  [[FBSDKApplicationDelegate sharedInstance] application:application
                       didFinishLaunchingWithOptions:launchOptions];

  self.moduleName = @"Tripai";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  //naver sdk
  if ([url.scheme isEqualToString:@"naverlogin"]) {
    return [[NaverThirdPartyLoginConnection getSharedInstance] application:app openURL:url options:options];
  }

  // facebook sdk 
  return [[FBSDKApplicationDelegate sharedInstance]application:app
                                                      openURL:url
                                                      options:options];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
                                    sourceApplication:(NSString *)sourceApplication
                                           annotation:(id)annotation {
  // kakao sdk
  if([RNKakaoLogins isKakaoTalkLoginUrl:url]) {
    return [RNKakaoLogins handleOpenUrl: url];
 }
  return NO;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
