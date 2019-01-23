# Integrating Elevio with a React Native Mobile App

This is an example of how to embed the Elevio assistant inside a React Native application.

### Setup and running

1. Clone this repo. It has a running example of getting Elevio embedded inside React Native
2. Run `npm i` to install the required modules
3. To start setting up React Native, go to their [Getting Started Guide](https://facebook.github.io/react-native/docs/getting-started)
4. In the guide, select the **Building projects with native code** tab. In this section, select either "Android" or "IOS". Then follow the instructions in ["Installing dependencies"](https://facebook.github.io/react-native/docs/getting-started#installing-dependencies)

### Running the App

1. Follow the ["Running your React Native application"](https://facebook.github.io/react-native/docs/getting-started) section and see the application appear (either in your simulator or device, depending on the options selected in ["Installing dependencies"](https://facebook.github.io/react-native/docs/getting-started#installing-dependencies)).
2. To open Elevio, press on the Elevio word.

## Code explanation

To explain what it is happening and how you might modify this to suit your own needs, let's dive into the code.

### Adding your Company ID and User Info

Setting up your company and user settings is required so that Elevio Assistant knows which data to use and so it can manage [Smart groups](https://app.elev.io/segmentation).

1. Open up **App.js**. You'll see that we import named **Elevio** that imports everything from **Elevio.js**
2. Add your [company ID](https://app.elev.io/installation) and [user settings](https://api-docs.elevio.help/en/articles/4) in the `componentDidMount` method, where there is a call to `Elevio.initialize`

The `Elevio.initialize` method `initializes` the **Elevio** Assistant and renders it into a hidden view so that the Assistant is ready to show when triggered.

In the `render` method you'll see the `Elevio.Widget` component. This puts the WebView that renders Elevio in the component hierarchy.

### The Elevio.js File

So now over to where it all happens: the **Elevio.js** file.

#### Exported Functions

In the **Elevio.js** file you'll see a bunch of exported functions and a React component class. The exported functions are used to 'control' Elevio from the outside. This is so you can do things like call `Elevio.show()` to have Elevio appear. To get this to update the React component we use an Event Emitter. This gives you an imperative API that you can can use anywhere.

#### How the Widget Component Works

The main Widget component is where all the magic happens. Basically it's just a WebView that stays loaded, and _moves_ on and off the screen depending on if the Assistant is currently shown.

The communication between the web content that the WebView renders is all handled via messages. If you're interested in the approach taken, check out [this article](https://medium.com/react-native-training/improving-communication-between-react-native-webviews-and-the-webpages-they-render-792c8f7db3e5) for further reading.

> N.B: Due to a bug in the WebView provided natively by React Native we have installed https://github.com/react-native-community/react-native-webview.

The process for getting Elevio up and running on that WebView is the same as for any website. The snippet that loads Elevio is embedded in the body of the html rendered. Then we inject some JavaScript to enabled the communication between the Elevio Assistant and React Native environment. This all happens in the function `elevioJS`; it adds some Event listeners to the "message" event and creates a function to send a message to the outer component.

Each message going in and out of the WebView has a message prefix so we know if we should handle that event or not. That is defined in the constant `MESSAGE_PREFIX`. The injected JavaScript has a function called `handleMessage` that is responsible for looking at the `action` property of the incoming message and doing the relevant action. At the moment only the 'show' and 'hide' actions are taken into account but many more can easily be added. For a list of ways to interact with Elevio JavaScript, [take a look at our api docs](https://api-docs.elevio.help/en/articles/31-open).

The Elevio React Native component receives messages from the html elevio using the `onMessage` prop of the webview. This calls the `receiveMessage` method, which decodes the message and works out if it's something that we should act on. If so the `handleMessage` method is called with the parsed message and the relevant action is triggered. At the moment all we care about is the `'widget:closed'` action but you could add any action you like, for example an article being viewed or a search being submitted.

#### Appearance of Assistant on Open/Close

For the React Native app, the Elevio Assistant's standard CSS has been modified such that the appear/leave animations are turned off and the Assistant takes up the full width of the screen; you can see the CSS used in the React Native app inside the variable `ELEVIO_CSS`.

The resulting appearance of the Assistant for the React Native app on open/close is in the style prop of the `SafeAreaView` `top: this.state.isShown ? 0 : "100%"`. You could change this to appear and disappear in anyway that suits your UI, and maybe animate it with a transition.

> N.B. A Note from the Developer: I chose not to use the Modal component because the contents of the modal are removed from the render hierarchy when the modal is hidden. The consequence of this is that Elevio has to reload each time the modal is shown. This doesn't take too long because the JavaScript files have been cached but there is still a second or so of a blank screen.

One thing to note is that because the standard CSS for hiding the Assistant in desktop browsers has been removed, there is an on event (https://api-docs.elevio.help/en/articles/26-on) that listens to when the close button gets clicked. This then sends a message to the Elevio React Native component where the `hide` method is then called.

> N.B. You have to JSON.stringify all messages to send them and when you receive one you have to do JSON.parse as only strings can be sent.

#### The Widget and External URLs

One last thing to handle is external URLs, we do this using the `onShouldStartLoadWithRequest` prop to the WebView. Here we check if the url should be opened externally. Unfortunately there is a difference in the way iOS and Android calls this function so we have to wrap some logic in a platform specific check.
