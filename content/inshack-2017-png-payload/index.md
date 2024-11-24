+++
title = "INS'HACK 2017: Hiding In Plain Sight (forensics, 100)"
date = 2017-04-17
+++

[INS'HACK](http://inshack.insecurity-insa.fr/) is a series of conferences about computer security and a CTF held on-site (up until midnight, then open on the internet for another day). And as a member of [InSecurity](http://insecurity-insa.fr/), the cybersecurity club of my school (INSA Lyon), I got to join the organizing team putting the event together, and write one of the challenges of the CTF. And if you guys wonder if the event was cool, I have one answer for you:

![yes, that's 80 pizzas](pizzas-inshack-2017.webp)

All the source files and exploits for all the challenges are available on the [official repo](https://github.com/HugoDelval/inshack-2017/), with a writeup for each task! I'll be focusing here on my chall, "Hiding In Plain Sight" (forensics). We're given the following PNG file:

![evil salad](challenge-inshack-2017.png)

Cool salad, heh? The description of the challenge reads: "Your smart-plate has an embedded camera that takes pictures of your meals and automatically uploads them to your Instagram. However you fear it has been compromised and is quietly sharing information with all your followers". We hence need to find stuff hidden inside the file.

If you want a short and to-the-point explanation on how to solve this, [go here](https://github.com/HugoDelval/inshack-2017/blob/master/challenges/forensics/hiding-in-plain-sight-100/writeup.md). This post will be a little more detailed!

So, how would one go about hiding a payload inside a PNG file? First, let's take a look at the structure of a PNG file. According to the [specification](http://www.libpng.org/pub/png/spec/1.2/PNG-Structure.html), a typical PNG file starts with the following 8 bytes (in decimal):

    137 80 78 71 13 10 26 10

That's the file's signature, the second to fourth byte are the ASCII values of "PNG". This is followed by a series of **chunks**, i.e. fields containing the metadata of the file, the data itself, or anything really.

This is why PNG is really a great format if you want to hide stuff inside a file: just add a chunk, nobody will notice! All chunks follow the same basic structure: the **length** of the data, the **type** of the chunk, the **data** and finally a 4-byte **CRC** (checksum of the data).

However you need to be careful to start the file with an **IHDR** type chunk (Image HeaDeR), and end it with an **IEND** type chunk. The IHDR contains info about the image, like its width of height, etc (more info [here](http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html#C.IHDR)), and the IEND just marks the end of the file (its length is always 0, no data).

We now have a pretty good understanding of the internal structure of a PNG file. So let's try and list the chunks the PNG file above has, to see if there's anything interesting. The following Perl code does just that:

```perl
#!/usr/bin/env perl
## zoug.me
# list the chunks inside a PNG file
use autodie;
use strict;
use warnings;
use 5.010;

# open the file if specified, otherwise print usage
die "Usage: ./list-chunks.pl input.png" unless @ARGV == 1;
open my $in, '<:raw', $ARGV[0];
my ($data, $chunkSize, $chunkType);

# png file signature, the first 8 bytes
read $in, $data, 8;
# we check if the signature is valid
die "[ERR] Weird PNG!" unless $data eq "\x89\x50\x4e\x47\x0d\x0a\x1a\x0a";

# we then read everything chunk by chunk, and print the type
while (read $in, $data, 8) {
    # we extract the chunk size and type
    # unpack 'N' = unsigned long network order, 'a' = string
    ($chunkSize, $chunkType) = unpack 'Na4', $data;
    # we print the type
    say "Chunk type: ", $chunkType;
    # we skip the data (using the length value) and the crc of each chunk (4 bytes)
    seek $in, $chunkSize+4, 1;
}
```

Running that code on our file yields:

```
Chunk type: IHDR
Chunk type: inSa
Chunk type: iCCP
Chunk type: IDAT
Chunk type: IDAT
Chunk type: IDAT
... (more IDATs)
Chunk type: IEND
```

That "inSa" chunk looks like the perfect hiding place! The first two letters are in lowercase, which means that the chunk isn't necessary to display the image, and that it isn't part of the PNG specification. You'll find more info on the naming conventions [here](http://www.libpng.org/pub/png/spec/1.2/PNG-Structure.html#Chunk-naming-conventions).

To extract that chunk, take a look at the **decoder.pl** in the [official repo](https://github.com/HugoDelval/inshack-2017/)! You'll also find the **encoder.pl** that inserts a given payload as an inSa chunk, with the proper CRC value computed and the correct length.

In this case, the payload was a binary file. An easy way to find out its exact type is running the `file` command: here, it was a JPG with the flag written in it. Also, I've checked, and all major image hosting platforms don't check the chunks in the PNGs you upload, so the payload remains! You now have a cool furtive way to communicate with your friends if you guys are masochists.

Don't hesitate to send me your questions and feedback, see you around!

