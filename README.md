twilio-ip-messaging-js
======================

### Running the demo

##### Set credentials

1. Copy `credentials.example.json` to `credentials.json`
2. Plug your credentials into `credentials.json`

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

This demo defaults to using the latest build of the JS IP Messaging SDK.
To change to a different version, just open `public/index.html` and change the
following string to point to the URL of the version you'd like to use:

```
<script src="https://media.twiliocdn.com/sdk/rtc/js/ip-messaging/v0.8/twilio-ip-messaging.js"></script>
```
