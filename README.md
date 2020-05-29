# Tracified Contact Tracer
COVID 19 Contact Tracer Messenger Bot by Tracified

## Introduction
This app is based of the Messenger For Original Coast Clothing app - refer
https://developers.facebook.com/docs/messenger-platform/getting-started/sample-apps/original-coast-clothing
Multiple files have been removed and edited to cater to Tracified's requirements. Brief explanation of the files added and can be found below.

## Additional files
Files added can be classified into 2 parts (the age old classfication 😛😂)
- Frontend
- Backend

***

### 1. Frontend
Uses EJS templates to deliver content. Pages include
- Register
- Index
- Confirm

These are pretty straight forward. It does contain functions which can be renamed for better understanding.

***

### 2.Backend
#### Brief backstory
Uses simple NodeJs with Express to serve an API. All webhooks from Facebook come to the webhook endpoint from which relevant action is taken. When a message arrives it is either of the following types:
- Text Message
- Attachment Message
- Quickreply
- Postback
- Referral

Out of this certain message types like Quickreply and contain payloads.

When this message comes in the relevant actions and taken. The comments can be read for a detailed step by step explaination.

#### Back to the main story 🤓
We are also connected to a mongodb which includes the usuage of 2 schemas both of which are accessed through its own services.
- AdminUser (e.g. HR head)
- User (the BasicUser i.e. employee)

A seperate file, tracified.js provides abstraction for communication occuring between Tracified.

Summary of files added:
- adminUserSchema.js
- userSchema.js
- admin-user-serevice.js
- basic-user-service.js
- tracified-service.js

***

## TODO
The code base has certain areas which require improvement. Where ever possible such a tag has been included in the comments. The parts that require improvemnt include:
- Globalization of phrases in receive.js file.
