# Fountain data report

Source: `data/lcsd_wd_en.csv` · data as of 2026-11-01 · generated 2026-11-01T03:09:11.235Z

- CSV rows: 1046
- Rows kept: 1041
- Map points (venue + coordinates): 789

## Excluded: out-of-bounds or invalid coordinates (5)

- Hong Kong Squash Centre — Corridor at G/F [23.27778, 115.16009] (CSV line 39)
- Hong Kong Squash Centre — Near Squash Court no. 7 on the 1/F [24.27778, 116.16009] (CSV line 40)
- Hong Kong Squash Centre — (no location) [25.27778, 117.16009] (CSV line 41)
- Ngau Chi Wan Park — Ladies' Toilet Entrance and Exit at Lower Platform [23.33627, 114.1251] (CSV line 526)
- Kadoorie Beach — Near Barbecue area [22.223701, 113.5855] (CSV line 942)

## Flagged: likely wrong coordinates (6)

More than 3 km from other venues in the same district and at least 4× closer to another district.
Kept on the map with a warning, and "Directions" uses the address instead of the coordinates.
To fix, set lat/lng for the matching entry in `data/fountain-overrides.json`. A starter entry is printed below each row.

- Ma On Shan Recreation Ground — Near Venue Office [22.251, 114.1341] (CSV line 819) — 16.1 km from other Sha Tin venues; 3.7 km from Central & Western. Address: No.1 Hang Hong Street, Ma On Shan, N.T.
  `{ "match": { "name": "Ma On Shan Recreation Ground", "lat": 22.251, "lng": 114.1341 }, "lat": null, "lng": null, "note": "" }`
- Ma On Shan Recreation Ground — Near toilets next to Basketball Court [22.251, 114.1341] (CSV line 820) — 16.1 km from other Sha Tin venues; 3.7 km from Central & Western. Address: No.1 Hang Hong Street, Ma On Shan, N.T.
  `{ "match": { "name": "Ma On Shan Recreation Ground", "lat": 22.251, "lng": 114.1341 }, "lat": null, "lng": null, "note": "" }`
- Ma On Shan Sports Centre — Outside Arena (near vending machine) [22.2534, 114.1346] (CSV line 821) — 15.8 km from other Sha Tin venues; 3.4 km from Central & Western. Address: 14 On Chun Street, Ma On Shan, Sha Tin
  `{ "match": { "name": "Ma On Shan Sports Centre", "lat": 22.2534, "lng": 114.1346 }, "lat": null, "lng": null, "note": "" }`
- Ma On Shan Sports Centre — Outside Table Tennis Room [22.2534, 114.1346] (CSV line 822) — 15.8 km from other Sha Tin venues; 3.4 km from Central & Western. Address: 14 On Chun Street, Ma On Shan, Sha Tin
  `{ "match": { "name": "Ma On Shan Sports Centre", "lat": 22.2534, "lng": 114.1346 }, "lat": null, "lng": null, "note": "" }`
- Ma On Shan Sports Centre — Outside Fitness Room [22.2534, 114.1346] (CSV line 823) — 15.8 km from other Sha Tin venues; 3.4 km from Central & Western. Address: 14 On Chun Street, Ma On Shan, Sha Tin
  `{ "match": { "name": "Ma On Shan Sports Centre", "lat": 22.2534, "lng": 114.1346 }, "lat": null, "lng": null, "note": "" }`
- University Station Cycling Entry/Exit Hub — Near First Aid Office [22.497246, 114.121383] (CSV line 857) — 14.8 km from other Sha Tin venues; 1.4 km from North. Address: Chak Cheung Street, University Station, Sha Tin.
  `{ "match": { "name": "University Station Cycling Entry/Exit Hub", "lat": 22.497246, "lng": 114.121383 }, "lat": null, "lng": null, "note": "" }`

## Worth a look: more than 3 km from the district median (34)

Usually fine. Large or spread-out districts (Islands, Southern, Kai Tak) trip this check. These rows are not marked on the map.

