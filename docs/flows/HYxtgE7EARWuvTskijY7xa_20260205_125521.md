# Flow: HYxtgE7EARWuvTskijY7xa

> Generated: 2026-02-05T20:55:21.905Z
> Grammar Version: 2.0.0

## Summary

### Goals
- Enable bite-sized live language practice sessions from a smart watch
- Allow users to quickly ask a tutor a question or practice a phrase
- Minimize time-to-connection with a tutor
- Support hands-free and glanceable interactions
- Allow seamless escalation from watch → phone when needed
- Respect privacy, consent, and recording transparency
- Practice a foreign language with a live tutor through quick, on-the-go interactions
- Enable users to get immediate, situational language help at the exact moment they need it.
- Make live language practice feel lightweight, approachable, and non-disruptive to daily life.
- Allow users to confidently communicate in real-world situations without committing to long lessons.
- Seamlessly bridge micro-interactions on a smart watch into deeper learning experiences on mobile when needed.
- Let users sing along with synchronized lyrics for any supported song
- Support both Solo Karaoke and With Friends Karaoke
- Minimize time-to-first-lyric (fast entry from a song page)
- Make joining a friend session effortless via link
- Provide a delightful “session” feeling (lobby, ready states, shared experience)
- Keep the feature safe, respectful, and privacy-first
- Enable users to sing along to songs solo or with friends
- Provide a fast, low-friction entry into karaoke from a song
- Preserve privacy and consent around microphone use
- Support imperfect networks with graceful degradation
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- Let users sing along with synchronized lyrics for any supported song
- Support both Solo Karaoke and With Friends Karaoke
- Minimize time-to-first-lyric (fast entry from a song page)
- Make joining a friend session effortless via link
- Provide a delightful “session” feeling (lobby, ready states, shared experience)
- Keep the feature safe, respectful, and privacy-first
- Enable users to sing along to songs solo or with friends
- Provide a fast, low-friction entry into karaoke from a song
- Preserve privacy and consent around microphone use
- Support imperfect networks with graceful degradation
- Enable bite-sized live language practice sessions from a smart watch
- Allow users to quickly ask a tutor a question or practice a phrase
- Minimize time-to-connection with a tutor
- Support hands-free and glanceable interactions
- Allow seamless escalation from watch → phone when needed
- Respect privacy, consent, and recording transparency
- Sing along to songs solo or with friends
- Let users sing along with synchronized lyrics for any supported song
- Support both Solo Karaoke and With Friends Karaoke
- Minimize time-to-first-lyric (fast entry from a song page)
- Make joining a friend session effortless via link
- Provide a delightful “session” feeling (lobby, ready states, shared experience)
- Keep the feature safe, respectful, and privacy-first

### Personas
- **Traveler Learner**: wants quick language help while navigating a foreign country
- **Busy Professional**: wants short, focused practice sessions between meetings
- **Language Beginner**: wants reassurance, corrections, and simple explanations
- **Advanced Learner**: wants nuanced phrasing, pronunciation feedback, and cultural tips
- **Tutor**: wants to deliver helpful micro-lessons without context switching
- **Privacy-Conscious User**: wants control over audio recording and session history
- **Casual Listener**: wants a low-pressure, no-judgment karaoke experience
- **Karaoke Host**: wants to start a session fast and invite friends easily
- **Friend Participant**: wants to join instantly and understand what to do next
- **Competitive Singer**: wants scoring and performance feedback (optional)
- **Social Sharer**: wants results or clips to share after a session
- **Privacy-Conscious User**: wants control over mic usage and recording
- ****
- ****
- ****
- ****
- ****
- ****
- **Casual Listener**: wants a low-pressure, no-judgment karaoke experience
- **Karaoke Host**: wants to start a session fast and invite friends easily
- **Friend Participant**: wants to join instantly and understand what to do next
- **Competitive Singer**: wants scoring and performance feedback (optional)
- **Social Sharer**: wants results or clips to share after a session
- **Privacy-Conscious User**: wants control over mic usage and recording
- **Traveler Learner**: wants quick language help while navigating a foreign country
- **Busy Professional**: wants short, focused practice sessions between meetings
- **Language Beginner**: wants reassurance, corrections, and simple explanations
- **Advanced Learner**: wants nuanced phrasing, pronunciation feedback, and cultural tips
- **Tutor**: wants to deliver helpful micro-lessons without context switching
- **Privacy-Conscious User**: wants control over audio recording and session history
- **Casual Listener**: wants a fun, low-pressure way to sing along without needing talent
- **Karaoke Host**: wants to start a session fast and invite friends with minimal setup
- **Friend Participant**: wants to join instantly from an invite link and know what to do next
- **Competitive Singer**: wants scoring, stats, and bragging rights (optional mode)
- **Social Sharer**: wants clips/screenshots/results to share after the session
- **Privacy-Conscious User**: wants control over microphone use and recording, with clear consent

