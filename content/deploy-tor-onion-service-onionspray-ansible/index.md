+++
title = "Deploy a Tor onion service with Onionspray and Ansible"
date = 2025-11-04
description = "Learn more about Tor onion services (or hidden services), how they work, and how to easily deploy one with **Onionspray** and **Ansible**. We'll also show how to generate a vanity Tor address using `mkp224o`, and advertise it via the `Onion-Location` HTTP header."
[extra]
hot = true
toc = true
toc_sidebar = true
banner = "banner.webp"
+++

# Foreword

Hi there, and many thanks for being here!

In this article, we'll talk a little about privacy on the Internet, focusing on the **Tor network**. We'll explore **Tor onion services** (also called **hidden services**), what they are, what's their purpose, before **creating our own** very easily using **Onionspray** and **Ansible**. We'll also explain how to create a vanity Tor address with `mkp224o`, and advertise our onion service with the `Onion-Location` header (read on if this doesn't make sense for now).

What prompted this article is the **recent release of the v3** of the [official Onionspray Ansible role](https://gitlab.torproject.org/tpo/onion-services/ansible/onionspray-role/), of which I am the original creator and one of the current maintainers, along with [Silvio Rhatto](https://gitlab.torproject.org/rhatto) from the Tor Project who significantly improved it.

Feel free to use the table of contents to skip to the section relevant to you. Let's dive right in!

## The Tor network

When browsing the Internet, we leave *traces*. These are collected by various means. A lot can be used to track you, and I mean *a lot*: for example, [the wallpaper you chose on your phone](https://fingerprint.com/blog/how-android-wallpaper-images-threaten-privacy/). The subject of online privacy is vast, and websites like [privacyguides.org](https://www.privacyguides.org/en/basics/why-privacy-matters/) are full of resources to help you understand why you should care, and how to protect yourself.

I've also written on the subject, in French, [in this article](@/pph-votre-vie-privee-aujourd-hui/index.md). It was a long time ago, but still is a great introduction. <small>I'm pretty proud of it.</small>

We'll focus here on the **Tor network**, one way of improving your online privacy. You may have heard of it under the scary name of **dark web** or **darknet**, though those terms are more general (Tor being a specific network, others exist). Tor is pretty old, and was first developed in the 80s by the US Navy to protect government communications.

To understand Tor, you first need to know about **the Internet Protocol**, or **IP**, what you use to browse the Internet. The Internet works like a post office: when visiting `zoug.fr`, you rely on **IP addresses** (e.g. `203.0.113.48`) to send data through wires so that it reaches the `zoug.fr` webserver, and likewise, the webserver uses your IP address to send you data back, much like postal services rely on zip codes and street names for mail.

Tor tries to solve these two problems:

- Hiding the IP address you're using, from the website you visit
- Hiding the IP addresses you're communicating with, from anyone observing your network traffic, be it an ISP, your workplace (though Tor is blocked in most corporate networks), a public WiFi, etc.

To achieve this, Tor uses a principle known as **onion routing**. This is how [Wikipedia](https://en.wikipedia.org/wiki/Onion_routing) describes this, emphasis mine:

> In an onion network, messages are encapsulated in **layers of encryption**, analogous to the layers of an onion. The encrypted data is transmitted through a series of network nodes called "onion routers", each of which **"peels" away a single layer**, revealing the data's next destination.
>
> When the final layer is decrypted, the message arrives at its destination. The sender remains anonymous because **each intermediary knows only the location of the immediately preceding and following nodes**.

For Tor, the "onion routers" in the above definition are called **Tor relays**. When establishing a Tor connection, your computer will create what is called **a circuit**, that will consist of **guard node**, your point of entry into the Tor network, an intermediate node inside the network, and an **exit node** (by default). From there, the exit node makes a connection to the final website, through the Internet, and the answer is forwarded back to you through all the nodes of your Tor connection. This works differently for onion services - more on that later.

Each Tor relay has a public and private key, for encrypting and decrypting messages with their users, and your computer knows the public keys of the relays it chose and their IP address. By sending its traffic through these three machines, it becomes pretty hard, though not impossible, to track you online using your Internet traffic.

I won't go into more details here: for more info on how this all works, you can [watch this YouTube video from Computerphile](https://www.youtube.com/watch?v=QRYzre4bf7I), which does a great job at explaining the core concepts of Tor.

## Tor onion services

There are two main ways to use Tor. One is just to browse the Internet via [Tor Browser](https://www.torproject.org/download/), a browser preconfigured for Tor and based on Firefox, as previously described. This increases your online privacy, and allows you to bypass censorship in most cases. However, when using Tor this way, your web traffic **leaves the Tor network** at the end of your Tor circuit, when your exit relay contacts the website you're connecting to.

A sophisticated attacker observing the traffic between:

1) you and your Tor guard node
2) your Tor exit node and the website you're visiting

...could do **a correlation attack** to try to identify your connection.

The logic is simple: the attacker first observes that a particular IP address connects to Tor, sends a given amount of data, and shortly after sees a similar amount of data going out to a specific webserver, say `zoug.fr`. With enough data, the attacker could infer which IP address is connecting to `zoug.fr` through Tor in this case.

While doing research for this article, I stumbled upon [this old blog post](https://blog.torproject.org/one-cell-enough-break-tors-anonymity/) (2009) by the Tor Project, and while it is of course outdated, it does a great job at explaining more precisely what we're talking about here. If you're interested in the subject, you can also take a look at this [GitHub repo](https://github.com/Attacks-on-Tor/Attacks-on-Tor), which references some of the last years' attacks on the Tor network.

If your data never leaves the Tor network, the attacker can no longer rely on its traffic sniffing between an exit node and the Internet (point 2 above). This is where the other main usage of Tor comes in, **Tor onion services**, previously known as Tor **hidden services** (we'll stick with the "onion service" terminology in this article).

An onion service is a webserver, like the ones you're connecting to on the Internet, but **inside the Tor network**. By leveraging similar concepts as the ones described above, namely creating Tor circuits, using [rendezvous points](https://spec.torproject.org/rend-spec/rendezvous-protocol.html) and many hops inside the Tor network, Tor allows you to connect to an onion service while:

- not knowing the IP address of the onion service, thus allowing it to stay hidden inside the Tor network
- not communicating your IP address to the webserver you're connecting to

Essentially, a two-way communication tunnel between Alice and Bob, where neither Alice nor Bob knows where the other is. Pretty nifty!

This is how your traffic is best protected: the correlation attacks we talked about above are no longer practical, since your traffic no longer exits the Tor network via an exit relay. Attacks are of course still possible, as always in cybersecurity: *nothing* is ever 100% unbreakable.

To connect to onion services, you don't use IP addresses nor domain names (which are really just IP addresses, once DNS translates them), but **`.onion` addresses** instead. These look like this (here, using DuckDuckGo's address):

> duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion

Tor Browser can show you the circuit you took to access the onion service:

<figure>
{{ image(url="tor-browser-ddg-circuit.webp", alt="Screenshot of a Tor Browser circuit connecting to DuckDuckGo", no_hover=true) }}
<figcaption>Screenshot of a Tor Browser circuit connecting to DuckDuckGo</figcaption>
</figure>

This address allows you to find, via a hash table distributed throughout the Tor network, a **descriptor** of the onion service. This descriptor contains some info allowing you to establish an anonymous connection with to corresponding onion service, e.g. a public key for encrypting communications. More info on how all this works [here](https://spec.torproject.org/rend-spec/protocol-overview.html).

You can create your own onion service easily. The usual way to go about this is using the Tor daemon, [it's pretty straightforward](https://community.torproject.org/onion-services/setup/). However, if your website is complex, it may not be practical to add a Tor daemon to your webserver, or it may raise security concerns.

This is where [Onionspray](https://gitlab.torproject.org/tpo/onion-services/onionspray) comes into play. It works like a proxy to your existing HTTPS website, so that it can be accessed through Tor and a `.onion` address, without having to modify your main website. This way, you can offer your users access through Tor via a dedicated webserver, that will proxy the requests to your main infrastructure.

This offers your users **greater reliability of their Tor connection** (you're managing the final hop, which only handles connections to your website, instead of the final hop being an exit node used by thousands of users), and **better protection of their anonymity** (again, because they're no longer relying on public exit nodes where traffic could be sniffed by sophisticated attackers).

# Generate a vanity `.onion` address

Before putting these concepts into practice by leveraging the Onionspray Ansible role, we'll first generate what is called a **vanity Tor address**. Vanity, because using one of these is *vain*: your onion service will work just as well with a randomly generated `.onion` address.

They're just regular `.onion` addresses, but with a chosen prefix instead of pure randomness. Using them can help users quickly verify that they're connecting to the right website.

We'll use `mkp224o`, which is very fast, though it only uses your CPU to generate `.onion` addresses. In theory for this kind of computations, graphics cards could achieve higher speeds. For a 6-character prefix however, in this case `zougfr`, raw computing power doesn't matter much: any laptop can find one pretty fast. It only took like 30 seconds on mine (and my laptop is not exactly new).

The difficulty, however, greatly increases with a longer prefix. As a former employee of the independent French media outlet [Mediapart](https://www.mediapart.fr/) (*Abonnez-vous !*), I generated their  `.onion` address, and for 9 characters (namely `mediapart`), even with substantial computing power, it took around 24 hours. If you want to know more about Mediapart and Tor, you can [read the blog post](https://blogs.mediapart.fr/mediapart-journal-independant-et-participatif/blog/050924/mediapart-launches-tor) I wrote back then to introduce this new service to the readers ([here in French](https://blogs.mediapart.fr/mediapart-journal-independant-et-participatif/blog/050924/face-au-peril-democratique-mediapart-se-lance-sur-tor)), or [this interview](https://blog.torproject.org/mediapart-launches-onion-service/) on the subject with the Tor Project.

After installing `mkp224o` (e.g. via `snap` with `sudo snap install mkp224o`), to search for a `.onion` address with the `zougfr` prefix:

```cmd
mkp224o zougfr
```
{% crt() %}
```
sorting filters... done.
filters:
        zougfr
in total, 1 filter
using 4 threads
zougfriqn4pmip5tsujpzuj4gp4opwjehkkrksacy6iqsifm25tm6byd.onion
^Cwaiting for threads to finish... done.
```
{% end %}

Now, at a glance, readers can tell that this is probably the right `.onion` address for `zoug.fr`. However, like discussed earlier, it's easy for anyone to generate another `.onion` address that starts with `zougfr`. A great protection from being phished this way is to also look at **the last characters** of the address. If an attacker tries to generate a `zougfr` hash **which also ends in `m6byd`**, like mine, it becomes **a lot** harder.

We can take a quick look at the generated files:

```cmd
file zougfr*/*
```
{% crt() %}
```
zougfr[...]m6byd.onion/hostname:              ASCII text
zougfr[...]m6byd.onion/hs_ed25519_public_key: data
zougfr[...]m6byd.onion/hs_ed25519_secret_key: data
```
{% end %}

The `hostname` file contains the address, and the corresponding public and secret keys to that hash are saved as binary data. The name of these keys, `ed25519`, tells us more about the exact encryption algorithm used, namely [EdDSA](https://en.wikipedia.org/wiki/EdDSA). Onionspray and the role expect the values as Base64 strings, that you can obtain by doing:

```cmd
base64 hs_ed25519_public_key > hs_ed25519_public_key_base64
base64 hs_ed25519_secret_key > hs_ed25519_secret_key_base64
```

# Deploy an onion service using Onionspray and Ansible

We now have everything we need to deploy our onion service. Next step: using **Ansible** and **the Onionspray Ansible role** to handle the installation of Onionspray and its configuration for us.

> [!TIP]
> First, a quick word about **Ansible**: a very (very) popular tool to administer servers of all kinds. What's particularly nice about it is that 1) pretty much everyone uses it, so you'll find a lot of documentation online, and 2) you can use at lot of Ansible collections and roles, written by the community, to configure your server(s) automatically.
>
> I won't go into more details here, but you'll easily find a lot of tutorials online if this is your first time with the tool. I'd recommend following the official [Getting started](https://docs.ansible.com/ansible/latest/getting_started/index.html) guide, which will leave you with a working **inventory** and a first **playbook** to use, the only two things we'll need going forward.

## Onionspray Ansible role

The role is available on [Ansible Galaxy](https://galaxy.ansible.com/ui/standalone/roles/torproject/onionspray/). You can get it by running:

```cmd
ansible-galaxy role install torproject.onionspray
```
{% crt() %}
```
Starting galaxy role install process
- downloading role 'onionspray', owned by torproject
- downloading role from https://github.com/torproject/onionspray-role/archive/3.0.0.tar.gz
- extracting torproject.onionspray to /home/user/.ansible/roles/torproject.onionspray
- torproject.onionspray (3.0.0) was installed successfully
```
{% end %}

We'll start by configuring a couple of options for Onionspray, by defining Ansible variables for the host. Keep in mind a lot more is possible through [the role's variables](https://gitlab.torproject.org/tpo/onion-services/ansible/onionspray-role/-/blob/main/defaults/main.yml) and [Onionspray's settings](https://onionservices.torproject.org/apps/web/onionspray/guides/using/). A minimal config that should suit most needs is:

```yaml
---
# host_vars/my-onion-service.yml
onionspray_projects:
  - name: "zougfr"
    hardmaps:
      - upstream_address: zoug.fr
        onion_address: zougfriqn4pmip5tsujpzuj4gp4opwjehkkrksacy6iqsifm25tm6byd
        public_key_base64: PT0gZWQyNTUxOXYxLXB1YmxpYzogdHlwZTAgPT0AAADLqGLFEG8exD+zlRL80Twz+OfZJDqVFUgCx5EJIKzXZg==
        secret_key_base64: <your-Base64-encoded-secret-key-here>
```

You'll need to replace the onion address, public and secret keys above with the values [obtained previously](#generate-a-vanity-onion-address), or simply delete those three fields to use a randomly generated `.onion` address. In that case, you should probably run the role a first time to generate the files, then place them in your config to only ever use the same `.onion` address.

> [!CAUTION]
> You should strongly consider using [Ansible Vault](https://docs.ansible.com/ansible/latest/cli/ansible-vault.html) to store your secret key securely. By using a non-encrypted Base64-encoded string, you expose your onion service to impersonation if anyone gets a hold of these values.
>
> `ansible-vault` should be available with Ansible, and setting it up is easy. First create a file named `ansible-vault.password` in your current folder, containing a strong password. I'd also recommend only allowing read access to this file from your user, and adding it to your `.gitignore` file if using Git:
>
> ```cmd
> chmod 600 ansible-vault.password
> echo "ansible-vault.password" >> .gitignore
> ```
>
> Then simply run:
>
> ```cmd
> ansible-vault encrypt_string --vault-pass-file ansible-vault.password
> ```
> {% crt() %}
```
Reading plaintext input from stdin. (ctrl-d to end input, twice if
your content does not already have a newline)
<your-Base64-encoded-secret-key-here>
Encryption successful
!vault |
          $ANSIBLE_VAULT;1.1;AES256
          61613[...]
```
> {% end %}
>
> You now can define your variable as:
>
> ```yaml
> secret_key_base64: !vault |
>   $ANSIBLE_VAULT;1.1;AES256
>   61613[...]
> ```
>
> When running `ansible-playbook`, you'll have to pass the `--vault-pass-file ansible-vault.password` option to access it.

Assuming the Onionspray role is installed through Ansible Galaxy, you can now invoke it in a playbook:

```yaml
---
# my-playbook.yml
- name: provision hosts
  hosts: all
  become: true
  roles:
    - role: torproject.onionspray
```

Then run the playbook, e.g.:

```cmd
ansible-playbook --diff my-playbook.yml -i my-inventory.ini -l my-onion-service -K --vault-pass-file ansible-vault.password
```

The first run of the role will download and build Onionspray from source, which may take a little while. A new user, named `onionspray` by default, is created and runs Onionspray to serve your onion service. You can verify this by logging in as the `onionspray` user and querying the status of your install:

```cmd
sudo su onionspray -s /bin/bash
cd ~/onionspray/
./onionspray status -a
```
{% crt() %}
```
:::: status zougfr ::::
    PID TTY      STAT   TIME COMMAND
3865884 ?        Sl     5:23 tor -f /home/onionspray/onionspray/projects/zougfr/tor.conf
3865889 ?        Ss     0:02 nginx: master process nginx -c /home/onionspray/onionspray/projects/zougfr/nginx.conf
```
{% end %}

You should now be able to open up Tor Browser, input your `.onion` address, and reach your onion service.

# Advertise your onion service with `Onion-Location`

**Congratulations!** Your onion service is now up-and-running, and you can access it through Tor Browser. Now that you're available on Tor, you can advertise your `.onion` address in various ways. The first is of course telling people about it on your website. If you want to browse `zoug.fr` via Tor, you can use this address:

> zougfriqn4pmip5tsujpzuj4gp4opwjehkkrksacy6iqsifm25tm6byd.onion

Another way is to use the `Onion-Location` HTTP header ([docs](https://community.torproject.org/onion-services/advanced/onion-location/)). When encountering this header, browsers with Tor capabilities can display a message with the corresponding `.onion` address. `Onion-Location` should contain the full URL of the current page visited; for [https://zoug.fr/gallery/](https://zoug.fr/gallery/), the webserver would send the following header:

{% crt() %}
```
Onion-Location: https://zougfr[...]m6byd.onion/gallery/
```
{% end %}

When receiving this header, Tor Browser will display this button on the address bar:

<figure>
{{ image(url="onion-location.webp", alt="Tor Browser Onion-Location button", no_hover=true) }}
<figcaption>Tor Browser Onion-Location button</figcaption>
</figure>

You and your users can click the button to be redirected to the page on your onion service.

If you're using Nginx, it's as easy as adding the following to your configuration:

```
add_header Onion-Location https://<your-onion-address>.onion$request_uri;
```

For Traefik, this feature is still a [work in progress](https://github.com/traefik/traefik/issues/5036).

🎉 **Your onion service is now deployed and operational!** 🎉

Thank you for making it this far! If you have anything to add or a question, you can leave a comment below.
