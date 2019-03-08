twilio-chat-demo-js
======================

### Running the demo

##### Set credentials

1. Copy `credentials.example.json` to `credentials.json`
2. Plug your credentials into `credentials.json`

You can find the following credentials in your Twilio Console:

| Config Value  | Description |
| :-------------  |:------------- |
`accountSid` | Your primary Twilio account identifier - find this [in the console here](https://www.twilio.com/console).
`signingKeySid` | The SID for your API Key, used to authenticate - [generate one here](https://www.twilio.com/console/runtime/api-keys).
`signingKeySecret` | The secret for your API Key, used to authenticate - [you'll get this when you create your API key, as above](https://www.twilio.com/console/runtime/api-keys).
`serviceSid` | Like a database for your Chat data - [generate one in the console here](https://www.twilio.com/console/chat/services).
`pushCredentialSid` | Credentials are records for push notification channels for APN and FCM - [generate them in the console here](https://www.twilio.com/console/chat/credentials) and [read more about configuring push here](https://www.twilio.com/docs/api/chat/guides/push-notification-configuration).

##### Install dependencies

```
$ npm install
```

##### Run server

```
$ npm start
```

##### Connect

Connect via `http://localhost:8080`

### Using another version

This demo defaults to using the latest build of the Chat JS SDK.
To change to a different version, just open `public/index.html` and change the
following string to point to the URL of the version you'd like to use, for example to use v3.2.1:

```
<script src="https://media.twiliocdn.com/sdk/js/chat/releases/3.2.1/twilio-chat.min.js"></script>
```
