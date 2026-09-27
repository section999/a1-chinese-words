# A1 中文 500

HSK A1 중국어 500단어 학습 사이트입니다. 순수 HTML/CSS/JavaScript로 만들었고 빌드 과정이 없습니다.

## 실행

`index.html`을 브라우저에서 바로 열면 됩니다 (`file://`에서도 동작).

- 글꼴(Lato, Noto Sans KR)은 온라인에서 불러옵니다. 오프라인이면 시스템 글꼴로 대체됩니다.
- 발음은 브라우저의 Web Speech API(zh-CN)를 사용합니다. 중국어 음성이 설치되어 있지 않으면 기본 음성으로 읽거나 소리가 나지 않을 수 있습니다.
- 필순 쓰기는 `data/strokes.js`와 `vendor/hanzi-writer.min.js`를 사용하므로 인터넷 없이 동작합니다. 두 파일(약 650KB)은 쓰기 탭을 처음 열 때 불러오므로 첫 화면 로딩에는 영향이 없습니다.

## 간격 반복 복습

외운 단어는 복습 일정에 들어갑니다. 복습할 날이 된 단어가 있으면 홈의 큰 버튼이 **Review today (N)**으로 바뀌고, 누르면 그 단어들이 플래시카드로 나옵니다 (가장 오래 밀린 단어부터).

| 단계 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 다음 복습까지 | 1일 | 2일 | 4일 | 7일 | 14일 |

- 새로 외운 단어(플래시카드 **I know**, 단어 목록의 **Learned**)는 1단계, 다음 날 복습합니다.
- 복습할 날이 된 단어에 **I know** → 한 단계 올라갑니다. 5단계에서는 계속 14일 간격입니다.
- **I don't know** → 외운 단어는 외운 상태 그대로 1단계로 돌아가 다음 날 복습합니다 (어느 덱에서든 같음). 단어 목록에서 외움 표시를 끄면 일정에서 빠집니다.
- 플래시카드의 **Due (N)** 덱이나 홈의 **Review today (N)**로 복습할 단어를 볼 수 있습니다. 홈에는 다음 복습 날짜가 표시됩니다.
- 날짜는 브라우저의 현지 시간 기준으로, 자정에 바뀝니다.

## 필순 쓰기 (4: 쓰기 탭)

단어 전체를 田자 칸에 한 글자씩 이어서 씁니다. 한 글자를 다 쓰면 다음 칸으로 자동으로 넘어갑니다.

- **보기**: 첫 글자 첫 획부터 마지막 글자 마지막 획까지 이어서 재생 (속도 조절)
- **따라 쓰기**: 흐린 글자를 따라 쓰기. 같은 획을 2번 틀리면 힌트
- **보지 않고 쓰기**: 뜻·병음만 보고 쓰기. 같은 획을 3번 틀리면 힌트. 결과(틀린 획, 힌트 수)를 기록

`#write/83`처럼 주소로 단어를 직접 열 수 있고, 단어 목록·플래시카드의 ✍ 버튼도 이 주소로 이동합니다.
"보지 않고 쓰기" 기록은 외운 단어 진도와 따로 저장되며, 단어 목록에 ✍ 표시가 붙습니다.

### 필순 데이터 다시 받기

단어 데이터를 바꿨다면 필순 데이터도 다시 받으세요 (Node 18 이상, 인터넷 필요, 한 번만).

```sh
node scripts/convert.js
node scripts/fetch-strokes.js    # data/strokes.js 생성 (현재 301자, 약 614KB)
```

필순 데이터가 없는 글자(현재 零의 변형 `〇` 하나)는 칸에 "필순 데이터 없음"으로 표시됩니다.

## 데이터 변환

`vocabulary.txt`를 수정했다면 다시 변환하세요 (Node.js 필요, 외부 패키지 없음).

```sh
node scripts/convert.js          # data/vocabulary.js 생성
node scripts/convert.js --json   # data/vocabulary.json도 함께 생성
```

`file://`에서는 `fetch()`로 JSON을 읽을 수 없어서, 사이트는 `window.VOCABULARY`를 정의하는 `data/vocabulary.js`를 `<script>`로 불러옵니다.

### 원본 표기 정리 규칙

| 원본 | 결과 |
|---|---|
| `爸爸\|爸` / `bàba\|bà` | 대표형 `爸爸 bàba` + 변형 `爸 bà` |
| `白(形)`, `分(名、量)` | 품사 (`pos: ["adj"]`, `["n","mw"]`). 데이터에만 남기고 화면에는 표시하지 않음 |
| `们(朋友们)` / `men(péngyoumen)` | 예시 `朋友们 péngyoumen` |
| `bāng/máng`, `chàng//gē` | 이합사 기호 제거 → `bāngmáng`, `chànggē` |
| `chū/·lái`, `bié·rén` | 경성 기호 제거 → `chūlái`, `biérén` |
| `shéi/shuí` (한 글자 단어) | 다른 발음 `pinyinAlt: ["shuí"]` |
| `yǒu(yī)xiē` | 괄호만 제거 → `yǒuyīxiē` |
| `零\|O` | 영문자 O를 `〇`로 수정 |

원본 값은 각 항목의 `raw`에 남아 있습니다. 子·们처럼 단독으로 읽으면 어색한 접미사는 예시 단어(桌子, 朋友们)로 발음합니다 (`speak` 필드).

