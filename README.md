# The Juggadi Show — 2 Player Realtime Quiz

Mobile-first Telugu quiz game for friends/couples. Two players join one room. Questions are shown on a TV/screen; answer options are shown on each player's phone.

## Features
- Exactly 2 players per room.
- Host creates a 4-character room code; second player joins with that code.
- Game cannot start until exactly 2 players are connected.
- 10 easy Telugu cinema + General GK questions.
- 90-second timer for every question, synchronized from the server.
- If both players answer early, the question advances without waiting for 90 seconds.
- If time expires, unanswered player gets no point and the game advances.
- Results appear only after all 10 questions.
- TV/screen mode: `/tv.html?room=ABCD` shows the question and options on a large display; phones remain the answer controls.
- No login and no database required for the prototype.

## Run
```bash
npm install
npm start
```
Open `http://localhost:3000`.

For two phones on the same Wi-Fi, use the computer's local IP, e.g. `http://192.168.1.5:3000`.

## Free online deployment
Recommended prototype hosting: Render Free Web Service. It supports Node/Express and WebSockets. Free services spin down after 15 minutes of inactivity, so the first visit after idle can take around a minute. Do not use the free tier for a production event without checking current limits.

Deploy from a GitHub repository with:
- Build Command: `npm install`
- Start Command: `npm start`
- Instance: Free

## TV shoot setup
1. Open the public website on a TV/laptop connected to the shoot display.
2. Create a game on a phone.
3. Copy the room code.
4. Open `https://YOUR-DOMAIN/tv.html?room=CODE` on the TV.
5. Second player joins the same code on their phone.
6. Host starts the game.
7. TV displays the question; each phone displays the answer buttons.
