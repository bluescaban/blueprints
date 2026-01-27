# Extracted Nodes from BluePrints

> File Key: `HYxtgE7EARWuvTskijY7xa`
> Extracted: 2026-01-27T02:15:29.691Z
> Node Count: 66

---

## PERSONAS

### STICKY: 21:447
> Color: #a8daff

```
P: Casual Listener — wants a fun, low-pressure way to sing along without needing talent

```

### STICKY: 22:385
> Color: #a8daff

```
P: Karaoke Host — wants to start a session fast and invite friends with minimal setup

```

### STICKY: 22:392
> Color: #a8daff

```
P: Friend Participant — wants to join instantly from an invite link and know what to do next

```

### STICKY: 22:396
> Color: #a8daff

```
P: Competitive Singer — wants scoring, stats, and bragging rights (optional mode)

```

### STICKY: 22:400
> Color: #a8daff

```
P: Social Sharer — wants clips/screenshots/results to share after the session

```

### STICKY: 22:404
> Color: #a8daff

```
P: Privacy-Conscious User — wants control over microphone use and recording, with clear consent

```

### STICKY: 29:499
> Color: #a8daff

```
Sticky
```

## GOALS

### STICKY: 21:454
> Color: #a8daff

```
G: Let users sing along with synchronized lyrics for any supported song

```

### STICKY: 22:408
> Color: #a8daff

```
G: Support both Solo Karaoke and With Friends Karaoke
```

### STICKY: 22:415
> Color: #a8daff

```
G: Minimize time-to-first-lyric (fast entry from a song page)

```

### STICKY: 22:419
> Color: #a8daff

```
G: Make joining a friend session effortless via link

```

### STICKY: 22:423
> Color: #a8daff

```
G: Provide a delightful “session” feeling (lobby, ready states, shared experience)

```

### STICKY: 22:427
> Color: #a8daff

```
G: Keep the feature safe, respectful, and privacy-first

```

### STICKY: 29:501
> Color: #a8daff

```
Sticky
```

## REQUIREMENTS

### STICKY: 21:461
> Color: #a8daff

```
R: Karaoke mode must display real-time synchronized lyrics with highlighting

```

### STICKY: 28:431
> Color: #a8daff

```
R: Karaoke mode must support Solo mode

```

### STICKY: 28:438
> Color: #a8daff

```
R: Karaoke mode must support With Friends mode (real-time session)
```

### STICKY: 28:445
> Color: #a8daff

```
R: Host can create a karaoke session from a song

```

### STICKY: 28:449
> Color: #a8daff

```
R: Host can invite friends using a shareable link

```

### STICKY: 28:453
> Color: #a8daff

```
R: Participant can join session from invite link

```

### STICKY: 28:457
> Color: #a8daff

```
R: Lobby must show who joined and who is ready

```

### STICKY: 28:461
> Color: #a8daff

```
R: Session must have a clear Start action controlled by the host

```

### STICKY: 28:465
> Color: #a8daff

```
R: Users can mute/unmute themselves during the session

```

### STICKY: 28:469
> Color: #a8daff

```
R: Users can leave session at any time without breaking the session

```

### STICKY: 28:473
> Color: #a8daff

```
R: App must request microphone permission only when needed and explain why

```

### STICKY: 28:477
> Color: #a8daff

```
R: Karaoke should be usable even if mic permission is denied (lyrics-only mode)

```

### STICKY: 29:552
> Color: #a8daff

```
R: App must handle network latency gracefully (allow slight desync + reconnection)


```

### STICKY: 29:562
> Color: #a8daff

```
R: App must show clear feedback for loading, syncing, and connection issues

```

### STICKY: 29:569
> Color: #a8daff

```
R: Competitive scoring mode is optional and can be enabled per session


```

### STICKY: 29:503
> Color: #a8daff

```
Sticky
```

## USER FLOWNOTES

### STICKY: 21:468
> Color: #a8daff

```
S: User opens a song detail page

```

### STICKY: 29:576
> Color: #a8daff

```
S: User taps a new action called “Karaoke”

```

### STICKY: 29:583
> Color: #a8daff

```
S: App shows Karaoke setup screen with mode selection (Solo / With Friends)

```

