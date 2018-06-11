# Notepad application tutorial

In this practice run we will demonstrate how to use the Tanker SDK inside an existing React JavaScript application.

We will start from a working application with no encryption whatsoever, and progressively add end-to-end encryption, thus gaining full user privacy and strong protection against data leaks.

Knowledge about UI frameworks such as React is not required. However, the functions and methods of the Tanker API are asynchronous, so to take out the most of this tutorial you should know about [async functions](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Instructions/async_function).

Your mission, if you accept it, is to follow the instructions below in order to implement end-to-end encryption.

You are going to actually write some code there, so before you start please familiarize yourself the [api documentation](https://tanker.io/docs/latest/api/tanker/).

During this exercise, we'll also introduce you to the SDK core concepts with links to the [Tanker SDK guide](https://tanker.io/docs/latest/guide/getting-started/).

Note: if you get stuck, feel free to take a look at the `client/web/notepad` folder for clues :).

## Environment set up

Please check that [the server is started](../../../README.md) as this example application will rely on it.


## The application

### Description

The Web application is a simple notepad written in React.

Each user has access to exactly one note.

It implements the following features:

* Signing up
* Login
* Loading and saving the contents of the notes

Here is the user experience flow:

1. A user signs up and creates an account with an ID and password
2. He logs in
3. He is redirected to an edit form where he can type text, and save the contents by sending them to a remote server.