## 파일 구조

```
index.html            페이지 (홈 / 단어 목록 / 플래시카드 / 퀴즈 / 쓰기 / 즐겨찾기)
vocabulary.txt        원본 데이터 (TSV)
data/vocabulary.js    변환 결과
scripts/convert.js    변환 스크립트
scripts/fetch-strokes.js  필순 데이터 받기 → data/strokes.js
data/strokes.js       필순 데이터 (생성 파일)
vendor/               Hanzi Writer 3.7.3 + 라이선스 파일
css/style.css         스타일, 테마 변수 (다크 기본 / 라이트)
js/core.js            네임스페이스, 이벤트, 공용 함수
js/storage.js         localStorage, 외운 단어 진도
js/srs.js             간격 반복 복습 일정
js/favorites.js       즐겨찾기 단어 저장, 별 버튼
js/favorites-view.js  즐겨찾기 페이지
js/i18n.js            UI 문구 (영어 / 우크라이나어 / 한국어), 단어 표시 도우미
js/speech.js          발음 (Web Speech API)
js/list.js            단어 목록
js/flashcards.js      플래시카드
js/quiz.js            퀴즈
js/writing.js         필순 쓰기 (필순 데이터는 탭을 처음 열 때 로드)
js/backup.js          진도 백업 내보내기 / 가져오기
js/home.js            홈(첫 화면): 상황별 시작 버튼, 진도 요약
js/app.js             초기화, 화면 전환(주소 해시), 햄버거 메뉴, 테마, 언어, 단축키
```

## 홈과 메뉴

- 주소에 해시 없이 들어오면 홈이 보입니다. `#cards`, `#write/83` 같은 주소는 홈을 거치지 않습니다. 헤더의 "A1 中文 500"이나 메뉴의 Home으로 돌아갑니다.
- 홈의 큰 버튼은 상황에 따라 바뀝니다.

  | 상황 | 버튼 | 이동 |
  |---|---|---|
  | 처음 방문 | Start learning | 단어 목록 (Not yet 필터) |
  | 복습할 단어가 있음 | Review today (N) | 플래시카드 (복습할 단어) |
  | 복습할 단어가 없음 | Learn new words | 단어 목록 (Not yet 필터) |
  | 500개를 다 외움 | Practice all words | 플래시카드 (전체 단어) |

- 외운 단어나 쓰기 기록이 있으면 진도 요약이 나옵니다.
- 헤더 오른쪽에는 freeCodeCamp 기부 링크(❤️), 테마 전환, 햄버거 버튼(☰)이 있습니다.
- 햄버거 메뉴에서 화면 이동, 언어(English / Українська / 한국어), 진도 내보내기·가져오기를 합니다. Language와 Progress는 접혀 있고, 메뉴를 열 때마다 다시 접힌 상태로 시작합니다. 언어는 화면 문구와 단어 뜻을 함께 바꿉니다. 기본값은 영어입니다 (`vocabulary.txt`의 영어 열).

## 단축키

- 플래시카드: `Space` 뒤집기, `←` 모르겠어요, `→` 알아요, `P` 발음
- 퀴즈: `1`–`4` 선택, `Enter` 다음, `P` 발음
- 쓰기: `←`/`→` 이전/다음 단어, `R` 처음부터, `P` 발음, (보기 모드) `Space` 재생

## 즐겨찾기 (Favorites)

단어 목록에서 단어 옆 **Favorite**(즐겨찾기) 버튼을 누르면 즐겨찾기에 들어가고, 다시 누르면 빠집니다.

- 5번째 탭 **Favorites**: 즐겨찾기한 단어 목록(번호순)과 "Practice with flashcards" 버튼(즐겨찾기 단어만으로 플래시카드)

## 저장되는 값 (localStorage, `a1zh:` 접두사)

`learned`(외운 단어 번호 배열), `srs`(단어별 복습 일정: 단계, 다음 복습 날짜, 마지막 복습 날짜), `writing`(단어별 쓰기 기록: 시도 횟수, 가장 적게 틀린 획 수, 마지막 날짜), `favorites`(즐겨찾기 단어 번호 배열), `lang`, `theme`, 목록 필터·순서(`listFilter`, `listOrder`), 플래시카드 덱·순서(`deckMode`, `deckOrder`), 퀴즈 설정(`quizLength`, `quizSource`), 쓰기 설정(`writeWord`, `writeMode`, `writeSpeed`).

## 백업

햄버거 메뉴(☰)의 **Export progress**(진도 내보내기)는 위의 저장 값 전체를 `a1zh-backup-YYYY-MM-DD.json` 파일로 받습니다. 다른 브라우저나 기기에서 **Import progress**(메뉴 또는 홈)로 그 파일을 고르면, 확인 후 지금 기록을 파일 내용으로 **모두 바꾸고** 페이지를 새로 고칩니다 (합치지 않음). 이 사이트에서 내보낸 파일이 아니면 가져오지 않습니다.

## 라이선스

- Hanzi Writer: MIT (`vendor/LICENSE-hanzi-writer.txt`)
- 필순 데이터: hanzi-writer-data / Make Me a Hanzi, Arphic Public License (`vendor/ARPHICPL.txt`, `vendor/COPYING-stroke-data.md`)
