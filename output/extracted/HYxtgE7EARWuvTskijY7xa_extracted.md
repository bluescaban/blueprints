# Extracted Nodes from BluePrints

> File Key: `HYxtgE7EARWuvTskijY7xa`
> Extracted: 2026-02-06T04:45:00.656Z
> Node Count: 68

---

## PERSONAS

### STICKY: 195:1671
> Color: #a8daff

```
P: Casual Listener - wants a low-pressure, no-judgment karaoke experience
```

### STICKY: 195:1672
> Color: #a8daff

```
P: Karaoke Host - wants to start a session fast and invite friends easily


```

### STICKY: 195:1673
> Color: #a8daff

```
P: Friend Participant - wants to join instantly and understand what to do next


```

### STICKY: 195:1674
> Color: #a8daff

```
P: Competitive Singer - wants scoring and performance feedback (optional)


```

### STICKY: 195:1675
> Color: #a8daff

```
P: Social Sharer - wants results or clips to share after a session


```

### STICKY: 195:1676
> Color: #a8daff

```
P: Privacy-Conscious User - wants control over mic usage and recording


```

## GOALS

### STICKY: 195:1678
> Color: #a8daff

```
G: Let users sing along with synchronized lyrics for any supported song

```

### STICKY: 195:1679
> Color: #a8daff

```
G: Support both Solo Karaoke and With Friends Karaoke
```

### STICKY: 195:1680
> Color: #a8daff

```
G: Minimize time-to-first-lyric (fast entry from a song page)

```

### STICKY: 195:1681
> Color: #a8daff

```
G: Make joining a friend session effortless via link

```

### STICKY: 195:1682
> Color: #a8daff

```
G: Provide a delightful “session” feeling (lobby, ready states, shared experience)

```

### STICKY: 195:1683
> Color: #a8daff

```
G: Keep the feature safe, respectful, and privacy-first

```

## REQUIREMENTS

### STICKY: 195:1685
> Color: #a8daff

```
R: Karaoke mode must display real-time synchronized lyrics with highlighting

```

### STICKY: 195:1686
> Color: #a8daff

```
R: Karaoke mode must support Solo mode

```

### STICKY: 195:1687
> Color: #a8daff

```
R: Karaoke mode must support With Friends mode (real-time session)
```

### STICKY: 195:1688
> Color: #a8daff

```
R: Host can create a karaoke session from a song

```

### STICKY: 195:1689
> Color: #a8daff

```
R: Host can invite friends using a shareable link

```

### STICKY: 195:1690
> Color: #a8daff

```
R: Participant can join session from invite link

```

### STICKY: 195:1691
> Color: #a8daff

```
R: Lobby must show who joined and who is ready

```

### STICKY: 195:1692
> Color: #a8daff

```
R: Session must have a clear Start action controlled by the host

```

### STICKY: 195:1693
> Color: #a8daff

```
R: Users can mute/unmute themselves during the session

```

### STICKY: 195:1694
> Color: #a8daff

```
R: Users can leave session at any time without breaking the session

```

### STICKY: 195:1695
> Color: #a8daff

```
R: App must request microphone permission only when needed and explain why

```

### STICKY: 195:1696
> Color: #a8daff

```
R: Karaoke should be usable even if mic permission is denied (lyrics-only mode)

```

### STICKY: 195:1697
> Color: #a8daff

```
R: App must handle network latency gracefully (allow slight desync + reconnection)


```

### STICKY: 195:1698
> Color: #a8daff

```
R: App must show clear feedback for loading, syncing, and connection issues

```

### STICKY: 195:1699
> Color: #a8daff

```
R: Competitive scoring mode is optional and can be enabled per session


```

## USER FLOW NOTES

### STICKY: 195:1701
> Color: #a8daff

```
S: User opens a song detail page

```

### STICKY: 195:1702
> Color: #a8daff

```
S: User taps a new action called “Karaoke”

```