The server handles signing up of the users by hashing their passwords, and can also store the user notes. The server is also able to send [user tokens](https://www.tanker.io/docs/latest/guide/server/#user_token) to authenticated users.

### Run

To start the application, run in a new terminal:

```bash
yarn start:web:tutorial
```

The application should open in a new browser tab. If not, go to http://localhost:3000/ manually.

### Start using the application

Now that the application is up and running, please follow the steps below:

1. Sign up with the user name `alice` and the password `p4ssw0rd`. (Actually, you can use any user name and password, but if you choose to use other authentication values, please note that the server does not implement a "Forgot my password" feature...)

2. Type some text in the notepad's input and save it.

3. Open a new tab and sign up a new user (for instance `bob` with the password `letmein`).

4. Go back to the first tab, edit a new note (say `my message for Bob`) and click on the `share` button.

5. A list of users pops up. Select `bob` and click on `share`.

6. Go back to the second tab, click on the `Refresh` button next to the `Shared with me` panel in the home page.

7. You should see a `From alice` entry in the list. Click on it.

8. The text `my message from Bob` should be displayed.

OK, so far we have demonstrated how users can edit and share notes.


If you have a look at the `server/data/` directory, you will see a directory named after the TrustChain ID with a couple of json files in it.

This represents the data the notepad server knows about.

You can see that the contents of the notes we just created are stored in plain text.


If someone were to attack the server, he would have access to all the notes of all the users!

Let's try and fix this!

Data will be encrypted and decrypted client-side, and the notepad server will only see encrypted data.


## Step by step practice run

Right now, we are going to make sure the data is stored encrypted on the server, while still allowing users transparent access to their resources.

As explained above, the server already contains the required modifications.

Since the tanker SDK implements end-to-end encryption, most cryptographic operations will happen client-side, so in this tutorial we will only have to change code in the `./client/web/tutorial/src/Session.js` file.


### Handling a Tanker session

The goal here is to [open and close a tanker session](https://tanker.io/docs/latest/guide/open/).

In the `./client/web/tutorial/src/Session.js` file, the `trustchainId` has already been extracted from the config file for you:
```javascript
import { trustchainId } from './config';
```

*Use it to initialize a new Tanker instance in the constructor.*

Now we need to handle the creation of a Tanker session, with the help of the [`tanker.open()`](https://www.tanker.io/docs/latest/guide/open/#opening_the_session_client-side) method.

There are two cases here. Either the user just created an account, or he just logged in.

In both cases, the server should have sent a user token, and we can call `open()` right away.

*Call `this.tanker.open()` in `Session.openSession()`*.

Then you should *get rid of the `opened` attribute* and *fix the `Session.isOpen()` and `Session.close()` methods* using `tanker.status` and `tanker.close()`.

At this point, nothing has changed in the application, we just made sure we could open and close a Tanker section correctly.

You can check this by refreshing your browser, and log in. You should see the text you wrote in the previous step, and in the console log, the "Tanker session is ready" you've just added.

### Encrypting data

To encrypt data, *use [`tanker.encrypt()`](https://www.tanker.io/docs/latest/guide/encryption#encrypting) in `Session.saveText()`*.

Don't forget to use `toBase64()` to convert the binary encrypted data into text before sending it to the server.

### Decrypting data

To decrypt data, *use [`tanker.decrypt()`](https://www.tanker.io/docs/latest/guide/encryption/#decrypting) in `Session.loadTextFromUser()`*.

Don't forget to use `fromBase64()` to convert the encrypted text received from the server into binary.

### Checking it works

Now the data on the server can no longer be used by the clients. So go ahead, and edit the
`.json` files on the server to remove the data stored in plain text, keeping only the user token and the hashed password.

You can then try to log in, and check that:

* you can still edit and save a note,
* the `data` field in the `json` is now encrypted.

### Sharing

There is a problem, though. The "share" functionality no longer works.

If you try to repeat the steps we took to share notes between Alice and Bob, you will get an error message when Bob tries to read Alice's note.

Indeed, the keys used to encrypt and decrypt notes never left the local storage of Alice's browser.

What we need to do is exchange keys from Alice to Bob.

Note that each time we call `tanker.encrypt()` a new key is generated. This is done for security reasons.

We call each version of a note a *resource*. Each time the note changes, we must get its resource ID and ask the Tanker SDK to share access to it.

They are two places we need to do this:

* In the `Session.saveText()` method, called when the user clicks on `save` on the "Edit your note" panel
* In the `Session.share()` method, called when when the users clicks on `share` in the "Share" panel.

Please read the [section about sharing in the documentation](https://tanker.io/docs/latest/guide/encryption/#sharing) first.

Then, *use the `shareWith` option of `tanker.encrypt()` in `Session.saveText()`*.

Also make sure to *store the resource ID matching the newly generated key by using the `getResourceId()` helper method*

Next, in the `share` method:

* *Remove the line `this.resourceId = this.userId` since notes no longer are identified by their creator*.
* *Call `tanker.share()` with a list containing the current `resourceId` and the list of recipients*.

You can now re-try sharing notes between Alice and Bob, the "share" functionality should be working again.

### Device management

At this point, if you try to log in the same user in an other browser in private mode, or in any other device, you get an error message about a missing event handler.

That is because we did not take care of device management so far.

You should now go read the [section about device management](https://tanker.io/docs/latest/guide/device-management/).

Then *connect the `waitingForValidation` event of the Tanker and emit the `newDevice` event when required*.

You should do this in the Session constructor, right after creating the `tanker` object:

That way, when the user needs to perform manual operations about its device, the UI will be notified.

(The `newDevice` event is handled in the other React components of the application).

Then *implement the `Session.getUnlockKey()` and `Session.addCurrentDevice()` device methods using `generateAndRegisterUnlockKey()` and `unlockCurrentDevice()` respectively*.

Thus, when the user needs to unlock a new device, the web application will end up calling `tanker.unlockCurrentDevice()`.

You can now check that device management is indeed working by following those steps:

1. Sign up **with a new user** in the application (the previously created user cannot be used here since the unlock key feature wasn't implemented at the time of their creation),
2. Copy the user's unlock key and save it somewhere,
3. Fill the input with some content and click on the save button,
4. Keep your browser tab open.

You've just created a new user and some content associated, except this time you've saved the user's unlock key.

Now, you'll launch **a different browser** to emulate a new device (technically, different browsers don't share Tanker data and behave as separate devices):

1. Open a new tab in a second different browser,
2. You should now be redirected to a page where you can enter the unlock key you saved in the previous sequence,
3. Upon entering the unlock key, the second browser should display the same content that was saved in the first browser,
4. You can then change the content on the second browser, click save, go back to the first browser, and load the new content.

Note 1: instead of a second browser, you could also have used the first browser in private browsing mode to emulate a new device. Nevertheless, the browser won't persist Tanker data over private browsing sessions, so you would have to unlock the device every time you restart such a private browsing session.


Note 2: of course, in a more realistic application, users should not have to copy/paste an unlock key themselves. Tanker staff is working on implementing two different ways to implement the feature properly:

* First way is to use a "passphrase" (a set of 6 to 10 words) that the user can either safely note somewhere, or store in a dedicated device for instance.
* Or, store the encrypted unlock key on the Tanker servers. The user will then have to use some form of 2-Factor authentication to retrieve their unlock key.

## Conclusion

Congrats! You now have an example of a web application using end-to-end encryption, which implements secure sharing of notes.