### Context
- Project = Smart Watch Language Tutor
- Client = Preply
- OutputSlug = smartwatch_language_tutor
- Version = v1
- Platform = Smart Watch (Apple Watch + Wear OS) + Companion Mobile App
- Owner = Blue
- Project = Spotify Karaoke
- Client = Spotify
- OutputSlug = spotify_karaoke
- Version = v1
- Platform = Mobile (iOS, Android)
- Owner = Blue
- Project =
- Client =
- OutputSlug = ex_ex
- Version = v1
- Platform =
- Owner = Blue
- Project = Spotify Karaoke
- Client = Spotify
- OutputSlug = spotify_karaoke
- Version = v1
- Platform = Mobile (iOS, Android)
- Owner = Blue
- 
- 

## User Flow

```mermaid
flowchart TD

  %% Steps
  S1["User opens the language tutor app on smart watch"]
  S2["User launches the app from a watch complication"]
  S3["User selects “Practice a Phrase”"]
  S4["User selects “Ask a Question”"]
  S5["User selects “Join Scheduled Lesson”"]
  S6["User speaks a phrase or question into the watch"]
  S7["User reviews a suggested phrase or prompt"]
  S8["User confirms intent to connect with a tutor"]
  S9["User listens to tutor feedback or explanation"]
  S10["User repeats a phrase after tutor guidance"]
  S11["User chooses to continue session on mobile phone"]
  S12["User ends or exits the session"]
  QP1["User opens language tutor app on smart watch"]
  QP6["Live audio session begins with tutor"]
  QP8["Tutor provides pronunciation correction"]
  AQ1["User taps “Ask a Question”"]
  AQ5["Live audio session begins"]
  AQ7["App suggests switching to phone for extended help"]
  SM1["User taps “Join Lesson”"]
  SM2["Tutor begins short structured exercise"]
  SM4["User responds verbally to prompts"]
  SM6["App suggests continuing lesson on phone"]
  S13["User opens a song detail page"]
  S14["User taps a new action called “Karaoke”"]
  S15["App shows Karaoke setup screen with mode selection (Solo ..."]
  S16["If Solo, user starts immediately and sees lyrics sync wit..."]
  S17["If With Friends, user becomes Host and a lobby is created"]
  S18["Lobby shows session status and invite button"]
  S19["Host sends invite link via share sheet"]
  S20["Friend opens invite link and joins as Participant"]
  S21["Participants see lobby with song + readiness state"]
  S22["Host taps Start to begin karaoke session"]
  S23["During session, lyrics highlight and users can mute/unmut..."]
  S24["At end, users see a summary screen with share / replay / ..."]
  S1["User opens a song detail page"]
  S2["User taps “Karaoke”"]
  S3["User selects Solo Karaoke mode"]
  S4["Start Solo Karaoke with live lyrics + mic input"]
  S5["Start Solo Karaoke in lyrics-only mode"]
  H1["Host taps “Karaoke”"]
  H2["Host selects “With Friends”"]
  H3["Host enters lobby with mic enabled"]
  H4["Host enters lobby in lyrics-only mode"]
  H5["Host shares invite link"]
  H8["Host waits in lobby"]
  H9["Host starts Karaoke session"]
  G1["Guest joins lobby"]
  G2["Guest joins with mic enabled"]
  G3["Guest joins in lyrics-only mode"]
  G4["Participate in karaoke session"]
  S25[""]
  S26[""]
  S27[""]
  S28[""]
  S29[""]
  S30[""]
  S31[""]
  S32[""]
  S33[""]
  S34[""]
  S35[""]
  S36[""]
  S1["(S1)"]
  S2["(S2)"]
  S3["(S3)"]
  S4["(S4)"]
  S5["(S5)"]
  S37["User opens a song detail page"]
  S38["User taps a new action called “Karaoke”"]
  S39["App shows Karaoke setup screen with mode selection (Solo ..."]
  S40["If Solo, user starts immediately and sees lyrics sync wit..."]
  S41["If With Friends, user becomes Host and a lobby is created"]
  S42["Lobby shows session status and invite button"]
  S43["Host sends invite link via share sheet"]
  S44["Friend opens invite link and joins as Participant"]
  S45["Participants see lobby with song + readiness state"]
  S46["Host taps Start to begin karaoke session"]
  S47["During session, lyrics highlight and users can mute/unmut..."]
  S48["At end, users see a summary screen with share / replay / ..."]
  S1["User opens a song detail page"]
  S2["User taps “Karaoke”"]
  S3["User selects Solo Karaoke mode"]
  S4["Start Solo Karaoke with live lyrics + mic input"]
  S5["Start Solo Karaoke in lyrics-only mode"]
  H1["Host taps “Karaoke”"]
  H2["Host selects “With Friends”"]
  H3["Host enters lobby with mic enabled"]
  H4["Host enters lobby in lyrics-only mode"]
  H5["Host shares invite link"]
  H8["Host waits in lobby"]
  H9["Host starts Karaoke session"]
  G1["Guest joins lobby"]
  G2["Guest joins with mic enabled"]
  G3["Guest joins in lyrics-only mode"]
  G4["Participate in karaoke session"]
  S49["User opens a song detail page"]
  S50["User taps a new action called “Karaoke”"]
  S51["App shows Karaoke setup screen with mode selection (Solo ..."]
  S52["If Solo, user starts immediately and sees lyrics sync wit..."]
  S53["If With Friends, user becomes Host and a lobby is created"]
  S54["Lobby shows session status and invite button"]
  S55["Host sends invite link via share sheet"]
  S56["Friend opens invite link and joins as Participant"]
  S57["Participants see lobby with song + readiness state"]
  S58["Host taps Start to begin karaoke session"]
  S59["During session, lyrics highlight and users can mute/unmut..."]
  S60["At end, users see a summary screen with share / replay / ..."]

  %% Decisions
  D1{"Is a tutor available?"}
  D2{"Is microphone permission granted?"}
  D3{"Is microphone permission granted?"}
  D4{"Is a tutor available?"}
  D5{"Does user need additional clarification?"}
  D6{"Is network connection stable?"}
  D7{"Is lesson exceeding watch-friendly du..."}
  D8{"Is Karaoke supported for this song?"}
  D9{"Is microphone permission granted?"}
  D10{"Is microphone permission granted?"}
  D11{"How does host invite friends?"}
  D12{"Are participants ready?"}
  D13{"Is invite link valid?"}
  D14{"Is microphone permission granted?"}
  D15{"Has host started the session?"}
  D16{""}
  D17{""}
  D18{"Is Karaoke supported for this song?"}
  D19{"Is microphone permission granted?"}
  D20{"Is microphone permission granted?"}
  D21{"How does host invite friends?"}
  D22{"Are participants ready?"}
  D23{"Is invite link valid?"}
  D24{"Is microphone permission granted?"}
  D25{"Has host started the session?"}

  %% Edges
  D1 -->|"Yes"| S3
  D1 -->|"No"| N_END_EXIT
  D2 -->|"Yes"| S4
  D2 -->|"No"| S5
  D3 -->|"Yes"| H3
  D3 -->|"No"| H4
  D4 -->|"Share Sheet"| N_H6
  D4 -->|"Copy Link"| N_H7
  D5 -->|"Yes"| H9
  D5 -->|"No"| H8
  D6 -->|"Yes"| G1
  D6 -->|"No"| N_END_ERROR
  D7 -->|"Yes"| G2
  D7 -->|"No"| G3
  D8 -->|"Yes"| G4
  D8 -->|"No"| G1
  D1 -->|"Yes"| S3
  D1 -->|"No"| N_END_EXIT
  D2 -->|"Yes"| S4
  D2 -->|"No"| S5
  D1 -->|"Yes"| S3
  D1 -->|"No"| N_END_EXIT
  D2 -->|"Yes"| S4
  D2 -->|"No"| S5
  D3 -->|"Yes"| H3
  D3 -->|"No"| H4
  D4 -->|"Share Sheet"| N_H6
  D4 -->|"Copy Link"| N_H7
  D5 -->|"Yes"| H9
  D5 -->|"No"| H8
  D6 -->|"Yes"| G1
  D6 -->|"No"| N_END_ERROR
  D7 -->|"Yes"| G2
  D7 -->|"No"| G3
  D8 -->|"Yes"| G4
  D8 -->|"No"| G1
```