### STICKY: 195:1703
> Color: #a8daff

```
S: App shows Karaoke setup screen with mode selection (Solo / With Friends)

```

### STICKY: 195:1704
> Color: #a8daff

```
S: If Solo, user starts immediately and sees lyrics sync with playback

```

### STICKY: 195:1705
> Color: #a8daff

```
S: If With Friends, user becomes Host and a lobby is created

```

### STICKY: 195:1706
> Color: #a8daff

```
S: Lobby shows session status and invite button

```

### STICKY: 195:1707
> Color: #a8daff

```
S: Host sends invite link via share sheet

```

### STICKY: 195:1708
> Color: #a8daff

```
S: Friend opens invite link and joins as Participant

```

### STICKY: 195:1709
> Color: #a8daff

```
S: Participants see lobby with song + readiness state

```

### STICKY: 195:1710
> Color: #a8daff

```
S: Host taps Start to begin karaoke session

```

### STICKY: 195:1711
> Color: #a8daff

```
S: During session, lyrics highlight and users can mute/unmute or leave

```

### STICKY: 195:1712
> Color: #a8daff

```
S: At end, users see a summary screen with share / replay / new song options

```

## EDGE CASES

### STICKY: 195:1714
> Color: #a8daff

```
EXIT: User joins session mid-song
SYS: Sync lyrics to current playback position

```

### STICKY: 195:1715
> Color: #a8daff

```
EXIT: Network interruption
SYS: Attempt resync and show connection status

```

### STICKY: 195:1716
> Color: #a8daff

```
EXIT: Host disconnects
SYS: Pause session or transfer host

```

### STICKY: 195:1717
> Color: #a8daff

```
EXIT: Participant disconnects
SYS: Allow quick rejoin

```

### STICKY: 195:1718
> Color: #a8daff

```
EXIT: Invite link expired
SYS: Show recovery message and exit

```

### STICKY: 195:1719
> Color: #a8daff

```
EXIT: Song unavailable in region
SYS: Explain limitation and suggest alternatives

```

### STICKY: 195:1720
> Color: #a8daff

```
EXIT: Invite link expired or invalid SYS: Show friendly recovery path

```

### STICKY: 195:1721
> Color: #a8daff

```
EXIT: Too many participants — 
SYS: Enforce a session cap and communicate why

```

### STICKY: 195:1722
> Color: #a8daff

```
EXIT: User receives a call/audio interruption
SYS: resume experience smoothly

```

### STICKY: 195:1723
> Color: #a8daff

```
EXIT: Abusive participant 
SYS: Allow report + leave + block actions

```

## ASSUMPTIONS

### STICKY: 195:1725
> Color: #a8daff

```
ASSUMPTION: Lyrics licensing allows karaoke-style display

```

### STICKY: 195:1726
> Color: #a8daff

```
ASSUMPTION: Small latency is acceptable in group sessions

```

## QUESTIONS

### STICKY: 195:1728
> Color: #a8daff

```
Q: Is audio recorded or purely live?

```

### STICKY: 195:1729
> Color: #a8daff

```
Q: Is group playback strict-sync or best-effort?

```

### STICKY: 195:1730
> Color: #a8daff

```
Q: Is a host required at all times?

```

### STICKY: 195:1731
> Color: #a8daff

```
Q: Do we support duets or rotating solos?

```

### STICKY: 195:1732
> Color: #a8daff

```
Q: Should sessions support video, or audio-only, or lyrics-only?

```

### STICKY: 195:1733
> Color: #a8daff

```
Q: Do we support scoring in v1? If yes, what model and what feedback UI?

```

### STICKY: 195:1734
> Color: #a8daff

```
Q: Where does Karaoke live in the Spotify IA (song page, now playing, search)?

```

### STICKY: 195:1735
> Color: #a8daff

```
Q: How do we handle explicit lyrics / content controls in group sessions?

```

### STICKY: 195:1736
> Color: #a8daff

