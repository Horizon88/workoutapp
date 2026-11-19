# VITA

Vita's mobile web app for **protein**, **movement** and **vitamins**: gentle reminders, streaks and a little motivation.
It's built for iPhone: install it to the Home Screen, and her schedule arrives as native notifications through iPhone Calendar.

- **Today:** her cover photo with a time-of-day greeting and a kind daily line (tap for another), streaks, progress rings, what's next, and one-tap logging.
- **Protein:** a daily gram goal from body weight and goal, quick-add buttons, saved foods, and a 7-day chart.
- **Move:** weekly aerobic minutes (vigorous counts double) toward 150 min, strength days toward 2, and an 8-week chart.
- **Vitamins:** her supplement list, a daily check-off, and 14-day history.
- **Me:** cover photo (Natural, Glow or Duotone look, with adjustable framing), progress photos with a Day 1 vs. latest comparison, her name and her own words, reminders, backup, and sources.
- **Goal moments:** closing a ring (protein goal, all vitamins, 150 weekly minutes) shows her photo in a glowing ring with a kind note.

The theme is hot pink & fire on black. The voice is calm and kind throughout, in the app and in the reminders.

## Privacy

- No account, no server, no tracking.
- Logs and settings live in the phone's browser storage. Photos are resized on the phone and kept in its IndexedDB.
- **Photos are never uploaded and never part of this repo.** Vita picks them inside the app.
- Me → Backup exports logs as JSON. Photos aren't in the backup, so keep the originals in Photos.

## Install on iPhone

1. Open the site in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Open VITA from the Home Screen.
4. On **Protein**, set weight and goal. On **Me**, add a cover photo.
5. Go to **Me → Reminders**. Tap **Send test alert**, add the event, and wait about 2 minutes for the notification.
6. Once the test works, tap **Add reminders to Calendar**, then **Add All**.

> Tip: create a calendar called "VITA" in the Calendar app first. If iPhone asks where to add the events, pick it. Deleting that calendar later removes every reminder at once.

## How reminders work (and why Calendar)

iPhone web apps can't schedule their own notifications while closed. Web Push can, but only with a server sending the pushes.
VITA has no server, so it turns the schedule into a standard calendar file (`.ics`) with an alert on every event. Calendar does the nudging.

- **Repeating events.** Each reminder is a daily or weekly event at a "floating" local time: 7:30 stays 7:30 when she travels or the clocks change.
- **Gentle check-ins.** An optional follow-up is a separate small event N minutes later. Calendar can't see what she's logged, so **it arrives even if she's already done it**. The wording says so ("Already done? Lovely, ignore this one."), and check-ins can be switched off per reminder.
- **Edits don't sync.** After changing the schedule, delete the old VITA events (or the VITA calendar) and add them again. The app flags when Calendar is out of date.
- **Where the file comes from.** The service worker builds the file on the device (`sw.js` + `ics.js`) and serves it from a real `vita.ics` URL with the schedule in the query string. If the worker isn't installed in that browser yet, for example when a copied link is pasted into Safari, `404.html` installs it and reloads.

## Deploy (GitHub Pages)

It's a static site with no build step:

1. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then branch `main`, folder `/ (root)`.
2. If the org offers a Pages visibility setting, choose **Public**. Private Pages needs a GitHub sign-in, and the Home Screen app keeps its own sign-in separate from Safari.
3. The site goes live at `https://<org>.github.io/workoutapp/`.

Run it locally with any static server, e.g. `python3 -m http.server`, then open `/`.

## Evidence

Every number shown in the app comes from a source below. Each citation was checked against PubMed, the publisher or HHS.

1. Institute of Medicine. *Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids.* National Academies Press; 2005: chap 10, p 589. doi:10.17226/10490. Adult protein RDA 0.8 g/kg/day.
2. Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition position stand: protein and exercise. *J Int Soc Sports Nutr.* 2017;14:20. doi:10.1186/s12970-017-0177-8. 1.4–2.0 g/kg/day for most exercising people; ~0.25 g/kg or 20–40 g per serving, every 3–4 h.
3. Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. *Br J Sports Med.* 2018;52(6):376-384. doi:10.1136/bjsports-2017-097608. Gains plateaued at ~1.62 g/kg/day (95% CI 1.03–2.20). The breakpoint was not statistically significant, and the authors suggest up to ~2.2 g/kg/day to maximize gains. The authors disclose industry ties.
4. Schoenfeld BJ, Aragon AA. How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution. *J Int Soc Sports Nutr.* 2018;15:10. doi:10.1186/s12970-018-0215-1. A narrative review: it suggests ~0.4 g/kg/meal over 4+ meals, up to 0.55 g/kg/meal for 2.2 g/kg/day.
5. Bauer J, Biolo G, Cederholm T, et al. Evidence-based recommendations for optimal dietary protein intake in older people: a position paper from the PROT-AGE Study Group. *J Am Med Dir Assoc.* 2013;14(8):542-559. doi:10.1016/j.jamda.2013.05.021. Cited only for its caution that people with severe kidney disease not on dialysis may need to limit protein.
6. Piercy KL, Troiano RP, Ballard RM, et al. The Physical Activity Guidelines for Americans. *JAMA.* 2018;320(19):2020-2028. doi:10.1001/jama.2018.14854. 150–300 min moderate or 75–150 min vigorous per week, plus muscle-strengthening on 2+ days. Move more and sit less: some physical activity is better than none.
7. US Department of Health and Human Services. *Physical Activity Guidelines for Americans.* 2nd ed. HHS; 2018: pp 58, 60. Two minutes of moderate counts as one minute of vigorous (p 58), and the talk test (p 60).
8. Bull FC, Al-Ansari SS, Biddle S, et al. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. *Br J Sports Med.* 2020;54(24):1451-1462. doi:10.1136/bjsports-2020-102955. Same adult targets as above.
9. Dawson-Hughes B, Harris SS, Lichtenstein AH, et al. Dietary fat increases vitamin D-3 absorption. *J Acad Nutr Diet.* 2015;115(2):225-230. doi:10.1016/j.jand.2014.09.014. Peak plasma D3 was 32% higher with a fat-containing meal than a fat-free one (n=50, older adults).
10. Mulligan GB, Licata A. Taking vitamin D with the largest meal improves absorption and results in higher serum levels of 25-hydroxyvitamin D. *J Bone Miner Res.* 2010;25(4):928-930. doi:10.1002/jbmr.67. A small uncontrolled study (n=17): average ~50% rise in 25(OH)D after moving the dose to the largest meal.

VITA is a habit tracker, not medical advice.

## Files

| File | What it does |
|---|---|
| `index.html` | App shell, PWA meta tags, tab bar |
| `app.js` | State, views, logging, streaks, charts, photos (IndexedDB), goal flash, backup |
| `ics.js` | iCalendar builder, shared by the page and the service worker |
| `sw.js` | Offline cache, and serves `vita.ics` |
| `404.html` | Installs the service worker when a calendar link is opened in a fresh browser |
| `styles.css` | Hot pink & fire theme; category colors checked for color-vision deficiency |
| `manifest.webmanifest`, `icons/` | Home Screen install |
