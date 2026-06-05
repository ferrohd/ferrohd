+++
title = "typestate bowling, or making gutter balls a type error"
date = 2026-06-01
description = "I built a bowling scoring engine in Rust where the compiler won't let you roll after the game is over."
[taxonomies]
tags = ["rust", "typestate", "bowling"]
+++

My friend Michael got me into bowling a while back. I wasn't particularly good at it[^1], but something about the sport stuck. The geometry, the scoring, the inexplicable satisfaction of watching pins scatter. Recently, he gifted me a bowling ball. A proper one. A Storm, red and pink, and it smells like Red Hot Cinnamon because apparently bowling balls have *odours* now. I did not know this was a thing. I still don't know why it's a thing. But it's mine and I love it.

<!-- more -->

![My Storm bowling ball, red and pink, smelling vaguely of cinnamon](/typestate-bowling/bowling-ball.avif)

Anyway, with the ball came more bowling, and with more bowling came a personal best of 144, which I'm unreasonably proud of.

![My personal best: 144](/typestate-bowling/scoreboard.avif)

And with more bowling came the inevitable: "I wonder if I could model this in Rust."

So I built [bowling](https://github.com/ferrohd/bowling). It was originally called `bowling-rs`, but that name was already taken on crates.io. The `bowling` crate belonged to [hexjelly](https://github.com/hexjelly) and hadn't been updated in 8 years, so I reached out and they kindly transferred ownership to me.

## the scoring problem

Bowling scoring is deceptively annoying. On the surface it's just "knock pins down, add them up", but then strikes give you bonus from the next *two* balls, spares from the next *one*, the 10th frame has fill balls, and suddenly you're tracking lookahead across frame boundaries and your `match` arms are multiplying like rabbits.

Most scoring implementations I've seen handle this with runtime checks. An `if game_is_over { return Err(...) }` here, an `assert!(frame <= 10)` there. It works. But this is Rust, and I thought it'd be fun to see how many of those invariants I could push into the type system instead.

The goal: **make illegal states unrepresentable**. A completed game shouldn't *have* a `roll()` method. A frame number shouldn't be able to be zero. A builder shouldn't let you create a game with no players. If you can express the wrong thing, eventually someone will[^2].

## the typestate pattern

The core idea is: encode state in the type system, and make transitions consume `self` to produce a new type. You've seen it in `std`. A `File` that's been closed doesn't have `read()` because the file handle is gone, not because there's a runtime check.

For bowling, the game has two phases: you're either still rolling, or you're done.

```rust
pub trait GamePhase<R: Ruleset>: std::fmt::Debug {
    /// The per-phase data stored in the game.
    type Live: std::fmt::Debug;
}

#[derive(Debug)]
pub struct AwaitingRoll;

#[derive(Debug)]
pub struct Complete;

impl<R: Ruleset> GamePhase<R> for AwaitingRoll {
    type Live = ActiveState<R>;
}

impl<R: Ruleset> GamePhase<R> for Complete {
    type Live = ();
}
```

The `Game` struct carries its phase as a type parameter:

```rust
pub struct Game<R: Ruleset, P: GamePhase<R>> {
    competitors: Vec<Competitor>,
    live: P::Live,
}
```

The interesting bit is the associated type `Live`. When the game is `AwaitingRoll`, `live` is an `ActiveState<R>` (the turn cursor, the current frame, everything you need to keep playing). When the game is `Complete`, `live` is `()`. Not `None`, not a dead field, literally the unit type. The data is structurally absent.

`roll()` exists only on `Game<R, AwaitingRoll>` and returns a `Progress`:

```rust
pub enum Progress<R: Ruleset> {
    AwaitingRoll(Game<R, AwaitingRoll>),
    Complete(Game<R, Complete>),
}
```

You pattern match, and either keep rolling or you're done. If you try to call `roll()` on a `Game<R, Complete>`, the method simply doesn't exist on the type, so the compiler rejects it:

```
error[E0599]: no method named `roll_count` found for struct
  `Game<TenPin, Complete>` in the current scope
```

Which is great! But it raises a question: how do you *test* that?

## testing code that shouldn't compile

This was new to me. I'd been writing typestate-heavy code for this project and at some point I thought "okay, the whole point is that misuse is a compile error, not a runtime error...but how do I verify that in CI?" I can't write a `#[test]` for code that doesn't compile. That's the whole point. If it compiles, the test is wrong. If it doesn't compile, `cargo test` never even gets to run it.

I sat with this for a bit. I had these invariants I was really proud of, and no way to make sure they kept working across refactors. You could accidentally widen an `impl` block, or make a method generic in a way that leaks it to the wrong phase, and the only thing catching it would be "hope someone notices".

Then I found [trybuild](https://github.com/dtolnay/trybuild).

You write little `.rs` files that contain the code that *should not compile*. You put them in a `tests/ui/` directory. trybuild compiles each one, and the test passes if and only if the compilation *fails* with the expected error message. You even check in the `.stderr` file so you can assert on the exact compiler output.

So for "you can't roll on a completed game", the test file is just:

```rust
use bowling::prelude::*;

fn main() {
    let game: Game<TenPin, Complete> = todo!();
    let _ = game.roll_count(5);
}
```

That's it. trybuild compiles it, sees the `E0599` ("method not found"), checks it against the expected `.stderr`, and the test passes. If I ever accidentally make `roll_count` available on `Complete` (say, by putting it in the wrong `impl` block during a refactor), this file would *successfully compile*, and trybuild would *fail* the test. The absence of a compile error becomes the bug.

There's another one for the builder:

```rust
use bowling::prelude::*;

fn main() {
    let _builder = GameBuilder::<TenPin>::new();
}
```

Tries to call `new()` with no arguments, no player name. The compiler says "this function takes 1 argument but 0 arguments were supplied". Test passes.

I think what I like about this is that it inverts the usual relationship with the compiler. Normally a test says "this code works". Here the test says "this code *doesn't* work, and that's correct, and if someone's refactor makes it suddenly valid, CI catches it." I've never had a workflow where I was actively testing *for* compile errors before this project, and it's changed how I think about typestate APIs in general[^3].

## frames have phases too

The game-level typestate is nice, but the frame-level one is where it gets interesting. Each frame is a state machine: ball one, ball two (and ball three for some rulesets), with transitions that depend on what happened.

```rust
pub struct RegularFrame<R: Ruleset, P: FramePhase> {
    number: FrameNumber,
    phase: P,
    _ruleset: PhantomData<R>,
}
```

The phase structs carry exactly the data they need:

```rust
pub struct BallOne   { standing: PinSet }
pub struct BallTwo   { standing: PinSet, rolls: Vec<Roll> }
pub struct BallThree { standing: PinSet, rolls: Vec<Roll> }
```

`BallOne` doesn't carry a `Vec<Roll>` because there are no rolls yet. `BallTwo` does because we need to remember ball one's delivery. Each phase has a `roll()` method that consumes `self` and returns a precise outcome enum:

```rust
pub enum RegAfterOne<R: Ruleset> {
    Continue(RegularFrame<R, BallTwo>),
    Done(ScoredFrame),  // strike
}

pub enum RegAfterTwo<R: Ruleset> {
    Continue(RegularFrame<R, BallThree>),
    Done(ScoredFrame),  // spare or open
}
```

The variants cover exactly the reachable states. `RegAfterOne` is either "continue to ball two" or "done, that was a strike". There's no "frame is already complete" variant because if you're in `BallOne`, the frame can't already be complete. That's what the type says. No `unreachable!()` arms, no `_ => panic!()`.

Here's ball one's transition:

```rust
impl<R: Ruleset> RegularFrame<R, BallOne> {
    pub fn roll(self, delivery: Roll) -> Result<RegAfterOne<R>, BowlingError> {
        validate_delivery(self.phase.standing, delivery)?;

        let new_standing = self.phase.standing - delivery.knocked();
        let mut rolls = Vec::with_capacity(R::BALLS_PER_FRAME as usize);
        rolls.push(delivery);

        if new_standing.is_empty() {
            return Ok(RegAfterOne::Done(finish_regular(
                self.number, rolls, FrameKind::Strike,
            )));
        }

        Ok(RegAfterOne::Continue(RegularFrame {
            number: self.number,
            phase: BallTwo { standing: new_standing, rolls },
            _ruleset: PhantomData,
        }))
    }
}
```

If all pins are down, it's a strike, frame done. Otherwise, the frame advances to `BallTwo` and the old `BallOne` is gone, consumed by the transition. You can't accidentally roll ball one twice[^4].

## the runtime bridge

There's a problem though. The game needs to *hold* the current frame, but the frame's type changes with every delivery. You can't have a struct field whose type changes at runtime...that's not how types work.

The solution is a runtime enum that wraps the typestate core:

```rust
enum FrameState<R: Ruleset> {
    RegularBallOne(RegularFrame<R, BallOne>),
    RegularBallTwo(RegularFrame<R, BallTwo>),
    RegularBallThree(RegularFrame<R, BallThree>),
    FinalBallOne(FinalFrame<R, BallOne>),
    FinalBallTwo(FinalFrame<R, BallTwo>),
    FinalBallThree(FinalFrame<R, BallThree>),
    FinalFillTwo(FinalFrame<R, FinalFillTwo>),
    FinalFillThree(FinalFrame<R, FinalFillThree>),
}
```

The game dispatches to the right variant at runtime, but each individual transition is still type-checked. The outer `match` routes to the inner typestate, and the inner typestate handles the actual logic with exhaustive matching. No `unreachable!()` anywhere.

## ten pins in sixteen bits

A bowling lane has at most 16 pins[^5]. A `u16` has 16 bits. So I made each bit a pin: bit 0 is the head pin, bit 1 is pin 2, and so on. If the bit is `1`, the pin is standing. If it's `0`, it's been knocked down.

```rust
#[derive(Clone, Copy, PartialEq, Eq, Hash, Default)]
pub struct PinSet(u16);
```

One `u16`, and it turns out you can build a surprisingly complete set-algebra on top of it.

A full rack of ten pins is the first 10 bits set: `0b0000001111111111`. You can construct it at compile time with a const generic:

```rust
pub const fn full<const N: u8>() -> Self {
    assert!(N <= 16, "pin count exceeds maximum of 16");
    if N == 16 { Self(u16::MAX) }
    else { Self((1u16 << N) - 1) }
}
```

`PinSet::full::<10>()` evaluates at compile time. The `assert!` fires at compile time too, if you try something like `PinSet::full::<17>()`.

Counting how many pins are standing is just `count_ones()`, which maps directly to `POPCNT` on x86. Figuring out which pins are left after a delivery is a bitwise AND-NOT:

```rust
pub const fn count(self) -> u8 {
    self.0.count_ones() as u8
}

pub const fn difference(self, other: Self) -> Self {
    Self(self.0 & !other.0)
}
```

With operator overloads, `standing - knocked` gives you the remaining pins. `a | b` is union, `a & b` is intersection, `!a` is complement. It ends up reading like set notation, which is nice because that's basically what it is.

The iterator is the part I find particularly neat. To walk through which pins are in the set, the naive approach is to check all 16 positions. But `trailing_zeros()` gives you the index of the lowest set bit directly (there's a CPU instruction for that, `TZCNT`), and `n &= n - 1` clears it. So you just hop from set bit to set bit:

```rust
fn next(&mut self) -> Option<u8> {
    if self.0 == 0 { None }
    else {
        let idx = self.0.trailing_zeros() as u8;
        self.0 &= self.0 - 1;  // clear lowest set bit
        Some(idx)
    }
}
```

If 3 pins are standing, this loops 3 times, not 16. It only visits pins that exist.

The thing I like about `PinSet` is that none of this leaks to the caller. You call `standing.contains(3)` and `standing.count()` and `standing - knocked` and it just works. Underneath it's all bit manipulation and single CPU instructions, but from the outside it's just a set of bowling pins. And because it's `Copy` and fits in a register, there's no allocation overhead either. It's one of those cases where "zero-cost abstraction" actually means "this is literally a `u16`", not "trust me, the optimiser will figure it out".

## split detection, or BFS with two integers

This is my favourite part of the whole project.

In ten-pin bowling, a *split* is when the head pin has been knocked down but two or more pins remain standing with a gap between them. The 7-10 split is the famous one: the two back corner pins, nothing in between, basically impossible to pick up. There are loads of others too (the 4-6-7-10 "Big Four", the 3-6-7-10, etc.).

The question is how to detect this programmatically. If you think about the pin layout as a graph...

```text
        7  8  9  10       (back row)
          4  5  6         (third row)
            2  3          (second row)
              1           (head pin)
```

...where each pin is a node, and edges connect physically adjacent pins, then a split is when the standing pins form more than one connected component. You can't walk from one group of standing pins to another through a chain of neighbours. There's a gap between them.

Checking graph connectivity is textbook BFS: start at any node, visit all reachable neighbours, then *their* neighbours, and so on. If you've visited everything by the end, it's connected. If some nodes are left over, it's not. Split.

The ten-pin adjacency is 18 edges in a static array:

```rust
pub static TEN_PIN_GEOMETRY: PinGeometry = PinGeometry::new(
    10,
    &[
        (0, 1), (0, 2),         // head pin neighbours
        (1, 2),                  // row 2
        (1, 3), (1, 4),         // row 2 ↔ row 3
        (2, 4), (2, 5),
        (3, 4), (4, 5),         // row 3
        (3, 6), (3, 7),         // row 3 ↔ row 4
        (4, 7), (4, 8),
        (5, 8), (5, 9),
        (6, 7), (7, 8), (8, 9), // row 4
    ],
);
```

Now, BFS normally needs a visited set and a queue. You'd typically reach for a `HashSet` and a `VecDeque`. But our nodes are pin indices 0 through 9, and we already have a data structure that represents subsets of those as single integers...

So the visited set is a `PinSet`. The queue is a `PinSet`. The entire BFS state is two `u16`s:

```rust
pub fn is_split(&self, standing: PinSet) -> bool {
    if standing.contains(0) { return false; }  // head pin up, never a split
    if standing.count() < 2 { return false; }  // need 2+ pins

    let mut visited = PinSet::EMPTY;
    let Some(start) = standing.iter().next() else { return false; };
    let mut queue = PinSet::EMPTY.insert(start);
    visited = visited.insert(start);

    while let Some(current) = queue.iter().next() {
        queue = queue.remove(current);

        for &(a, b) in self.adjacency {
            let neighbor = if a == current { b }
                           else if b == current { a }
                           else { continue };
            if standing.contains(neighbor) && !visited.contains(neighbor) {
                visited = visited.insert(neighbor);
                queue = queue.insert(neighbor);
            }
        }
    }

    // If we haven't visited all standing pins, they're disconnected
    (standing - visited).count() > 0
}
```

`standing.contains(neighbor)` is a bitmask check. `visited.insert(neighbor)` is a bitwise OR. `queue.remove(current)` is an AND-NOT. At the end, `standing - visited` tells you if any pins were unreachable, and `count_ones()` tells you how many. No `HashSet`, no `VecDeque`, no allocation. It all fits in registers.

I built `PinSet` originally just as a convenient way to track which pins were standing. Split detection came later, and when I sat down to implement it I realised the data structure I already had was exactly what BFS needed over a small graph. The visited set, the queue, the membership checks, the "subtract to find what's left" at the end...it was all already there, I just had to use it. I didn't plan for that, but it worked out in a way that felt really satisfying[^6].

## not just ten-pin

The whole engine is generic over a `Ruleset` trait:

```rust
pub trait Ruleset: Sized + Clone + std::fmt::Debug + 'static {
    const PIN_COUNT: u8;
    const FRAME_COUNT: u8;
    const BALLS_PER_FRAME: u8;
    const DEADWOOD: DeadwoodPolicy;
    const BONUS: BonusScheme;
    const ALL_DOWN_IS_SPARE: bool;

    fn geometry() -> Option<&'static PinGeometry>;
    fn name() -> &'static str;
    fn full_rack() -> PinSet { PinSet::range(0, Self::PIN_COUNT) }
}
```

Everything is associated constants, so `Game<TenPin, P>` and `Game<Duckpin, P>` monomorphize into entirely separate code paths at compile time.

Three rulesets ship out of the box: **ten-pin** (the one everyone knows), **candlepin** (3 balls per frame, deadwood stays on the lane, clearing all pins counts as a spare), and **duckpin** (3 balls, but clearing all pins with all 3 balls is just a flat 10, no bonus). That last distinction is controlled by a single boolean:

```rust
if new_standing.is_empty() {
    let kind = if R::ALL_DOWN_IS_SPARE {
        FrameKind::Spare    // candlepin: earns bonus
    } else {
        FrameKind::AllDown  // duckpin: flat score
    };
}
```

I spent longer than I'd like to admit reading obscure bowling federation rulebooks to get these edge cases right[^7].

## the 10th frame

The 10th frame is special in bowling. Strikes and spares earn fill balls so the bonus can be calculated immediately, which means the frame can have up to three deliveries with pin resets in between. It's a different state machine entirely, modelled as `FinalFrame<R, P>` with its own phases:

```text
BallOne
  ├─ strike → FinalFillTwo (pins reset, 2 fill balls)
  │              ├─ strike again → FinalFillThree (pins reset)
  │              └─ partial → FinalFillThree (same pins)
  └─ partial → BallTwo
                 ├─ spare → FinalFillThree (pins reset, 1 fill ball)
                 └─ open → ScoredFrame (done)
```

The fill phases carry a `FirstBallOutcome` enum so the scored frame knows whether to label the result as a strike or a spare:

```rust
pub enum FirstBallOutcome { Strike, NonStrike }
```

This was the gnarliest part to get right. The 10th frame is one of those things where every bowling implementation has a slightly different interpretation and at least one wrong edge case. Having the typestate machine enumerate every possible path made it much harder to miss one[^8].

## using it

The API is builder-based, and the builder requires at least one player name in its constructor (no zero-player games):

```rust
let game = GameBuilder::<TenPin>::new("Alice").unwrap().build();
let mut progress = Progress::AwaitingRoll(game);

loop {
    match progress {
        Progress::AwaitingRoll(g) => {
            progress = g.roll_count(10).unwrap(); // strike!
        }
        Progress::Complete(g) => {
            println!("{}", g.scoreboard(0));
            break;
        }
    }
}
```

Twelve strikes. Score: 300. If only it were this easy at the alley.

Multiplayer turn rotation is automatic. You just keep feeding rolls and the game handles whose turn it is. `current_player()`, `current_frame_number()`, `current_ball_number()` tell you the state if you need it for rendering.

## was it worth it

More work than a struct with an `if frame > 10` check? Yeah.

But the resulting API is hard to misuse in ways that I find satisfying. The compiler catches things that would otherwise be unit tests, and the things it doesn't catch, [proptest](https://github.com/proptest-rs/proptest) handles with random roll sequences across all three rulesets, asserting scores never exceed 300, games always terminate, and cumulatives always add up.

Honestly though, the real motivation was that I'd been bowling more, and I wanted to understand the scoring better, and I thought "I could model this"...and then the typestate rabbit hole opened up and here we are, 2000 lines of Rust later, with a generic multi-ruleset bowling engine that handles splits, fouls, deadwood policies, and candlepin scoring.

All because a friend handed me a cinnamon-scented bowling ball.

## links

- [bowling on GitHub](https://github.com/ferrohd/bowling)
- [bowling on crates.io](https://crates.io/crates/bowling)
- [trybuild](https://github.com/dtolnay/trybuild), compile-fail testing
- [proptest](https://github.com/proptest-rs/proptest), property-based testing

[^1]: I am still not particularly good at it.

[^2]: Murphy's Law, but for APIs.

[^3]: I now have a pavlovian urge to add a trybuild test every time I write an `impl` block that's supposed to be phase-restricted. It's a problem. Or maybe it's good engineering. I choose to believe the latter.

[^4]: I mean, you *could* construct a new `BallOne` manually, but at that point you're actively fighting the type system and deserve whatever happens.

[^5]: No standard bowling variant exceeds 10, but I wanted headroom. Engineer brain.

[^6]: Doesn't happen often enough, the data structure you already have being exactly the one you needed.

[^7]: Did you know the United States Bowling Congress has a 67-page rulebook? And that candlepin has its *own* governing body? I know these things now. I didn't ask to know them.

[^8]: The alternative was a 40-arm `match` statement with at least three `unreachable!()` annotations and a prayer. I'll take the typestate, thanks.