## Requirements

### Functional
- App must support live audio sessions with a tutor
- App must support ultra-short sessions (30s–5min)
- App must allow users to ask a single question or practice a phrase
- App must display minimal visual cues optimized for watch screens
- App must support push-to-talk and hands-free modes
- App must gracefully handle poor or intermittent connectivity
- App must allow users to switch to phone for longer sessions
- App must request microphone permission just-in-time with explanation
- App must allow practice without recording by default
- App must show tutor availability in near real-time
- App must provide lightweight session summaries after completion
- Karaoke mode must display real-time synchronized lyrics with highlighting
- Karaoke mode must support Solo mode
- Karaoke mode must support With Friends mode (real-time session)
- Host can create a karaoke session from a song
- Host can invite friends using a shareable link
- Participant can join session from invite link
- Lobby must show who joined and who is ready
- Session must have a clear Start action controlled by the host
- Users can mute/unmute themselves during the session
- Users can leave session at any time without breaking the session
- App must request microphone permission only when needed and explain why
- Karaoke should be usable even if mic permission is denied (lyrics-only mode)
- App must handle network latency gracefully (allow slight desync + reconnection)
- App must show clear feedback for loading, syncing, and connection issues
- Competitive scoring mode is optional and can be enabled per session
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- Karaoke mode must display real-time synchronized lyrics with highlighting
- Karaoke mode must support Solo mode
- Karaoke mode must support With Friends mode (real-time session)
- Host can create a karaoke session from a song
- Host can invite friends using a shareable link
- Participant can join session from invite link
- Lobby must show who joined and who is ready
- Session must have a clear Start action controlled by the host
- Users can mute/unmute themselves during the session
- Users can leave session at any time without breaking the session
- App must request microphone permission only when needed and explain why
- Karaoke should be usable even if mic permission is denied (lyrics-only mode)
- App must handle network latency gracefully (allow slight desync + reconnection)
- App must show clear feedback for loading, syncing, and connection issues
- Competitive scoring mode is optional and can be enabled per session
- App must support live audio sessions with a tutor
- App must support ultra-short sessions (30s–5min)
- App must allow users to ask a single question or practice a phrase
- App must display minimal visual cues optimized for watch screens
- App must support push-to-talk and hands-free modes
- App must gracefully handle poor or intermittent connectivity
- App must allow users to switch to phone for longer sessions
- App must request microphone permission just-in-time with explanation
- App must allow practice without recording by default
- App must show tutor availability in near real-time
- App must provide lightweight session summaries after completion
- Karaoke mode must display real-time synchronized lyrics with highlighting
- Karaoke mode must support Solo mode
- Karaoke mode must support With Friends mode (real-time session)
- Host can create a karaoke session from a song
- Host can invite friends using a shareable link
- Participant can join session from invite link
- Lobby must show who joined and who is ready
- Session must have a clear Start action controlled by the host
- Users can mute/unmute themselves during the session
- Users can leave session at any time without breaking the session
- App must request microphone permission only when needed and explain why
- Karaoke should be usable even if mic permission is denied (lyrics-only mode)
- App must handle network latency gracefully (allow slight desync + reconnection)
- App must show clear feedback for loading, syncing, and connection issues
- Competitive scoring mode is optional and can be enabled per session