```
Q: What is the max participant count for a good experience?

```

### STICKY: 195:1737
> Color: #a8daff

```
Q: What is the max participant count for a good experience?

```

## RISKS

### STICKY: 195:1739
> Color: #a8daff

```
RISK: Audio desync on low-end devices
```

### STICKY: 195:1740
> Color: #a8daff

```
RISK: Abuse in group sessions

```

### STICKY: 195:1741
> Color: #a8daff

```
RISK: Privacy concerns around microphone usage


```

## FLOW : SOLO KARAOKE

### STICKY: 195:1743
> Color: #b3efbd

```
F: Solo Karaoke
A: User

START: User initiates Solo Karaoke from a song

S: (S1) User opens a song detail page
S: (S2) User taps “Karaoke”
SYS: Evaluate Karaoke availability for the song

D: Is Karaoke supported for this song?
E: D1 -> S3 [label=Yes]
E: D1 -> END_EXIT [label=No]

S: (S3) User selects Solo Karaoke mode
SYS: Request microphone permission (just-in-time)

D: Is microphone permission granted?
E: D2 -> S4 [label=Yes]
E: D2 -> S5 [label=No]

S: (S4) Start Solo Karaoke with live lyrics + mic input
S: (S5) Start Solo Karaoke in lyrics-only mode

END: Solo Karaoke session completed
END: User exits Solo Karaoke early


```

## FLOW: HOST WITH FRIENDS

### STICKY: 195:1745
> Color: #b3efbd

```
F: Host With Friends
A: Host

START: Host initiates Karaoke with Friends from a song

S: (H1) Host taps “Karaoke”
S: (H2) Host selects “With Friends”
SYS: Create karaoke session and lobby

SYS: Request microphone permission (just-in-time)

D: Is microphone permission granted?
E: D3 -> H3 [label=Yes]
E: D3 -> H4 [label=No]

S: (H3) Host enters lobby with mic enabled
S: (H4) Host enters lobby in lyrics-only mode

S: (H5) Host shares invite link
SYS: Generate invite link

D: How does host invite friends?
E: D4 -> H6 [label=Share Sheet]
E: D4 -> H7 [label=Copy Link]

S: (H8) Host waits in lobby
SYS: Display joined participants and readiness state

D: Are participants ready?
E: D5 -> H9 [label=Yes]
E: D5 -> H8 [label=No]

S: (H9) Host starts Karaoke session
SYS: Sync lyrics and playback for all participants

END: Group Karaoke session completed
END: Host leaves or ends session

```

## FLOW: JOIN VIA INVITE LINK

### STICKY: 195:1747
> Color: #b3efbd

```
F: Join via Invite Link
A: Guest

START: Guest opens Karaoke invite link

SYS: Validate invite link

D: Is invite link valid?
E: D6 -> G1 [label=Yes]
E: D6 -> END_ERROR [label=No]

S: (G1) Guest joins lobby
SYS: Display song, participants, and session status

SYS: Request microphone permission (just-in-time)

D: Is microphone permission granted?
E: D7 -> G2 [label=Yes]
E: D7 -> G3 [label=No]

S: (G2) Guest joins with mic enabled
S: (G3) Guest joins in lyrics-only mode

D: Has host started the session?
E: D8 -> G4 [label=Yes]
E: D8 -> G1 [label=No]

S: (G4) Participate in karaoke session

END: Guest leaves session
END: Session ends


```

## CONTEXT

### STICKY: 195:1749
> Color: #a8daff

```
CTX: Project = Spotify Karaoke
CTX: Client = Spotify
CTX: OutputSlug = spotify_karaoke
CTX: Version = v1
CTX: Platform = Mobile (iOS, Android)
CTX: Owner = Blue

G: Enable users to sing along to songs solo or with friends
G: Provide a fast, low-friction entry into karaoke from a song
G: Preserve privacy and consent around microphone use
G: Support imperfect networks with graceful degradation

```