- Cloud View Road Service Reservoir Playground — Outside of Office Block [22.284871, 114.194999] (CSV line 94) — 3.1 km from other Eastern venues; 1.4 km from Wan Chai. Address: Cloud View Road, North Point
- Big Wave Bay Beach — Near Men's Changing Room [22.246554, 114.246739] (CSV line 154) — 7.8 km from other Southern venues; 4.6 km from Eastern. Address: Big Wave Bay Road, Shek O
- Big Wave Bay Beach — Near the entrance of Ladies' Changing Room [22.246554, 114.246739] (CSV line 155) — 7.8 km from other Southern venues; 4.6 km from Eastern. Address: Big Wave Bay Road, Shek O
- Hong Fu Playground — Next to the Toilet [22.253754, 114.135161] (CSV line 162) — 4.0 km from other Southern venues; 3.4 km from Central & Western. Address: Wah Fu Road, Wah Fu Estate
- Shek O Beach — Near Eastern Toilet Block [22.229267, 114.251291] (CSV line 171) — 8.5 km from other Southern venues; 6.6 km from Eastern. Address: Shek O Road, Shek O
- Shek O Beach — Near the entrance of Western Men's Changing Room [22.228316, 114.250233] (CSV line 172) — 8.4 km from other Southern venues; 6.6 km from Eastern. Address: Shek O Road, Shek O
- Shek O Beach — Near the entrance of Western Ladies' Changing Room [22.228316, 114.250233] (CSV line 173) — 8.4 km from other Southern venues; 6.6 km from Eastern. Address: Shek O Road, Shek O
- Wah Chui Street Sitting-out Area — Next to the Meter Room [22.254296, 114.136784] (CSV line 191) — 3.8 km from other Southern venues; 3.3 km from Central & Western. Address: Wah Chui Street, Waterfall Bay
- Waterfall Bay Park — Next to the Toilet [22.250306, 114.134995] (CSV line 192) — 3.9 km from other Southern venues; 3.7 km from Central & Western. Address: Waterfall Bay Road, Waterfall Bay
- Kai Tak Cruise Terminal Park — At Atrium N [22.307287, 114.212038] (CSV line 283) — 3.0 km from other Kowloon City venues; 2.0 km from Kwun Tong. Address: R/F, Kai Tak Cruise Terminal,33 Shing Fung Road, Kai Tak, Kowloon
- Kai Tak Cruise Terminal Park — At Atrium B [22.306413, 114.212838] (CSV line 284) — 3.1 km from other Kowloon City venues; 2.1 km from Kwun Tong. Address: R/F, Kai Tak Cruise Terminal,33 Shing Fung Road, Kai Tak, Kowloon
- Kai Tak Cruise Terminal Park — At Atrium A [22.305352, 114.213994] (CSV line 285) — 3.3 km from other Kowloon City venues; 2.1 km from Kwun Tong. Address: R/F, Kai Tak Cruise Terminal,33 Shing Fung Road, Kai Tak, Kowloon
- Kai Tak Cruise Terminal Park — At Atrium S [22.304625, 114.214874] (CSV line 286) — 3.4 km from other Kowloon City venues; 2.2 km from Kwun Tong. Address: R/F, Kai Tak Cruise Terminal,33 Shing Fung Road, Kai Tak, Kowloon
- Kai Tak Runway Park — Near Arbour No. 1 [22.3052532, 114.2154815] (CSV line 287) — 3.3 km from other Kowloon City venues; 2.1 km from Kwun Tong. Address: 33 Shing Fung Road, Kai Tak, Kowloon
- Kai Tak Runway Park — Near Toilet [22.3049722, 114.2154222] (CSV line 288) — 3.3 km from other Kowloon City venues; 2.1 km from Kwun Tong. Address: 33 Shing Fung Road, Kai Tak, Kowloon
- Lei Yue Mun Road Playground — Beside the toilets [22.300536, 114.238664] (CSV line 383) — 3.0 km from other Kwun Tong venues; 2.5 km from Eastern. Address: Junction of Ko Chiu Road & Lei Yue Mun Road, Yau Tong
- Lei Yue Mun Sports Centre — Near Men's Toilet on the 2/F [22.29238, 114.238675] (CSV line 384) — 3.8 km from other Kwun Tong venues; 1.9 km from Eastern. Address: No.6, Lei Yue Mun Path, Lei Yue Mun Municipal Services Building
- Lei Yue Mun Sports Centre — Near Men's Toilet on the 4/F [22.29238, 114.238675] (CSV line 385) — 3.8 km from other Kwun Tong venues; 1.9 km from Eastern. Address: No.6, Lei Yue Mun Path, Lei Yue Mun Municipal Services Building
- Sam Ka Tsuen Recreation Ground — Outside ladies' toilet [22.294613, 114.237207] (CSV line 407) — 3.5 km from other Kwun Tong venues; 1.9 km from Eastern. Address: Junction of Cha Kwo Ling Road & Sze Shan Street, Sam Ka Tsuen, Yau Tong
- Hung Shing Yeh Beach — Adjacent to the outdoor office [22.218889, 114.119722] (CSV line 604) — 19.2 km from other Islands venues; 6.1 km from Southern. Address: Yung Shue Wan, Lamma Island
- Lo So Shing Beach — Adjacent to the outdoor office [22.204444, 114.122778] (CSV line 605) — 20.1 km from other Islands venues; 6.7 km from Southern. Address: Lo So Shing Beach, Lamma Island
- Yung Shue Wan Playground — Near the Toilet [22.224229, 114.110589] (CSV line 623) — 18.1 km from other Islands venues; 6.7 km from Southern. Address: Yung Shue Wan Playground
- North Kwai Chung Jockey Club Swimming Pool — Near the men's changing room entrance at Pool Deck [22.372758, 114.136701] (CSV line 640) — 3.2 km from other Kwai Tsing venues; 3.1 km from Tsuen Wan. Address: 290 Wo Yi Hop Road, Kwai Chung
- North Kwai Chung Jockey Club Swimming Pool — Near the ladies' changing room entrance at Pool Deck [22.372758, 114.136701] (CSV line 641) — 3.2 km from other Kwai Tsing venues; 3.1 km from Tsuen Wan. Address: 290 Wo Yi Hop Road, Kwai Chung
- North Kwai Chung Jockey Club Swimming Pool — Outside accessible toilet at Pool Deck [22.372758, 114.136701] (CSV line 642) — 3.2 km from other Kwai Tsing venues; 3.1 km from Tsuen Wan. Address: 290 Wo Yi Hop Road, Kwai Chung
- North Kwai Chung Jockey Club Swimming Pool — Lobby near the pool office [22.372758, 114.136701] (CSV line 643) — 3.2 km from other Kwai Tsing venues; 3.1 km from Tsuen Wan. Address: 290 Wo Yi Hop Road, Kwai Chung
- North Kwai Chung Tang Shiu Kin Sports Centre — Lobby [22.3742, 114.1374] (CSV line 644) — 3.3 km from other Kwai Tsing venues; 3.2 km from Tsuen Wan. Address: 292 Wo Yi Hop Road, Kwai Chung
- North Kwai Chung Tang Shiu Kin Sports Centre — Lobby [22.37411, 114.137484] (CSV line 645) — 3.3 km from other Kwai Tsing venues; 3.2 km from Tsuen Wan. Address: 292 Wo Yi Hop Road, Kwai Chung
- Wo Yi Hop Road Sports Ground — Outside Ladies' Changing Room [22.374526, 114.136561] (CSV line 677) — 3.3 km from other Kwai Tsing venues; 3.1 km from Tsuen Wan. Address: 298 Wo Yi Hop Road, Kwai Chung, N.T.
- Wo Yi Hop Road Sports Ground — Near the Store Room next to the Spectator Stand [22.374285, 114.136561] (CSV line 678) — 3.2 km from other Kwai Tsing venues; 3.1 km from Tsuen Wan. Address: 298 Wo Yi Hop Road, Kwai Chung, N.T.
- Hin Keng Sports Centre — Near men's toilet on the 1/F [22.363405, 114.171595] (CSV line 806) — 3.4 km from other Sha Tin venues; 3.4 km from Sham Shui Po. Address: Hin Keng Shopping Centre, Hin Keng Estate, Tai Wai, Sha Tin
- Hin Keng Sports Centre — Near ladies' toilet on the 1/F [22.363405, 114.171595] (CSV line 807) — 3.4 km from other Sha Tin venues; 3.4 km from Sham Shui Po. Address: Hin Keng Shopping Centre, Hin Keng Estate, Tai Wai, Sha Tin
- Ma Wan Tung Wan Beach — Outside Beach Services Building Changing Room [22.350972, 114.061641] (CSV line 901) — 5.5 km from other Tsuen Wan venues; 5.0 km from Kwai Tsing. Address: Pak Lai Road, Ma Wan
- Sham Tsz Street Playground — Outside the male toilet [22.365304, 114.064114] (CSV line 903) — 4.7 km from other Tsuen Wan venues; 4.6 km from Kwai Tsing. Address: Sham Tsz Street,

## Manual overrides applied (0)


## Repaired rows (4)

- CSV line 53: Re-joined name split by unescaped comma: "King George V Memorial Park, Hong Kong"
- CSV line 54: Re-joined name split by unescaped comma: "King George V Memorial Park, Hong Kong"
- CSV line 568: Re-joined name split by unescaped comma: "King George V Memorial Park, Kowloon"
- CSV line 992: Re-joined name split by unescaped comma: "Sir Denys Roberts Squash Courts, Yuen Long"

## Hours that couldn't be parsed (0)

Shown as listed; never counted as "open now".