## Open Questions
- [ ] Are sessions recorded or ephemeral by default?
- [ ] Do tutors see user location/context (city, country)?
- [ ] Can users request the same tutor repeatedly for micro-sessions?
- [ ] What is the max recommended session length on watch?
- [ ] Do we support text input at all on watch?
- [ ] How do we price or meter ultra-short tutor interactions?
- [ ] What happens if tutor availability is low?
- [ ] How much context should persist between sessions?
- [ ] Is audio recorded or purely live?
- [ ] Is group playback strict-sync or best-effort?
- [ ] Is a host required at all times?
- [ ] Do we support duets or rotating solos?
- [ ] Should sessions support video, or audio-only, or lyrics-only?
- [ ] Do we support scoring in v1? If yes, what model and what feedback UI?
- [ ] Where does Karaoke live in the Spotify IA (song page, now playing, search)?
- [ ] How do we handle explicit lyrics / content controls in group sessions?
- [ ] What is the max participant count for a good experience?
- [ ] What is the max participant count for a good experience?
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] Is audio recorded or purely live?
- [ ] Is group playback strict-sync or best-effort?
- [ ] Is a host required at all times?
- [ ] Do we support duets or rotating solos?
- [ ] Should sessions support video, or audio-only, or lyrics-only?
- [ ] Do we support scoring in v1? If yes, what model and what feedback UI?
- [ ] Where does Karaoke live in the Spotify IA (song page, now playing, search)?
- [ ] How do we handle explicit lyrics / content controls in group sessions?
- [ ] What is the max participant count for a good experience?
- [ ] What is the max participant count for a good experience?
- [ ] Are sessions recorded or ephemeral by default?
- [ ] Do tutors see user location/context (city, country)?
- [ ] Can users request the same tutor repeatedly for micro-sessions?
- [ ] What is the max recommended session length on watch?
- [ ] Do we support text input at all on watch?
- [ ] How do we price or meter ultra-short tutor interactions?
- [ ] What happens if tutor availability is low?
- [ ] How much context should persist between sessions?
- [ ] Do we record audio at all, or is it a purely live sing-along experience?
- [ ] Is With Friends playback truly synchronized or “best-effort” with tolerance?
- [ ] Do we need a host at all times, or can sessions be hostless?
- [ ] Do we support duets / rotating solo lines, or everyone sings everything?
- [ ] Should sessions support video, or audio-only, or lyrics-only?
- [ ] Do we support scoring in v1? If yes, what model and what feedback UI?
- [ ] Where does Karaoke live in the Spotify IA (song page, now playing, search)?
- [ ] How do we handle explicit lyrics / content controls in group sessions?
- [ ] What is the max participant count for a good experience?

