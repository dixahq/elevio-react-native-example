import {
  StyleSheet,
  Text,
  SafeAreaView,
  Linking,
  Platform,
} from "react-native";
import {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useCallback,
} from "react";
import { WebView } from "react-native-webview";

const MESSAGE_PREFIX = "elevio-message";

const ELEVIO_CSS = `
  ._elevio_widget > div {
    animation-name: none !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    opacity: 1 !important;
    width: 100% !important;
    transform: translate3d(0,0,0) !important;
  }
`;

function elevioJS(user) {
  return `
		// data to send is an object containing key value pairs that will be
		// spread into the destination's state or seen as an event
		function sendMessage(payload) {
			const message = JSON.stringify({
				prefix: '${MESSAGE_PREFIX}',
				payload: payload
			});

			if (window.ReactNativeWebView?.postMessage) {
				window.ReactNativeWebView.postMessage(message, '*');
			} else {
				console.log('unable to find postMessage');
			}
    }
    
    function handleMessage(msg) {
      if (msg.action === 'show') {
        window._elev.open();
      }
      if (msg.action === 'hide') {
        window._elev.close();
      }
    }

		document.addEventListener("message", function(event) {
			if (event.data) {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
			}
		});
		
		window._elev.on('widget:closed', function() {
			sendMessage('widget:closed');
		});

		window._elev.on('load', function(_elev) {
			_elev.setSettings({
				display_type: 'full',
      });
      _elev.setUser(${JSON.stringify(user)});
			_elev.open();
		});
`;
}

const Elevio = forwardRef((props, ref) => {
  const webviewRef = useRef();
  const [elevioState, setElevioState] = useState({
    initialized: false,
    companyUID: null,
    user: null,
    isShown: false,
    page: null,
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        show(page) {
          setElevioState((prevState) => ({
            ...prevState,
            page,
            isShown: true,
          }));
          webviewRef.current?.injectJavaScript(elevioJS(elevioState.user));
          webviewRef.current?.postMessage(
            JSON.stringify({ action: "show", payload: page })
          );
        },
        hide() {
          webviewRef.current?.postMessage(JSON.stringify({ action: "hide" }));
          setElevioState((prevState) => ({
            ...prevState,
            isShown: false,
          }));
        },
        initialize(companyUID, user) {
          setElevioState((prevState) => ({
            ...prevState,
            companyUID,
            user,
            initialized: true,
          }));
        },
      };
    },
    []
  );

  const handleMessage = useCallback((msg) => {
    if (msg.payload === "widget:closed") {
      setElevioState((prevState) => ({
        ...prevState,
        isShown: false,
      }));
    }
  }, []);

  const receiveMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.hasOwnProperty("prefix") && msg.prefix === MESSAGE_PREFIX) {
        handleMessage(msg);
      }
    } catch (err) {
      return;
    }
  }, []);

  const isAbleToShow = elevioState.initialized && elevioState.isShown;

  return (
    <SafeAreaView style={[styles.container, isAbleToShow && styles.shown]}>
      <WebView
        ref={webviewRef}
        style={{ zIndex: 1000 }}
        originWhitelist={["*"]}
        onShouldStartLoadWithRequest={(navigationEvent) => {
          // Here we are checking if the link is an 'external' link.
          // If it is we prevent the webview from loading the request and
          // instead load the url in the platforms default browser.
          if (Platform.OS === "ios") {
            if (navigationEvent.navigationType === "click") {
              Linking.openURL(navigationEvent.url);
              return false;
            }
          } else {
            Linking.openURL(navigationEvent.url);
            return false;
          }
          return true;
        }}
        onMessage={receiveMessage}
        source={{
          html: `
            <html>
            <head>
            <style>
              ${ELEVIO_CSS}
            </style>
              <meta name="viewport" content="width=device-width, user-scalable=no" />
            </head>
            <body>
            <script>
              !function(e,l,v,i,o,n){e[i]||(e[i]={}),e[i].account_id=n;var g,h;g=l.createElement(v),g.type="text/javascript",g.async=1,g.src=o+n,h=l.getElementsByTagName(v)[0],h.parentNode.insertBefore(g,h);e[i].q=[];e[i].on=function(z,y){e[i].q.push([z,y])}}(window,document,"script","_elev","https://cdn.elev.io/sdk/bootloader/v4/elevio-bootloader.js?cid=","${elevioState.companyUID}");           
						</script>
            </body>
            </html>
						`,
        }}
      />
    </SafeAreaView>
  );
});

export default Elevio;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    backgroundColor: "#fff",
    flex: 0,
    bottom: 0,
    left: 0,
    right: 0,
    top: "100%",
    height: "100%",
    width: "100%",
    zIndex: 999,
  },
  shown: {
    top: 0,
  },
});
