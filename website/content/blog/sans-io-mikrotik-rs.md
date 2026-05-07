+++
title = "sans-io, or how to write a protocol library once"
date = 2026-05-07
description = "How I built a MikroTik RouterOS client that runs on both Tokio and a 16MB router."
[taxonomies]
tags = ["rust", "networking"]
+++

I run MikroTik routers in my homelab. They're great little boxes, very customizable, and I've been wanting to manage them programmatically for a while now. Think Ubiquiti's Unifi controller, but for MikroTik (more on this in a future post :wink:).

<!-- more -->

MikroTik has an API for this. The documentation is [one Confluence page](https://help.mikrotik.com/docs/spaces/ROS/pages/47579160/API). That's it. The whole thing[^1]. No official client library in any language, just a list of community projects at the bottom of said page. The protocol itself is a binary, length-prefixed, word-based format that feels like it was designed in 2006, because it probably was.

So I built [mikrotik-rs](https://github.com/ferrohd/mikrotik-rs).

## the problem

I need this library to work in two very different contexts. On one hand, there's a server running the dashboard[^2], where Tokio and the full standard library are available and life is good. On the other, I want to run things on the router itself, which has maybe 16MB of storage and where everything has to be statically linked. I'm already doing this, actually, a tiny `scratch` Docker image with a statically linked binary that uses the library...but that's another post.

Writing the library twice, once for Tokio and once for whatever fits on the router, is not happening. I'm lazy. Productively lazy.

This is where sans-io comes in.

## sans-io

The idea is simple: your protocol logic doesn't do any I/O. None. No sockets, no async, no runtime dependency. You hand it bytes, you get events and bytes to send back out. The actual networking (the "read bytes from TCP and write bytes to TCP" part) happens in a thin adapter layer that you write separately for each runtime you care about.

The concept came from the [Python community](https://sans-io.readthedocs.io/) around 2016 (Cory Benfield's [PyCon talk](https://www.youtube.com/watch?v=7cC3_jGwl_U) is a good watch). In Rust, [quinn-proto](https://github.com/quinn-rs/quinn/tree/main/quinn-proto) (QUIC) and [str0m](https://github.com/algesten/str0m) (WebRTC) follow this pattern. Thomas Eizinger wrote a [really good post](https://www.firezone.dev/blog/sans-io) about it for Firezone if you want the deep theory.

Most of those examples are UDP protocols though. MikroTik's API is TCP, stream-oriented, with framing and partial reads and all the fun that comes with that. Slightly different vibe, same idea.

## the wire protocol, briefly

MikroTik's protocol works like this: each "word" is a variable-length integer prefix (1 to 5 bytes depending on the length) followed by the content bytes. A "sentence" is a bunch of words terminated by a zero-length word (just `0x00`). There are a few word types:

- commands: `/interface/print`, `/system/resource/print`
- attributes: `=name=ether1`, `=disabled=no`
- tags: `.tag=<some-uuid>` for multiplexing
- replies: `!re` (data), `!done` (finished), `!trap` (error), `!fatal` (you're dead)

You can have multiple commands in flight at once, responses come back interleaved, and you match them by tag. It's like HTTP/2 multiplexing but more... artisanal[^3].

The documentation describes all of this in roughly the same level of detail I just did. Most of the things I figured out by staring at Wireshark dumps.

## the architecture

The workspace has three crates:

```text
┌─────────────────────────────────────────────────────┐
│  mikrotik-proto (sans-io, #![no_std])               │
│                                                     │
│  codec (response parsing)                           │
│  command builder                                    │
│  connection state machine (multiplexing)            │
│  handshake (typestate login flow)                   │
└─────────────────────────────────────────────────────┘
         ▲ receive(&[u8])    │ poll_transmit()
         │                   │ poll_event()
         │                   ▼
┌─────────────────────────────────────────────────────┐
│  mikrotik-tokio      OR       mikrotik-embassy      │
│  (Tokio adapter)              (Embassy, no_std)     │
└─────────────────────────────────────────────────────┘
```

The contract between the protocol core and any adapter is four methods:

```rust
// feed raw bytes from the network
conn.receive(&bytes)?;

// get parsed protocol events out
while let Some(event) = conn.poll_event() {
    // Event::Reply, Event::Done, Event::Trap, Event::Fatal, ...
}

// queue a command to send
let tag = conn.send_command(cmd)?;

// get raw bytes to write to the network
while let Some(transmit) = conn.poll_transmit() {
    // write transmit.data to your socket/transport/whatever
}
```

The entire state of the protocol lives in five fields:

```rust
pub struct Connection {
    state: State,                          // Active or Dead
    recv_buf: Vec<u8>,                     // partial data from the network
    in_flight: HashMap<Tag, CommandState>, // commands we're waiting on
    events: VecDeque<Event>,               // events ready for the application
    outbound: VecDeque<Transmit>,          // bytes ready to send
}
```

No sockets, no runtime. Just data structures and methods that shuffle bytes between queues. The adapter's only job is to connect those queues to real I/O.

## typestate: making wrong code not compile

Before you can send commands, you have to log in. I could enforce this at runtime with an `if !authenticated { return Err(...) }` check. But this is Rust, and I'm extra :nail_care:

The `Handshaking` type has `receive()` and `poll_transmit()` but no `send_command()`. The method doesn't exist on the type. You call `advance()`, which *consumes self* and returns either `Pending(Handshaking)` (not done yet, keep feeding it data) or `Complete(Authenticated)` (you're in). Only `Authenticated` gives you access to the `Connection`.

```rust
// handshake.rs (simplified)
pub struct Handshaking {
    inner: Connection,
    login_tag: Tag,
}

pub struct Authenticated {
    inner: Connection,
}

pub enum LoginProgress {
    Pending(Handshaking),
    Complete(Authenticated),
}
```

The login loop in both adapters looks almost identical:

```rust
let mut hs = Handshaking::new(username, password)?;

// flush the login command to the wire
while let Some(transmit) = hs.poll_transmit() {
    stream.write_all(&transmit.data).await?;
}

// read until login completes
let conn = loop {
    let n = stream.read(&mut buf).await?;
    hs.receive(&buf[..n])?;

    while let Some(transmit) = hs.poll_transmit() {
        stream.write_all(&transmit.data).await?;
    }

    match hs.advance()? {
        LoginProgress::Pending(h) => hs = h,
        LoginProgress::Complete(auth) => break auth.into_connection(),
    }
};
// conn: Connection — now you can send_command()
```

You pattern match the result and either keep going or transition. There's no way to accidentally call `send_command()` on a connection that hasn't authenticated, the compiler won't let you. Nice party trick.

## two adapters, one protocol

This is where the sans-io thing pays off.

**Tokio** spawns a background actor task. The user-facing `MikrotikDevice` is just a `mpsc::Sender` (cheap to clone, `Send + Sync`, share it across tasks, go wild). Each `send_command()` creates a dedicated `mpsc::channel` for that command's responses and hands back the receiver. The actor demultiplexes incoming events by tag and routes them to the right channel.

The fun bit: if you drop the receiver (say, you don't care about a long-running `/tool/torch` command anymore), the actor detects the failed `try_send` and automatically sends `/cancel` to the router. RAII cancellation. [Just drop the thing](https://www.youtube.com/watch?v=tMe_5gVeRno).

```rust
// tokio actor event loop (simplified)
while !shutdown {
    // always flush before selecting
    while let Some(transmit) = conn.poll_transmit() {
        wr.write_all(&transmit.data).await?;
    }

    tokio::select! {
        biased; // commands first, prevents starvation
        msg = cmd_rx.recv() => {
            // conn.send_command(...)
            // store the response sender in a HashMap<Tag, Sender>
        }
        result = rd.read(&mut buf) => {
            conn.receive(&buf[..n])?;
            while let Some(event) = conn.poll_event() {
                // route event to the right per-command channel by tag
            }
        }
    }
}
```

**Embassy** is very different. `no_std`, no heap for channels, constrained everything. Instead of an actor with per-command channels, it's a single `async fn run()` that takes statically-allocated channels as parameters. All events go to one shared channel and the consumer filters by tag. Stack buffers instead of heap. `embassy_futures::select()` instead of `tokio::select!`.

```rust
// embassy event loop (simplified)
loop {
    flush_transmits(&mut conn, transport).await?;

    match select(cmd_rx.receive(), transport.read(&mut buf)).await {
        Either::First(command) => {
            conn.send_command(command)?;
        }
        Either::Second(result) => {
            conn.receive(&buf[..n])?;
            while let Some(event) = conn.poll_event() {
                let _ = evt_tx.try_send(event); // best-effort
            }
        }
    }
}
```

Squint at them. Same `Connection`, same `receive`/`poll_event`/`send_command`/`poll_transmit` dance, different I/O around it.

## testing

This is honestly where I think sans-io earns its keep the most.

The protocol core is pure sync Rust. No `#[tokio::test]`, no runtime, nothing. `#[test]`, construct a `Connection`, shove some bytes into `receive()`, assert on what comes out of `poll_event()`. I can feed data one byte at a time to prove incremental parsing works. I can throw random bytes at it with [proptest](https://github.com/proptest-rs/proptest) and assert it never panics.

```rust
#[test]
fn test_partial_receive() {
    let mut conn = Connection::new();
    let cmd = CommandBuilder::new().command("/test").build();
    let tag = conn.send_command(cmd).unwrap();
    while conn.poll_transmit().is_some() {}

    let wire = build_done(tag);

    // feed one byte at a time
    for &byte in &wire {
        conn.receive(&[byte]).unwrap();
    }

    match conn.poll_event().unwrap() {
        Event::Done { tag: t } => assert_eq!(t, tag),
        other => panic!("expected Done, got {other:?}"),
    }
}
```

The adapter tests spin up mock TCP servers that speak the MikroTik wire protocol, which is useful too, but by the time I'm testing the adapter the protocol logic is already done. The adapter test is really just "does the plumbing work", not "does the protocol parsing work".

There's also a neat trick for testing the Embassy adapter: `embedded_io_adapters::FromTokio` wraps a Tokio `TcpStream` as `embedded_io_async::Read + Write`, so you test your `no_std` adapter code on your laptop with Tokio providing the transport. Again, great news for a lazy person.

## was it worth it

More upfront work than just writing a Tokio client? Yes.

You write manual state machines in the core instead of leaning on async/await. The `receive -> poll_event -> flush -> select` dance is something you have to get right, and if you forget to flush transmits before selecting, things stall in ways that aren't immediately obvious[^4].

Honestly though, even if you don't care about multiple runtimes, do it for the testing. Being able to `#[test]` your entire protocol logic with zero async machinery, feed it garbage bytes with proptest and know it won't panic, run the whole suite in under a second... that alone is worth the pain of writing state machines by hand. I went back to a Tokio-coupled protocol parser recently for something unrelated and the difference in how fast you can iterate is night and day. Sans-io tests are just so much nicer to work with that I'd pick this approach again even if Tokio was the only runtime I ever planned to support.

## links

- [mikrotik-rs on GitHub](https://github.com/ferrohd/mikrotik-rs)
- [mikrotik-rs on crates.io](https://crates.io/crates/mikrotik-rs)
- Thomas Eizinger's [Sans-IO post for Firezone](https://www.firezone.dev/blog/sans-io)
- [sans-io.readthedocs.io](https://sans-io.readthedocs.io/)
- [quinn-proto](https://github.com/quinn-rs/quinn/tree/main/quinn-proto), [str0m](https://github.com/algesten/str0m)

[^1]: I'm not being dramatic. There's a "Protocol" section, a "Command description" section with maybe four commands documented, and a Python example. That's your SDK. Good luck.

[^2]: A Unifi-like dashboard for MikroTik routers. It exists, it works, I'll write about it eventually.

[^3]: This is a compliment. I think.

[^4]: Ask me how I know.