### STICKY: 29:587
> Color: #a8daff

```
S: If Solo, user starts immediately and sees lyrics sync with playback

```

### STICKY: 29:591
> Color: #a8daff

```
S: If With Friends, user becomes Host and a lobby is created

```

### STICKY: 29:595
> Color: #a8daff

```
S: Lobby shows session status and invite button

```

### STICKY: 29:599
> Color: #a8daff

```
S: Host sends invite link via share sheet

```

### STICKY: 29:603
> Color: #a8daff

```
S: Friend opens invite link and joins as Participant

```

### STICKY: 29:607
> Color: #a8daff

```
S: Participants see lobby with song + readiness state

```

### STICKY: 29:611
> Color: #a8daff

```
S: Host taps Start to begin karaoke session

```

### STICKY: 29:615
> Color: #a8daff

```
S: During session, lyrics highlight and users can mute/unmute or leave

```

### STICKY: 29:619
> Color: #a8daff

```
S: At end, users see a summary screen with share / replay / new song options

```

### STICKY: 29:505
> Color: #a8daff

```
Sticky
```

## EDGE CASES

### STICKY: 21:475
> Color: #a8daff

```
E: User joins session late (mid-song) — should sync to current lyric position

```

### STICKY: 30:632
> Color: #a8daff

```
E: Microphone permission denied — user can still continue in lyrics-only mode

```

### STICKY: 30:639
> Color: #a8daff

```
E: Host disconnects — session should either pause, transfer host, or end gracefully

```

### STICKY: 30:643
> Color: #a8daff

```
E: Participant disconnects — they should be able to rejoin quickly

```

### STICKY: 30:647
> Color: #a8daff

```
E: Bad network causes lyric desync — show “resync” option and continue playback

```

### STICKY: 30:651
> Color: #a8daff

```
E: Song unavailable in region — Karaoke entry should explain and offer alternatives

```

### STICKY: 30:655
> Color: #a8daff

```
E: Invite link expired or invalid — show friendly recovery path

```

### STICKY: 30:659
> Color: #a8daff

```
E: Too many participants — enforce a session cap and communicate why

```

### STICKY: 30:663
> Color: #a8daff

```
E: User receives a call/audio interruption — resume experience smoothly

```

### STICKY: 30:670
> Color: #a8daff

```
E: Abusive participant — allow report + leave + block actions

```

### STICKY: 29:507
> Color: #a8daff

```
Sticky
```

## OPEN QUESTIONS

### STICKY: 21:482
> Color: #a8daff

```
Q: Do we record audio at all, or is it a purely live sing-along experience?

```

### STICKY: 30:678
> Color: #a8daff

```
Q: Is With Friends playback truly synchronized or “best-effort” with tolerance?

```

### STICKY: 30:688
> Color: #a8daff

```
Q: Do we need a host at all times, or can sessions be hostless?

```

### STICKY: 30:692
> Color: #a8daff

```
Q: Do we support duets / rotating solo lines, or everyone sings everything?

```

### STICKY: 30:696
> Color: #a8daff

```
Q: Should sessions support video, or audio-only, or lyrics-only?

```

### STICKY: 30:700
> Color: #a8daff

```
Q: Do we support scoring in v1? If yes, what model and what feedback UI?

```

### STICKY: 30:704
> Color: #a8daff

```
Q: Where does Karaoke live in the Spotify IA (song page, now playing, search)?

```

### STICKY: 30:708
> Color: #a8daff

```
Q: How do we handle explicit lyrics / content controls in group sessions?

```

### STICKY: 30:712
> Color: #a8daff

```
Q: What is the max participant count for a good experience?

```

### STICKY: 29:509
> Color: #a8daff

```
Sticky
```

## CONTEXT

### STICKY: 21:117
> Color: #a8daff

```
CONTEXT:
Project: Spotify Karaoke
Client: Spotify
OutputSlug: spotify_karaoke
Version: v1
Date: 2026-01-26
Owner: Blue
Platform: Mobile (iOS + Android)
Goal: Sing along to songs solo or with friends
Constraints: Privacy-first, low friction entry, works with imperfect network

```

### STICKY: 29:511
> Color: #a8daff

```
Sticky
```
