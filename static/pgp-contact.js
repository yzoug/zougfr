import * as openpgp from './openpgp.min.mjs';

// I put my OpenPGP binary key on this path to follow the WKD standard
// more info: https://github.com/yzoug/zougfr/pull/6
const pubKeyUrl = "/.well-known/openpgpkey/hu/dj3498u4hyyarh35rkjfnghbjxug6b19";
const formSubmissionUrl = "https://api.zoug.top/pgp/post";
const tokenSubmissionUrl = "https://api.zoug.top/pgp/token";
const headers = {
  "Content-Type": "application/json",
};

let contact_form = document.getElementById("contact-form");
contact_form.addEventListener("submit", handle_contact_form);
let token_form = document.getElementById("token-form");
token_form.addEventListener("submit", handle_token_form);

async function handle_contact_form(event) {
  // we don't want to redirect the user after form submission
  event.preventDefault();

  // first hide all error messages that may have been triggered before
  document.querySelectorAll('.error-message').forEach(function(msg) {
    msg.style.display = 'none';
  });

  // get my binary private key as Uint8Array
  const binaryPubKeyResponse = await fetch(pubKeyUrl);
  const binaryPubKeyBuffer = await binaryPubKeyResponse.arrayBuffer();
  const binaryPubKey = new Uint8Array(binaryPubKeyBuffer);

  // encrypt the message with OpenPGPjs and my PGP public key
  const pubKey = await openpgp.readKey({ binaryKey: binaryPubKey });
  const decryptedMessage = document.getElementById('pgp-message').value;
  const pgpMessage = await openpgp.createMessage(
        { text: decryptedMessage }
  );
  const encryptedMessage = await openpgp.encrypt({
    message: pgpMessage,
    encryptionKeys: pubKey,
  });

  // send the data to our Rust backend as JSON
  const dataJson = JSON.stringify({
    reply_to: document.getElementById('reply-to').value,
    pgp_message: encryptedMessage,
  });

  fetch(formSubmissionUrl, {
    method: "POST",
    headers,
    body: dataJson,
  })
    .then(response => {
      if (response.ok) {
        document.getElementById("contact-form-200").style.display = 'block';
        return response.text();
      } else if ([400, 403, 429, 500, 503].includes(response.status)) {
        document.getElementById("contact-form-" + response.status).style.display = 'block';
      } else {
        Promise.reject(new Error("fail"));
      }
    })
    .then(data => {
      if (typeof data !== 'undefined') {
        document.getElementById("msg-id").value = data;
        document.getElementById("token-form").style.display = 'block';
      }
    })
    .catch((error) => {
      document.getElementById("contact-form-error").style.display = 'block';
  });
}

async function handle_token_form(event) {
  // we don't want to redirect the user after form submission
  event.preventDefault();

  // first hide all error messages that may have been triggered before
  document.querySelectorAll('.error-message').forEach(function(msg) {
    msg.style.display = 'none';
  });

  // send the data to our Rust backend as JSON
  const dataJson = JSON.stringify({
    msg_id: document.getElementById('msg-id').value,
    token: document.getElementById('token').value,
  });
  fetch(tokenSubmissionUrl, {
    method: "POST",
    headers,
    body: dataJson,
  })
    .then(response => {
      if (response.ok) {
        document.getElementById("token-form-200").style.display = 'block';
      } else if ([400, 403, 404, 429, 500, 503].includes(response.status)) {
        document.getElementById("token-form-" + response.status).style.display = 'block';
      } else {
        Promise.reject(new Error("fail"));
      }})
    .catch((error) => {
      document.getElementById("token-form-error").style.display = 'block';
  });
}