## Risks
- Network instability may interrupt live audio sessions, degrading the learning experience or causing frequent exits.
- Smart watch screen and input constraints may limit users’ ability to understand feedback or corrections from tutors.
- Low tutor availability during peak travel hours could result in repeated failed connection attempts, increasing user frustration.
- Audio desync on low-end devices
- Abuse in group sessions
- Privacy concerns around microphone usage
- 
- 
- 
- Audio desync on low-end devices
- Abuse in group sessions
- Privacy concerns around microphone usage

## Notes
- BluePrints – Project Input
- Project: Smart Watch Language Tutor  Client: Preply (conceptual)  OutputSlug: smartwatch_language_tutor  Version: v1  Date: 2026-01-26  Owner: Blue  Platform: Smart Watch (Apple Watch + Wear OS) + Companion Mobile App  Goal: Practice a foreign language with a live tutor through quick, on-the-go interactions  Constraints: Small screen, limited attention span, variable connectivity, hands-free usage
- PERSONAS:
- GOALS:
- REQUIREMENTS:
- USER FLOW NOTES:
- (3 Primary Flows)
- FLOW 1: Quick Phrase Practice (On-the-Go)
- FLOW 2: Ask a Contextual Question While Traveling
- FLOW 3: Scheduled Micro-Lesson with Tutor
- EDGE CASES:
- [Unparsed E:] User is in a noisy environment — offer text or repeat mode
- [Unparsed E:] Poor network — switch to delayed audio or fallback suggestions
- [Unparsed E:] Tutor disconnects — auto-retry or reassign
- [Unparsed E:] User receives phone call — pause and resume session
- [Unparsed E:] User denies microphone permission — allow read-only phrase review
- [Unparsed E:] User is driving — enable hands-free mode only
- [Unparsed E:] Time runs out mid-session — provide summary and follow-up
- OPEN QUESTIONS:
- BluePrints - Project Input
- Project: Spotify Karaoke
- Client: Spotify
- OutputSlug: spotify_karaoke
- Version: v1
- Date: 2026-01-26
- Owner: Blue
- Platform: Mobile (iOS + Android)
- Constraints: Privacy-first, low friction entry, works with imperfect network
- PERSONAS:
- GOALS:
- REQUIREMENTS:
- USER FLOW NOTES:
- (Steps)
- EDGE CASES:
- [Unparsed E:] User joins session late (mid-song) — should sync to current lyric position
- [Unparsed E:] Microphone permission denied — user can still continue in lyrics-only mode
- [Unparsed E:] Host disconnects — session should either pause, transfer host, or end gracefully
- [Unparsed E:] Participant disconnects — they should be able to rejoin quickly
- [Unparsed E:] Bad network causes lyric desync — show “resync” option and continue playback
- [Unparsed E:] Song unavailable in region — Karaoke entry should explain and offer alternatives
- [Unparsed E:] Invite link expired or invalid — show friendly recovery path
- [Unparsed E:] Too many participants — enforce a session cap and communicate why
- [Unparsed E:] User receives a call/audio interruption — resume experience smoothly
- [Unparsed E:] Abusive participant — allow report + leave + block actions
- OPEN QUESTIONS:
