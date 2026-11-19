# JohnBF

A mobile web app that reminds you to **eat protein**, **work out** and **take your vitamins**, and tracks all three with streaks.
It's built for iPhone: install it to the Home Screen, and your schedule rings as native notifications through iPhone Calendar.

- **Today:** progress rings, streaks, what's next, and one-tap logging
- **Protein:** daily gram target from body weight and goal, quick-add buttons, saved foods, a 7-day chart
- **Move:** weekly aerobic minutes (vigorous counts double) toward 150 min, strength days toward 2, an 8-week chart
- **Vitamins:** your supplement list, a daily check-off, and 14-day history
- **Remind:** edit times, days and follow-ups, then add them all to iPhone Calendar

No account, no server, no tracking. Data stays in the phone's browser storage, and you can export or import a backup from Settings.

## Install on iPhone

1. Open the site in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Open JohnBF from the Home Screen and set your weight and goal on the **Protein** tab.
4. On the **Remind** tab, tap **Send test alert**, add the event, and wait about 2 minutes for the notification.
5. Once the test works, tap **Add reminders to Calendar**, then **Add All**.

> Tip: create a calendar called "JohnBF" in the Calendar app first. If iPhone asks where to add the events, pick it. Deleting that calendar later removes every reminder at once.

## How reminders work (and why Calendar)

iPhone web apps can't schedule their own notifications while closed. Web Push can, but only with a server sending the pushes.
JohnBF has no server, so it turns your schedule into a standard calendar file (`.ics`) with an alert on every event. Calendar does the ringing.

- **Repeating events.** Each reminder is a daily or weekly event at a "floating" local time: 7:30 stays 7:30 when you travel or the clocks change.
- **Follow-ups.** A follow-up is a separate small event N minutes later. Calendar can't see what you've logged in the app, so **it rings even if you've already done the thing**. Turn follow-ups off per reminder if that's annoying.
- **Edits don't sync.** After changing your schedule, delete the old JohnBF events (or the JohnBF calendar) and add them again. The Remind tab flags when your Calendar copy is out of date.
- **Where the file comes from.** The service worker builds the file on the device (`sw.js` + `ics.js`) and serves it from a real `johnbf.ics` URL with the schedule in the query string. If the worker isn't installed in that browser yet, for example when a copied link is pasted into Safari, `404.html` installs it and reloads.

## Deploy (GitHub Pages)

It's a static site with no build step:

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then branch `main`, folder `/ (root)`.
3. The app goes live at `https://<user>.github.io/workoutapp/`.

Run it locally with any static server, e.g. `python3 -m http.server`, then open `/`.

## Evidence

Every number shown in the app comes from a source below. Each citation was checked against PubMed, the publisher or HHS.

1. Institute of Medicine. *Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids.* National Academies Press; 2005: chap 10, p 589. doi:10.17226/10490. Adult protein RDA 0.8 g/kg/day.
2. Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition position stand: protein and exercise. *J Int Soc Sports Nutr.* 2017;14:20. doi:10.1186/s12970-017-0177-8. 1.4–2.0 g/kg/day for most exercising people; ~0.25 g/kg or 20–40 g per serving, every 3–4 h.
3. Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. *Br J Sports Med.* 2018;52(6):376-384. doi:10.1136/bjsports-2017-097608. Gains plateaued at ~1.62 g/kg/day (95% CI 1.03–2.20). The breakpoint was not statistically significant, and the authors suggest up to ~2.2 g/kg/day to maximize gains. The authors disclose industry ties.
4. Schoenfeld BJ, Aragon AA. How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution. *J Int Soc Sports Nutr.* 2018;15:10. doi:10.1186/s12970-018-0215-1. A narrative review: it suggests ~0.4 g/kg/meal over 4+ meals, up to 0.55 g/kg/meal for 2.2 g/kg/day.
5. Bauer J, Biolo G, Cederholm T, et al. Evidence-based recommendations for optimal dietary protein intake in older people: a position paper from the PROT-AGE Study Group. *J Am Med Dir Assoc.* 2013;14(8):542-559. doi:10.1016/j.jamda.2013.05.021. Over 65: at least 1.0–1.2 g/kg/day, and ≥1.2 if active. People with severe kidney disease not on dialysis may need to limit protein.
6. Piercy KL, Troiano RP, Ballard RM, et al. The Physical Activity Guidelines for Americans. *JAMA.* 2018;320(19):2020-2028. doi:10.1001/jama.2018.14854. 150–300 min moderate or 75–150 min vigorous per week, plus muscle-strengthening on 2+ days.
7. US Department of Health and Human Services. *Physical Activity Guidelines for Americans.* 2nd ed. HHS; 2018: pp 58, 60. Two minutes of moderate counts as one minute of vigorous (p 58), and the talk test (p 60).
8. Bull FC, Al-Ansari SS, Biddle S, et al. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. *Br J Sports Med.* 2020;54(24):1451-1462. doi:10.1136/bjsports-2020-102955. Same adult targets as above.
9. Dawson-Hughes B, Harris SS, Lichtenstein AH, et al. Dietary fat increases vitamin D-3 absorption. *J Acad Nutr Diet.* 2015;115(2):225-230. doi:10.1016/j.jand.2014.09.014. Peak plasma D3 was 32% higher with a fat-containing meal than a fat-free one (n=50, older adults).
10. Mulligan GB, Licata A. Taking vitamin D with the largest meal improves absorption and results in higher serum levels of 25-hydroxyvitamin D. *J Bone Miner Res.* 2010;25(4):928-930. doi:10.1002/jbmr.67. A small uncontrolled study (n=17): average ~50% rise in 25(OH)D after moving the dose to the largest meal.

JohnBF is a habit tracker, not medical advice.

## Files

| File | What it does |
|---|---|
| `index.html` | App shell, PWA meta tags, tab bar |
| `app.js` | State, views, logging, streaks, charts, backup |
| `ics.js` | iCalendar builder, shared by the page and the service worker |
| `sw.js` | Offline cache, and serves `johnbf.ics` |
| `404.html` | Installs the service worker when a calendar link is opened in a fresh browser |
| `styles.css` | Dark, bold theme; category colors checked for color-vision deficiency |
| `manifest.webmanifest`, `icons/` | Home Screen install |
