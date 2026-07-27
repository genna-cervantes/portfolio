---
title: Coding From Anywhere
date: July 27, 2026
description: Understanding Basic Networking by Building a Mini Home Lab
readTime: 9 min read
---
## Working on the Go

I wanted to be able to check on and prompt my coding agents through my phone so I could work anywhere, even without my laptop with me.

The idea was to have a computer running 24/7 that I could SSH into from either my phone or laptop. My coding sessions would keep running on that machine, and I could reconnect to them whenever I wanted.

Cloud development, as they say.

The obvious solution was to rent a VPS, but there was one problem: VPS hosting can get pretty expensive. Paying around ₱2,000 every month for a machine with 8 GB of RAM sounded crazy to me. That was more than I was willing to pay for the setup.

I was pretty bummed until I remembered that I had an old laptop sitting at home!

## Turning an Old Laptop Into a Server

I had heard about people turning old laptops into servers before, but what does that actually mean?

A normal laptop is designed to be used directly. You interact with a graphical interface, open browsers, join meetings, click buttons, and run desktop applications.

Since I only needed the laptop to run projects and accept remote connections, I replaced Windows with Ubuntu Server. It has no desktop environment by default, leaving more resources for the programs I actually wanted to run.

Once Ubuntu was installed, the next question was: how do I connect to it from another device?

## Connecting Through SSH

This is where SSH comes in.

SSH stands for Secure Shell. It allows one computer to securely open a terminal session on another computer over a network.

Suppose my Ubuntu server has the local IP address `192.168.1.20`. When I run:

```bash
ssh genna@192.168.1.20
```

my Mac opens a TCP connection from a temporary local port, such as `192.168.1.19:54321`, to `192.168.1.20:22`, where the SSH server is listening.

Once the connection is established, SSH performs a cryptographic exchange so that the traffic between the two machines is encrypted.

Ubuntu must also verify that I am allowed to connect. This can be done using a password, but SSH keys are generally more convenient and secure.

At this point, I could finally control my Ubuntu server from my Mac.

But there was another problem.

## Keeping Terminal Sessions Alive With tmux

What happens when the SSH connection disconnects?

Normally, SSH gives me an interactive terminal connected to a shell on the Ubuntu server. When that SSH connection disappears, the terminal session attached to it also disappears. Programs running inside it may also stop.

That is not ideal if I have a coding agent running for a long time or a development server that I want to return to later.

I needed my terminal sessions to exist independently of my SSH connection.

That is what tmux does.

tmux stands for terminal multiplexer. It runs a separate tmux server process on the Ubuntu machine and manages persistent terminal sessions.

The basic flow looks like this:

```text
My Mac or phone
       ↓
      SSH
       ↓
  tmux client
       ↓
  tmux server
       ↓
Shell and running programs
```

When I SSH into Ubuntu and start tmux, the tmux client connects to the tmux server through a local Unix socket. The tmux server then owns the shells and programs running inside the tmux session. My SSH connection is only used to view and interact with that session.

Later, I can reconnect from my laptop or phone and attach to the same session:

```bash
tmux attach
```

Now I could disconnect without worrying that my work would disappear.

## Why `localhost:3000` Did Not Work

With remote access and persistent sessions working, I tried doing some actual development.

On our codebase, I ran:

```bash
npm run dev
```

The development server started on port 3000.

I then opened `http://localhost:3000` on my Mac, but nothing appeared.

When I ran `npm run dev` through SSH, the development server was running on Ubuntu. Opening `localhost:3000` on my Mac did not work because `localhost` always refers to the device making the request.

Instead, I needed to open Ubuntu’s local IP:

```text
http://192.168.1.20:3000
```

The development server also needed to accept connections from other devices, not just Ubuntu itself. I could do that by binding it to `0.0.0.0`:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

`0.0.0.0` tells the server to listen on all available network interfaces, allowing my Mac to reach it through Ubuntu’s IP address.

## Leaving the Home Network

Everything was now working, but only while I was at home.

Addresses beginning with `192.168` are private IP addresses. My Mac could reach `192.168.1.20` because both machines were connected to the same home router.

Once I left the house and switched to mobile data or another Wi-Fi network, however, that address would no longer point to my Ubuntu server.

I needed a way for my devices to behave as though they were still on one private network.

That is where Tailscale comes in.

## Creating a Private Network With Tailscale

Tailscale creates a private network between my Ubuntu server, Mac, and phone. Each device gets a stable Tailscale IP, such as `100.110.20.30`, allowing me to run:

```bash
ssh genna@100.110.20.30
```

Under the hood, Tailscale tries to establish a direct peer-to-peer connection between the devices.

Doing this is complicated because devices on home networks are usually hidden behind their routers through Network Address Translation, or NAT.

Inside my house, my Ubuntu server might have the private address `192.168.1.20`, while the router has a public IP address such as `203.0.113.10`.

When Ubuntu sends a packet to the internet, the router might translate `192.168.1.20:54300` into `203.0.113.10:23000` and remember the mapping between them.

When a response returns to `203.0.113.10:23000`, the router knows to send it back to `192.168.1.20:54300`.

This allows multiple devices inside my home to share the router’s public IP address.

Tailscale tries to take advantage of these mappings to allow two devices behind different routers to communicate directly. This is commonly called NAT traversal or hole punching.

Once the direct connection is established, encrypted packets can travel directly between my phone and Ubuntu server without being routed through a central Tailscale server.

## What Happens When a Direct Connection Fails?

If a direct connection cannot be established, Tailscale relays the encrypted packets through a DERP server.

DERP stands for Designated Encrypted Relay for Packets. The relay can forward the traffic but cannot decrypt it.

A direct connection is generally faster, but the DERP fallback means my devices can usually still communicate even when NAT traversal fails.

## The Final Setup

After putting everything together, from my laptop or phone, I can:

1. Connect to the Ubuntu server through Tailscale.
2. SSH into it.
3. Attach to an existing tmux session.
4. Check my coding agents.
5. Start or inspect development servers.
6. Disconnect without stopping anything.

What initially sounded like one simple goal—accessing a coding agent from my phone—ended up involving several layers of networking.

And now I can finally leave the house without bringing my laptop while still being able to control my coding agents. Yay!
