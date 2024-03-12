# Integrating Elevio with a React Native Mobile App

This is an example of how to embed the Elevio assistant inside a React Native application using the Expo framework.

### Setup and running

1. Clone this repo. It has a running example of getting Elevio embedded inside React Native with Expo
2. Run `npm i` to install the required modules
3. This repo uses Expo to make getting started with React Native easier, to see more visit [Expo](https://expo.dev/)

### Running the App

In the terminal, run `npm start` to start the Expo server. This will open a new tab in your browser with the Expo DevTools. From here you can run the app in a simulator or on your device.

## Code explanation

To explain what it is happening and how you might modify this to suit your own needs, let's dive into the code.

### Adding your Company ID and User Info

Setting up your company and user settings is required so that Elevio Assistant knows which data to use and so it can manage [Smart groups](https://app.elev.io/segmentation).

Open up **App.js**. You'll see a couple of constants `ElevioAccountId` and `ElevioUser`. Replace these with your own company ID and user settings.
When rendering the `Elevio` component we keep a ref to it, this ref gives us access to the imperative API that we can use to control the Assistant from the outside.
The `Initialize` method is called when the component mounts and initializes the Assistant. This is so that it is ready to show when triggered.

To open Elevio when the app is running, press on the Elevio word.

### The Elevio.js File

So now over to where it all happens: the **Elevio.js** file.

#### How the Elevio Component Works

The Elevio component is where all the magic happens. Basically it's just a WebView that stays loaded, and _moves_ on and off the screen depending on if the Assistant is currently shown.

The communication between the web content that the WebView renders is all handled via messages. If you're interested in the approach taken, check out [this guide](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Guide.md#communicating-between-js-and-native) for further reading.

The process for getting Elevio up and running on that WebView is the same as for any website. The snippet that loads Elevio is embedded in the body of the html rendered. Then we inject some JavaScript to enabled the communication between the Elevio Assistant and React Native environment. This all happens in the function `elevioJS`; it adds some Event listeners to the "message" event and creates a function to send a message to the outer component.

Each message going in and out of the WebView has a message prefix so we know if we should handle that event or not. That is defined in the constant `MESSAGE_PREFIX`. The injected JavaScript has a function called `handleMessage` that is responsible for looking at the `action` property of the incoming message and doing the relevant action. At the moment only the 'show' and 'hide' actions are taken into account but many more can easily be added. For a list of ways to interact with Elevio JavaScript, [take a look at our api docs](https://api-docs.elevio.help/en/articles/31-open).

The Elevio React Native component receives messages from the html elevio using the `onMessage` prop of the webview. This calls the `receiveMessage` method, which decodes the message and works out if it's something that we should act on. If so the `handleMessage` method is called with the parsed message and the relevant action is triggered. At the moment all we care about is the `'widget:closed'` action but you could add any action you like, for example an article being viewed or a search being submitted.

#### Appearance of Assistant on Open/Close

For the React Native app, the Elevio Assistant's standard CSS has been modified such that the appear/leave animations are turned off and the Assistant takes up the full width of the screen; you can see the CSS used in the React Native app inside the variable `ELEVIO_CSS`.

The resulting appearance of the Assistant for the React Native app on open/close is in the style prop of the `SafeAreaView`, if shown the top is set to 0, if not it's set to 100%. You could change this to appear and disappear in anyway that suits your UI, and maybe animate it with a transition.

> N.B. A Note from the Developer: I chose not to use the Modal component because the contents of the modal are removed from the render hierarchy when the modal is hidden. The consequence of this is that Elevio has to reload each time the modal is shown. This doesn't take too long because the JavaScript files have been cached but there is still a second or so of a blank screen.

One thing to note is that because the standard CSS for hiding the Assistant in desktop browsers has been removed, there is an on event (https://api-docs.elevio.help/en/articles/26-on) that listens to when the close button gets clicked. This then sends a message to the Elevio React Native component where the `hide` method is then called.

> N.B. You have to JSON.stringify all messages to send them and when you receive one you have to do JSON.parse as only strings can be sent.

#### The Widget and External URLs

One last thing to handle is external URLs, we do this using the `onShouldStartLoadWithRequest` prop to the WebView. Here we check if the url should be opened externally. Unfortunately there is a difference in the way iOS and Android calls this function so we have to wrap some logic in a platform specific check.
