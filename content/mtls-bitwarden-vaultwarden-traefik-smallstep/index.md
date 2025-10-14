+++
title = "Mutual TLS (mTLS) in-depth: step-by-step case study feat. Bitwarden, Vaultwarden, Traefik and Smallstep"
date = 2025-10-10
description = "Learn how to use `step` to create your own certificate authority, and make your clients authenticate to a reverse proxy (`Traefik`) in order to access a sensitive application (`Vaultwarden` / `Bitwarden`)."
[extra]
hot = true
toc = true
toc_sidebar = true
#[extra.comments]
#id = 113085798299150158
+++

# Foreword

Hi there, and many thanks for being here!

This article goes on and on about password managers, mTLS and related cryptography concepts. It assumes you have a basic understanding of how **public key cryptography** works (public/private keys and how they work together to encrypt messages), and that you know what **TLS** is (the **S** of **HTTPS**), but not much more.

You can either read the whole thing, or directly skip to [this section](#creating-our-own-ca-smallstep), where we apply these concepts to add **mTLS to a Vaultwarden/Bitwarden self-hosted server** (or any other web-app, really), using **Smallstep** to create our custom certificate authority and certificates, and **Traefik** as our reverse proxy.

## On password managers

If you want to improve your online security, one of the very first steps you'd take, both in your private life and for work, is to use a **password manager**. These are nifty programs that make it humanely possible to set a different, strong password for every account you have online, and act as an encrypted vault for your private data.

One of the most common way people get their accounts stolen is by their password being stolen or guessed. When you use any website online, when inputting your password, you're trusting the website with this sensitive info. The website administrators have to store your password in a secure fashion (using [salts](https://en.wikipedia.org/wiki/Salt_%28cryptography%29) and [hashes](https://en.wikipedia.org/wiki/Cryptographic_hash_function)), they have to ensure their app is not compromised, etc.

Using a different password on every website is hence **a great protection**. Even if a website you use is completely compromised and your password leaks, only that website is affected. Your private data on all the other online services you use is not at risk.

You have many options. If you want an offline program, [KeePass](https://keepass.info/index.html) is old, very trusted, looks bad, but gets the job done. Me, I prefer [KeePassXC](https://keepassxc.org/), which is similar but more modern. Both these programs and others, however, don't take care of syncing passwords between your devices: you'd have to share and keep your database up-to-date on all your machines.

So in today's world, an online tool is a lot more convenient. Again, many choices, my recommendation being [Bitwarden](https://bitwarden.com/), free for most use-cases, and very fairly priced for premium features. The server Bitwarden itself is free software (AGPL v3), which means in a nutshell that you also can run it from your own server for free.

I use [Vaultwarden](https://github.com/dani-garcia/vaultwarden), because the Bitwarden server is a little hungry in resources. Vaultwarden is more lightweight, and **follows the Bitwarden API**: this has the great benefit of allowing us to use all the official Bitwarden clients with it (desktop apps, mobile apps and browser extensions).

## Exposing my vault online

I need to access my Vaultwarden data from my phone and computers to keep the passwords synced. For years, my setup was a home "server" (really, a [cheap NUC](https://www.notebookcheck.net/Intel-NUC-Kit-NUC7CJYH-Celeron-J4005-UHD-600-Mini-PC-Review.308466.0.html) that consumes almost no electricity), with Vaultwarden on it, accessible from my home network or through WireGuard for remote access. However, that's a machine used to test stuff, and as a result, it is often down. Also, using WireGuard to remotely access my vault was cumbersome and sometimes not possible. After a while, I got tired of maintaining this, so now, I run Vaultwarden from an online VPS, and **it's exposed on the Internet**.

This is the choice of **convenience**. However, we're talking about the cornerstone of my online security. All my passwords and secrets are in my Vaultwarden server: if someone breaks in somehow, *I'm in deep trouble*.

One of the steps I took was to try and hide it: dedicated server, dedicated domain, only accessible through an unguessable subdomain, which isn't in DNS records. This way, finding my vault is not easy: malicious scanning bots won't stumble into it by accident. I could still, of course, accidentally expose the domain it's on in a number of ways.

For instance, anyone spying on my Internet connection could see this domain if I use non-encrypted DNS requests. Also, if my browser doesn't encrypt the first step of the TLS handshake (called the `Client Hello`), it contains what's called the [Server Name Indication](https://en.wikipedia.org/wiki/Server_Name_Indication) extension of TLS (`SNI`), which itself contains my super secret domain in cleartext. Yet another way of finding out this domain is to look at the certificate the server sends back, which contain the domain it's valid for in cleartext (except if you use the latest version of TLS, TLS 1.3).

> [!TIP]
> A quick word on `DNS`, `SNI`, `Client Hello`, and how they could expose our domain to a network observer.
>
> When using your browser, if you go to `https://zoug.fr`, you'll ask a DNS server, usually operated by your ISP, to translate that domain to an IP address, say `203.0.113.42`. The DNS request you would send to find that info is usually unencrypted, except if you use an encrypted DNS variant (your two options being DNS-over-HTTPS (`DoH`) or DNS-over-TLS (`DoT`)). So anyone watching the packets going through your Internet connection will see what domain you're trying to access.
>
> Then, since you're using HTTPS, your browser will **establish an encrypted tunnel** (actually *two* encrypted tunnels, one for client to server communications, and another, different one for server to client data) with the server at `203.0.113.42`: this process is called a TLS **handshake**. However, the server may have more than one domain associated with it, e.g. maybe `https://example.com` is also served by the same IP address. So the server you're connecting to actually has to know if you're trying to access `zoug.fr` or `example.com`, in order to use the right **TLS certificate** and the corresponding public key to establish the encrypted tunnels (the certificate valid for `zoug.fr` may not be valid for `example.com`).
>
> To solve this, the first step of the TLS handshake, called the `Client Hello`, includes an extension called `SNI`. The `SNI` contains the domain we're trying to access. This happens **before** any encryption takes place. So in our scenario, on untrusted networks and only by watching the TLS traffic, people may see not only the IP address, but also **our super secret domain passing through the wire** when I'm using my vault, even though the pages I visit, the actual data I send and receive is encrypted.
>
> Most webservers today support TLS v1.3, which can encrypt the first step of the handshake (`Encrypted Client Hello`, or `ECH` for short). However, this is still very much a work in progress ([for example for OpenSSL support](https://github.com/openssl/project/issues/892)). Assuming your browser and the server it's talking to implement it, your TLS connection won't contain the domain you're trying to access in cleartext: [you can check here](https://www.cloudflare.com/ssl/encrypted-sni/) if that's the case, or by quite simply opening up `wireshark` and inspecting the TLS packets you're sending.
>
> Even if we do everything right, we're still [not safe in corporate networks](https://community.fortinet.com/t5/FortiGate/Technical-Tip-How-to-block-TLS-1-3-Encrypted-Client-Hello-ECH-in/ta-p/328324) (but who ever is?), nor if our employer ["responsibly" (🤣) intercepts all of our traffic](https://docs.broadcom.com/doc/responsibly-intercepting-tls-and-the-impact-of-tls-1.3.en).
>
> If you want to learn more about TLS, look no further than this visual explanation by Michael Driscoll, [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/): it's a gem. I also quite liked [this video by Practical Networking](https://www.youtube.com/watch?v=ZkL10eoG1PY), if that's your preference.

Anyways, enough about that. Another step I could also take to better protect my vault would be to [have a WAF](https://github.com/owasp-modsecurity/ModSecurity-nginx) (*Web Application Firewall*) between the Internet and this service. Still, the decision of exposing my vault online wasn't sitting right by me.

## Enter mTLS

A perfect way to better protect my vault is **mTLS**. There's one thing I can't live without: access to my vault from my phone. This is very, very handy, and has saved me on countless occasions. mTLS was out of the question if it meant I could no longer use the Bitwarden Android app, so imagine my happiness when I learned that [the app now supports it](https://github.com/bitwarden/android/pull/4486#issuecomment-2867152344) for self-hosted setups (since May 2025). Many thanks to the contributors and to Bitwarden for working on this, as I'm sure it's not a business priority!

The **m** of **mTLS** stands for **mutual**. Instead of you (i.e. your browser) authenticating the website you're visiting (i.e. making sure only the **zoug.fr** website can access the data you send it, no one else), **mTLS** does the same, but **mutually**, i.e. the website you're visiting **also authenticates the client** (i.e. your browser).

With TLS, that authentication step works by leveraging what we call **certificate authorities**, or CAs for short. These are nothing more than public/private keys, such as the ones we'll generate later in this article, but they are  ✨ *special* ✨ in that they are trusted by your browser (there's [quite a few of them](https://ccadb.my.salesforce-sites.com/mozilla/CACertificatesInFirefoxReport)).

These trusted CAs supply TLS certificates and **cryptographically sign** them. They have to make sure that when they send a TLS certificate for a domain, the certificate is sent to someone who controls that domain. So when you visit `zoug.fr` and receive a TLS certificate from the server, your browser can verify that one of the trusted CAs it bundles supplied it.

**In theory**, this assures you that you're indeed accessing the website you want to go to, not someone else pretending to be that website to steal your credentials or data. If that verification fails, your browser won't allow you to access that domain, at least not without clearing stating that *your connection is not secure*.

**mTLS works pretty much the same way**. However, the **mutual** part means that in addition to the server's certificate, **your browser also sends one** (or, in our case, the Bitwarden mobile app sends it). The server does the exact same verification your browser does, i.e. verifies that the TLS certificate the client sent it was indeed signed by a trusted CA.

Hopefully, if I was clear in my explanations, you can now see where we're headed. What we want to do is **first create our own private certificate authority**, then use it to **generate client certificates** for our devices. Then we want to configure **a reverse proxy to validate client certificates** trying to access our vault, and only grant access if the client has supplied **a certificate signed by our private CA**.

This will allow me to rest easy. If I make sure that no one steals my CA's private key, nor any client certificate I generate with it, I can be **very confident** in the fact that no unauthorized bytes will ever reach Vaultwarden.

Let's get to it!

# Creating our own CA (Smallstep)

OpenSSL is the reference when doing these operations, and you'll easily find tutorials online with that tool. We'll use [Smallstep's CLI](https://smallstep.com/cli/) here, `step`, which I find easier to work with. Everything I'm doing here is [covered more in-depth](https://smallstep.com/docs/step-cli/basic-crypto-operations/#create-and-work-with-x509-certificates) in the docs.

To generate a root certificate authority called `ZCA`:

```cmd
step certificate create ZCA ca-root.crt ca-root.key --profile=root-ca
```
{% crt() %}
```
Please enter the password to encrypt the private key:
<input a strong passphrase here and store it in... your vault of course!>

Your certificate has been saved in ca-root.crt.
Your private key has been saved in ca-root.key.
```
{% end %}

By default, `step` will generate a certificate valid for 10 years, and using [elliptic-curve cryptography](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm). Everything can be fine-tuned, [more info in the manual](https://smallstep.com/docs/step-cli/reference/certificate/create/#options). Using this CA, we can generate a client certificate, valid for a year:

```cmd
step certificate create Browser browser.crt browser.key \
    --profile leaf --not-after=8760h \
    --ca ./ca-root.crt --ca-key ./ca-root.key --bundle
```

> [!CAUTION]
> What I'm doing here is signing the client certificate directly with the root CA, which is not the most secure way of doing it.
>
> The root CA certificate is long-lived and very (very) important: if it leaks, you can no longer trust any certificate signed by it. What you usually want to do is generate an intermediate certificate from the root CA (`--profile intermediate-ca`), then only use that certificate to generate leaf certificates.
> 
> This way, the root CA can be stored offline and as securely as possible (even using [dedicated hardware](https://en.wikipedia.org/wiki/Hardware_security_module)), and you only need the intermediate CA for all usual operations.

Let's take a closer look at the generated client certificate, using `step certificate inspect browser.crt`:

{% crt() %}
```
Certificate:
    [...]
    Signature Algorithm: ECDSA-SHA256
        Issuer: CN=ZCA
        Validity
            Not Before: Oct 11 20:38:53 2025 UTC
            Not After : Oct 11 20:38:15 2026 UTC
        Subject: CN=Browser
        Subject Public Key Info:
            [...]
                Curve: P-256
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature
            X509v3 Extended Key Usage:
                Server Authentication, Client Authentication
            [...]
```
{% end %}

We see that the issuer of our certificate is indeed our `ZCA` root CA, and that this certificate's subject only contains its common name (or CN), `Browser` in this case. If this were to be used as a TLS certificate for a webserver, we'd have the domain name in this CN field (e.g. `www.zoug.fr`). We also see that in the `X509v3 extensions` section, `Client Authentication` is an authorized use of this certificate.

Since everything seems fine, we can load this client certificate in our web browser. However, Librewolf (based on Firefox), the browser I use, only accepts a PKCS#12 file format (which contains both the certificate and the associated private key). To generate this file from what we have:

```cmd
step certificate p12 browser.p12 browser.crt browser.key
```

And then, import the resulting `browser.p12` file in the browser:

<figure>
{{ image(url="import-cert-librewolf.webp", alt="Screenshot of Librewolf's settings", no_hover=true) }}
<figcaption>Screenshot of Librewolf's settings. Trigger warning: French.</figcaption>
</figure>

That's basically it!

We now have the two necessary pieces for an mTLS connection to take place:
- **the root CA's public key** (contained in its certificate), used by the webserver to verify that the client certificate is indeed authorized
- **our browser's client certificate**, our only (for now) authorized client, i.e. the certificate supplied by our browser when connecting to our webserver

# Setting up Traefik for mTLS

The first (and most complicated) step is now done, congratulations! All that is left to do now is to setup our webserver or reverse proxy to accept mTLS connections, and verify that the client is authorized.

If you're using Nginx, it's as simple as adding, in your `server` block:

```
ssl_client_certificate /path/to/ca-root.crt;
ssl_verify_client on;
```

In this tutorial, we'll do the configuration for the **Traefik** reverse proxy.

[Traefik](https://doc.traefik.io/traefik/getting-started/quick-start/) is written in Go and has been around for some time now. Along with other helpful feature such as [Let's Encrypt automation](https://doc.traefik.io/traefik/reference/install-configuration/tls/certificate-resolvers/acme/) out-of-the-box, it's built for use with Docker (and Kubernetes), so it's perfect if you're also deploying your sensitive service using Docker.

For instance, to deploy Traefik and Vaultwarden using Docker Compose:

```yaml
# docker-compose.yml
services:
  # reverse proxy
  traefik:
    image: traefik:3.5
    # the ports Traefik listens on, usually HTTP (80) and HTTPS (443)
    ports:
      - 80:80
      - 443:443
    volumes:
      # Traefik has read access to the Docker daemon
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # Traefik's installation config file, where you define the Docker
      # provider, which ports Traefik should listen on, etc.
      - ./traefik-install.yml:/etc/traefik/traefik.yml
      # path to our dynamic config file, where the Vaultwarden-related
      # settings are provided
      - ./traefik-vaultwarden.yml:/etc/traefik/dynamic/vaultwarden.yml
      # where we'll store our Let's Encrypt certificates
      - traefik-letsencrypt:/etc/traefik/letsencrypt
      # finally, we need to supply our CA public certificate
      # (the private key is not needed to verify a client certificate)
      - ./ca-root.crt:/etc/traefik/custom-ca/ca.crt
    restart: unless-stopped

  # password vault
  vaultwarden:
    image: vaultwarden/server:latest
    environment:
      # WebSocket is supported by traefik
      WEBSOCKET_ENABLED: "true"
      ADMIN_TOKEN: "<secret-admin-token>"
      # the domain you'll use to access the vault
      DOMAIN: "https://<subdomain>.<domain>"
      SIGNUPS_ALLOWED: "false"
    volumes:
      - vaultwarden-data:/data
    restart: unless-stopped

volumes:
  traefik-letsencrypt:
  vaultwarden-data:
```

Here's an install config file for Traefik as an example, which enables Let's Encrypt for certificate management and the necessary [mTLS configuration](https://doc.traefik.io/traefik/reference/routing-configuration/http/tls/tls-options/#client-authentication-mtls):

```yaml
# traefik-install.yml
providers:
  # use Docker
  docker:

  # supply your dynamic config file(s) in this directory
  file:
    directory: /etc/traefik/dynamic

# the ports we'll listen on, HTTP (80) and HTTPS (443)
entryPoints:
  web:
    address: ":80"

  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: /etc/traefik/letsencrypt/acme.json
      # start by using the staging Let's Encrypt server to test
      # if everything works correctly, removing this line will use
      # the production server instead
      caServer: https://acme-staging-v02.api.letsencrypt.org/directory
      httpChallenge:
        # used during the ACME challenge to obtain TLS certificates
        entryPoint: web
```

And the corresponding dynamic configuration file for Vaultwarden:

```yaml
# traefik-vaultwarden.yml
tls:
  options:
    default:
      # not all clients support TLS 1.3 yet, so we'll allow TLS 1.2
      minVersion: VersionTLS12
      # we want to strictly check the SNI: if unknown, block access
      sniStrict: true
    mtls:
      # mTLS configuration
      # we ask Traefik to require a client certificate,
      # and verify it with our CA
      clientAuth:
        caFiles:
          - /etc/traefik/custom-ca/ca.crt
        clientAuthType: RequireAndVerifyClientCert

http:
  routers:
    vautlwarden-router:
      rule: "Host(`vault-domain.example.com`)"
      service: vaultwarden-service
      # specifying "tls" automatically blocks HTTP access
      tls:
        certResolver: letsencrypt
        options: mtls
  services:
    vaultwarden-service:
      loadBalancer:
        servers:
          # Docker takes care of DNS for us, using the container's
          # declared name in the Docker Compose file
          - url: "http://vaultwarden"
```

By keeping things modular like this, you only need to add a new dynamic configuration for a new service, and modifying it will update Traefik without needing it to restart.

We're all done! Now, when visiting `vault-domain.example.com`, Traefik asks us to supply a client certificate:

<figure>
{{ image(url="traefik-asks-client-cert.webp", alt="Traefik asks our browser for a client certificate.", no_hover=true) }}
<figcaption>Traefik asks our browser for a client certificate.</figcaption>
</figure>

The connection then succeeds with our Vaultwarden container:

<figure>
{{ image(url="vaultwarden-login.webp", alt="Vaultwarden's login page, displayed after the mTLS authentication.", no_hover=true) }}
<figcaption>Vaultwarden's login page, displayed after the mTLS authentication.</figcaption>
</figure>

# Wrapping up

First of all, at this point, **the Bitwarden browser extension should work**: it will ask you for your client certificate, which you already loaded into your browser, when needed. No need to reinstall it or modify your existing configuration.

However, we still need a new client certificate for our mobile Bitwarden app, and the corresponding PKCS#12 file:

```cmd
step certificate create Mobile mobile.crt mobile.key \
    --profile leaf --not-after=8760h \
    --ca ./ca-root.crt --ca-key ./ca-root.key --bundle

step certificate p12 mobile.p12 mobile.crt mobile.key
```

You'll have to do that again, for your browser and mobile app, one year from now.

**Securely** copy the `mobile.p12` file to your mobile phone (for example, using a USB cable). You'll then need to remove your Bitwarden app data, and create a new access from scratch: logging out of your account, and trying to log back in isn't enough (yet).

When launching the app after removing its data, you'll have to supply your self-hosted settings, and you'll see the option allowing you to input your client certificate:

<figure>
{{ image(url="bitwarden-mobile-app-settings.webp", alt="The Bitwarden mobile app self-hosted server settings, after supplying my client certificate.", no_hover=true) }}
<figcaption>The Bitwarden mobile app self-hosted server settings, after supplying my client certificate.</figcaption>
</figure>

🎉 **Your mTLS-secured access to your password vault is now operational!** 🎉

Thank you for making it this far! If you have anything to add or a question, you can leave a comment below.
