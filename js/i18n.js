/* UI strings (English / Korean / Ukrainian) and language-aware word rendering helpers. */
(function (App) {
  'use strict';

  var STRINGS = {
    en: {
      htmlTitle: 'A1 Chinese 500 Words',
      skipToContent: 'Skip to content',
      meaningLanguage: 'Language',
      sections: 'Sections',
      donateLink: 'Donate to freeCodeCamp (new tab)',
      themeToLightLabel: 'Switch to light theme',
      themeToDarkLabel: 'Switch to dark theme',
      tabList: 'Word list',
      tabCards: 'Flashcards',
      tabQuiz: 'Quiz',
      statusLearned: 'Learned {n} / {total} ({pct}%)',

      search: 'Search',
      searchPlaceholder: 'Hanzi, pinyin, meaning',
      show: 'Show',
      filterAll: 'All',
      filterLearned: 'Learned',
      filterUnlearned: 'Not yet',
      resultCount: '{n} words',
      noResults: 'No matching words.',
      listen: 'Listen',
      listenWord: 'Listen to {word}',
      markLearned: 'Mark learned',
      learnedOn: 'Learned',
      deckDue: 'Due ({n})',
      markLearnedLabel: '{word}: mark as learned',
      alsoWritten: 'also',
      alsoRead: 'also',
      example: 'e.g.',
      resetProgress: 'Reset progress',
      confirmReset: 'Delete all learned words?',
      menuProgress: 'Progress',
      exportProgress: 'Export progress',
      importProgress: 'Import progress',
      confirmImport: 'Replace all current progress with the file from {date}? Your current progress will be lost.',
      importFailed: "Couldn't read the progress file. Make sure it is a .json file exported from this site.",

      order: 'Order',
      orderNumber: 'By number',
      orderShuffle: 'Shuffle',
      flipHint: 'Tap or click the card to flip',
      cardLabel: 'Flashcard: {word}. Press to flip',
      know: 'I know',
      reviewNone: "You've finished today's reviews.",
      reviewNext: 'Next review: {date} · words due: {n}',
      reviewNothing: 'No words are scheduled for review yet. Press "I know" on a flashcard to add it to the schedule.',
      srsHint: 'Each "I know" stretches the review interval: 1 → 2 → 4 → 7 → 14 days. "I don\'t know" sends the word back to the start.',
      dontKnow: "I don't know",
      deckDone: "Deck finished! Know {known}, don't know {unknown}",
      deckEmpty: 'You\'ve learned every word! Review them with "All".',
      deckNoLearned: 'No learned words yet. Press "I know" on a flashcard to add words here.',
      reviewUnknown: 'Review {n} unknown words',
      restartDeck: 'Start over',

      quizLength: 'Questions',
      quizSource: 'Words from',
      quizSourceAll: 'All words',
      quizSourceLearned: 'Learned words',
      quizSourceUnlearned: 'Not learned yet',
      quizNotEnough: 'There are no words in this range.',
      quizStart: 'Start quiz',
      quizIntro: 'Look at the hanzi and choose the right meaning.',
      quizQuestion: 'Question {i} / {n}',
      quizScore: 'Score {s}',
      quizPrompt: 'What does this word mean?',
      quizCorrect: 'Correct!',
      quizWrong: 'Wrong. Answer: {a}',
      quizNext: 'Next question',
      quizFinish: 'See results',
      quizDone: 'Quiz complete',
      quizFinalScore: '{s} / {n}',
      quizPerfect: 'All correct!',
      quizMistakes: 'Missed words',
      quizAgain: 'New quiz',
      quizQuit: 'Quit',

      tabWrite: 'Writing',
      tabFavorites: 'Favorites',
      favorite: 'Favorite',
      favoriteLabel: '{word}: add to favorites',
      favoritesEmpty: 'No favorites yet. Press "Favorite" next to a word in the word list to add it here.',
      favoritesPractice: 'Practice with flashcards',
      writeMode: 'Mode',
      modeView: 'Watch',
      modeTrace: 'Trace',
      modeTest: 'From memory',
      wordNumber: 'Word number',
      writeSpeed: 'Speed',
      strokeCounter: 'Stroke {i} / {n}',
      restartWord: '↺ Start over',
      retryChar: '↺ Again',
      retryCharLabel: 'Write {char} again',
      cellDone: '✓ Done',
      cellCurrent: 'Writing',
      cellWaiting: 'Waiting',
      cellMissing: 'No stroke data',
      boxLabel: 'Writing box {n}',
      traceDone: 'Done! {m} wrong strokes',
      testDone: '✓ {word} done · {m} wrong strokes · {h} hints',
      testPerChar: 'Wrong strokes per character',
      writeAgain: 'Write again',
      nextWord: 'Next word →',
      prevWord: 'Previous word',
      nextWordShort: 'Next word',
      writeRecord: 'Best: {m} wrong strokes · written {n} times',
      writeHintTrace: 'Trace the faint characters. When one is done, the next box starts.',
      writeHintTest: 'Write the word from its meaning and pinyin. After 3 misses on the same stroke, you get a hint.',
      writeLoading: 'Loading stroke data…',
      writeNoData: 'Stroke data is missing. Run <code>node scripts/fetch-strokes.js</code> in a terminal, then reload.',
      writeLink: '✍ Write',
      writeLinkLabel: 'Practice writing {word}',
      writtenBadge: 'Written',
      speechUnsupported: "This browser doesn't support speech synthesis.",
      progressNote: 'Progress is saved in this browser only. To move it, save a file with "Export progress" and open it on the other device with "Import progress".',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      menuHome: 'Home',
      language: 'Language',
      languageNote: 'Changes the interface and the word meanings.',
      homeStart: 'Start learning',
      homeReview: 'Review today ({n})',
      homeLearnNew: 'Learn new words',
      homePracticeAll: 'Practice all words',
      homeProgress: 'Your progress',
      homeWritten: 'Written from memory: {n}',
      homeModes: 'Jump to',
      homeImportPrompt: 'Studied on another device?',
      homeHowTo: 'How it works',
      howTo1: 'Word list: press "Mark learned" on words you already know. Learn new ones in Flashcards ("Not yet").',
      howTo2: 'Learned words come back for review after 1 → 2 → 4 → 7 → 14 days: press "Review today" here or "Due" in Flashcards. "I don\'t know" sends a word back to day 1.',
      howTo3: 'Quiz: look at the hanzi and pick its meaning from 4 options.',
      howTo4: 'Writing: watch the stroke order, trace it, then write from memory.',
      howTo5: 'Progress is saved in this browser only. Use "Export progress" to move it to another device.',

    },
    ko: {
      htmlTitle: 'A1 중국어 500단어',
      skipToContent: '본문으로 건너뛰기',
      meaningLanguage: '뜻 언어',
      sections: '메뉴',
      donateLink: 'freeCodeCamp에 기부하기 (새 탭)',
      themeToLightLabel: '라이트 테마로 전환',
      themeToDarkLabel: '다크 테마로 전환',
      tabList: '단어 목록',
      tabCards: '플래시카드',
      tabQuiz: '퀴즈',
      statusLearned: '외운 단어 {n} / {total} ({pct}%)',

      search: '검색',
      searchPlaceholder: '한자, 병음, 뜻',
      show: '보기',
      filterAll: '전체',
      filterLearned: '외운 단어',
      filterUnlearned: '아직 모름',
      resultCount: '{n}개 단어',
      noResults: '검색 결과가 없어요.',
      listen: '발음 듣기',
      listenWord: '{word} 발음 듣기',
      markLearned: '외움 표시',
      learnedOn: '외움',
      deckDue: '복습 ({n})',
      markLearnedLabel: '{word}: 외운 단어로 표시',
      alsoWritten: '또는',
      alsoRead: '또는',
      example: '예:',
      resetProgress: '진도 초기화',
      confirmReset: '외운 단어 기록을 모두 지울까요?',
      menuProgress: '진도',
      exportProgress: '진도 내보내기',
      importProgress: '진도 가져오기',
      confirmImport: '진도 파일({date})로 지금 기록을 모두 바꿀까요? 지금 기록은 사라져요.',
      importFailed: '진도 파일을 읽을 수 없어요. 이 사이트에서 내보낸 .json 파일인지 확인해 주세요.',

      order: '순서',
      orderNumber: '번호순',
      orderShuffle: '섞기',
      flipHint: '카드를 눌러서 뒤집기',
      cardLabel: '플래시카드: {word}. 눌러서 뒤집기',
      know: '알아요',
      reviewNone: '오늘 복습할 단어를 다 봤어요.',
      reviewNext: '다음 복습: {date} · {n}개',
      reviewNothing: '아직 복습 일정에 들어간 단어가 없어요. 플래시카드에서 "알아요"를 누르면 복습 일정에 들어가요.',
      srsHint: '"알아요"를 누를 때마다 복습 간격이 1 → 2 → 4 → 7 → 14일로 늘어나요. "모르겠어요"를 누르면 처음 단계로 돌아가요.',
      dontKnow: '모르겠어요',
      deckDone: '이 덱을 다 봤어요! 알아요 {known}개, 모르겠어요 {unknown}개',
      deckEmpty: '모든 단어를 외웠어요! "전체"로 복습해 보세요.',
      deckNoLearned: '아직 외운 단어가 없어요. 플래시카드에서 "알아요"를 누르면 여기에 모여요.',
      reviewUnknown: '모르는 단어 {n}개 다시 보기',
      restartDeck: '처음부터 다시',

      quizLength: '문제 수',
      quizSource: '출제 범위',
      quizSourceAll: '전체 단어',
      quizSourceLearned: '외운 단어',
      quizSourceUnlearned: '아직 모르는 단어',
      quizNotEnough: '이 범위에는 출제할 단어가 없어요.',
      quizStart: '퀴즈 시작',
      quizIntro: '한자를 보고 알맞은 뜻을 고르세요.',
      quizQuestion: '문제 {i} / {n}',
      quizScore: '점수 {s}',
      quizPrompt: '이 단어의 뜻은?',
      quizCorrect: '정답!',
      quizWrong: '오답. 정답: {a}',
      quizNext: '다음 문제',
      quizFinish: '결과 보기',
      quizDone: '퀴즈 완료',
      quizFinalScore: '{s} / {n}',
      quizPerfect: '모두 맞혔어요!',
      quizMistakes: '틀린 단어',
      quizAgain: '새 퀴즈',
      quizQuit: '그만하기',

      tabWrite: '쓰기',
      tabFavorites: '즐겨찾기',
      favorite: '즐겨찾기',
      favoriteLabel: '{word}: 즐겨찾기에 추가',
      favoritesEmpty: '아직 즐겨찾기한 단어가 없어요. 단어 목록에서 단어 옆 "즐겨찾기"를 누르면 여기에 모여요.',
      favoritesPractice: '플래시카드로 복습',
      writeMode: '모드',
      modeView: '보기',
      modeTrace: '따라 쓰기',
      modeTest: '보지 않고 쓰기',
      wordNumber: '단어 번호',
      writeSpeed: '속도',
      strokeCounter: '획 {i} / {n}',
      restartWord: '↺ 처음부터',
      retryChar: '↺ 다시',
      retryCharLabel: '{char} 다시 쓰기',
      cellDone: '✓ 완료',
      cellCurrent: '쓰는 중',
      cellWaiting: '대기',
      cellMissing: '필순 데이터 없음',
      boxLabel: '{n}번째 글자 쓰기 칸',
      traceDone: '완성! 틀린 획 {m}개',
      testDone: '✓ {word} 완성 · 틀린 획 {m}개 · 힌트 {h}번',
      testPerChar: '글자별 틀린 획',
      writeAgain: '다시 쓰기',
      nextWord: '다음 단어 →',
      prevWord: '이전 단어',
      nextWordShort: '다음 단어',
      writeRecord: '최고 기록: 틀린 획 {m}개 · {n}번 씀',
      writeHintTrace: '흐린 글자를 따라 쓰세요. 한 글자를 다 쓰면 다음 칸으로 넘어가요.',
      writeHintTest: '뜻과 병음을 보고 빈 칸에 써 보세요. 같은 획을 3번 틀리면 힌트가 나와요.',
      writeLoading: '필순 데이터를 불러오는 중…',
      writeNoData: '필순 데이터가 없어요. 터미널에서 <code>node scripts/fetch-strokes.js</code>를 실행한 뒤 새로고침하세요.',
      writeLink: '✍ 쓰기',
      writeLinkLabel: '{word} 쓰기 연습',
      writtenBadge: '쓰기 완료',
      speechUnsupported: '이 브라우저는 음성 합성을 지원하지 않아요.',
      progressNote: '진도는 이 브라우저에만 저장돼요. 다른 기기로 옮기려면 "진도 내보내기"로 파일을 받아 그 기기에서 "진도 가져오기"로 여세요.',
      menuOpen: '메뉴 열기',
      menuClose: '메뉴 닫기',
      menuHome: '홈',
      language: '언어',
      languageNote: '화면 문구와 단어 뜻이 이 언어로 바뀌어요.',
      homeStart: '시작하기',
      homeReview: '오늘 복습 {n}개',
      homeLearnNew: '새 단어 배우기',
      homePracticeAll: '전체 단어 연습',
      homeProgress: '내 진도',
      homeWritten: '보지 않고 쓴 단어 {n}개',
      homeModes: '바로 가기',
      homeImportPrompt: '다른 기기에서 공부했나요?',
      homeHowTo: '사용법',
      howTo1: '단어 목록: 이미 아는 단어는 "외움 표시"를 눌러요. 새 단어는 플래시카드("아직 모름")로 익혀요.',
      howTo2: '외운 단어는 1 → 2 → 4 → 7 → 14일 뒤에 복습으로 돌아와요. 여기서 "오늘 복습"을, 플래시카드에서 "복습"을 누르세요. "모르겠어요"를 누르면 1일 뒤로 돌아가요.',
      howTo3: '퀴즈: 한자를 보고 4개 중에서 뜻을 골라요.',
      howTo4: '쓰기: 필순을 보고, 따라 쓰고, 보지 않고 써 봐요.',
      howTo5: '진도는 이 브라우저에만 저장돼요. 다른 기기로 옮기려면 "진도 내보내기"를 쓰세요.',

    },

    uk: {
      htmlTitle: '500 слів китайської A1',
      skipToContent: 'Перейти до змісту',
      meaningLanguage: 'Мова перекладу',
      sections: 'Меню',
      donateLink: 'Підтримати freeCodeCamp (нова вкладка)',
      themeToLightLabel: 'Увімкнути світлу тему',
      themeToDarkLabel: 'Увімкнути темну тему',
      tabList: 'Слова',
      tabCards: 'Картки',
      tabQuiz: 'Тест',
      statusLearned: 'Вивчено {n} / {total} ({pct}%)',

      search: 'Пошук',
      searchPlaceholder: 'Ієрогліф, піньїнь, переклад',
      show: 'Показати',
      filterAll: 'Усі',
      filterLearned: 'Вивчені',
      filterUnlearned: 'Ще не вивчені',
      resultCount: 'Слів: {n}',
      noResults: 'Нічого не знайдено.',
      listen: 'Прослухати',
      listenWord: 'Прослухати {word}',
      markLearned: 'Позначити вивченим',
      learnedOn: 'Вивчено',
      deckDue: 'Повторити ({n})',
      markLearnedLabel: '{word}: позначити як вивчене',
      alsoWritten: 'або',
      alsoRead: 'або',
      example: 'напр.:',
      resetProgress: 'Скинути прогрес',
      confirmReset: 'Видалити всі позначки вивчених слів?',
      menuProgress: 'Прогрес',
      exportProgress: 'Експорт прогресу',
      importProgress: 'Імпорт прогресу',
      confirmImport: 'Замінити весь поточний прогрес даними з файлу ({date})? Поточний прогрес буде втрачено.',
      importFailed: 'Не вдалося прочитати файл. Переконайтеся, що це .json-файл, експортований із цього сайту.',

      order: 'Порядок',
      orderNumber: 'За номером',
      orderShuffle: 'Перемішати',
      flipHint: 'Натисніть на картку, щоб перевернути',
      cardLabel: 'Картка: {word}. Натисніть, щоб перевернути',
      know: 'Знаю',
      reviewNone: 'На сьогодні все повторено.',
      reviewNext: 'Наступне повторення: {date} · слів: {n}',
      reviewNothing: 'У розкладі повторень ще немає слів. Натисніть «Знаю» на картці, щоб додати слово.',
      srsHint: 'Кожне «Знаю» збільшує інтервал повторення: 1 → 2 → 4 → 7 → 14 днів. «Не знаю» повертає слово на перший етап.',
      dontKnow: 'Не знаю',
      deckDone: 'Колоду пройдено! Знаю: {known}, не знаю: {unknown}',
      deckEmpty: 'Усі слова вивчено! Повторіть їх у режимі «Усі».',
      deckNoLearned: 'Вивчених слів поки немає. Натисніть «Знаю» на картці, щоб додати слова сюди.',
      reviewUnknown: 'Повторити невідомі ({n})',
      restartDeck: 'Почати спочатку',

      quizLength: 'Кількість питань',
      quizSource: 'Слова для тесту',
      quizSourceAll: 'Усі слова',
      quizSourceLearned: 'Вивчені',
      quizSourceUnlearned: 'Ще не вивчені',
      quizNotEnough: 'У цьому наборі немає слів для тесту.',
      quizStart: 'Почати тест',
      quizIntro: 'Подивіться на ієрогліф і виберіть правильний переклад.',
      quizQuestion: 'Питання {i} / {n}',
      quizScore: 'Бали: {s}',
      quizPrompt: 'Що означає це слово?',
      quizCorrect: 'Правильно!',
      quizWrong: 'Неправильно. Відповідь: {a}',
      quizNext: 'Далі',
      quizFinish: 'Результат',
      quizDone: 'Тест завершено',
      quizFinalScore: '{s} / {n}',
      quizPerfect: 'Усе правильно!',
      quizMistakes: 'Помилки',
      quizAgain: 'Новий тест',
      quizQuit: 'Завершити',

      tabWrite: 'Письмо',
      tabFavorites: 'Обране',
      favorite: 'Обране',
      favoriteLabel: '{word}: додати до обраного',
      favoritesEmpty: 'Обраних слів поки немає. Натисніть «Обране» біля слова у списку слів, щоб додати його сюди.',
      favoritesPractice: 'Повторити картками',
      writeMode: 'Режим',
      modeView: 'Перегляд',
      modeTrace: 'Обведення',
      modeTest: 'Напам’ять',
      wordNumber: 'Номер слова',
      writeSpeed: 'Швидкість',
      strokeCounter: 'Риса {i} / {n}',
      restartWord: '↺ Спочатку',
      retryChar: '↺ Ще раз',
      retryCharLabel: 'Написати {char} ще раз',
      cellDone: '✓ Готово',
      cellCurrent: 'Пишемо',
      cellWaiting: 'Далі',
      cellMissing: 'Немає даних',
      boxLabel: 'Клітинка для {n}-го ієрогліфа',
      traceDone: 'Готово! Помилок: {m}',
      testDone: '✓ {word} · помилок: {m} · підказок: {h}',
      testPerChar: 'Помилки за ієрогліфами',
      writeAgain: 'Написати ще раз',
      nextWord: 'Наступне слово →',
      prevWord: 'Попереднє слово',
      nextWordShort: 'Наступне слово',
      writeRecord: 'Найкраще: помилок {m} · спроб {n}',
      writeHintTrace: 'Обведіть світлий ієрогліф. Після кожного ієрогліфа відкривається наступна клітинка.',
      writeHintTest: 'Напишіть слово за перекладом і піньїнем. Після 3 помилок на одній рисі з’явиться підказка.',
      writeLoading: 'Завантаження даних про порядок рис…',
      writeNoData: 'Немає даних про порядок рис. Виконайте в терміналі <code>node scripts/fetch-strokes.js</code> і оновіть сторінку.',
      writeLink: '✍ Письмо',
      writeLinkLabel: 'Писати {word}',
      writtenBadge: 'Написано',
      speechUnsupported: 'Цей браузер не підтримує синтез мовлення.',
      progressNote: 'Прогрес зберігається лише в цьому браузері. Щоб перенести його, збережіть файл через «Експорт прогресу» і відкрийте його на іншому пристрої через «Імпорт прогресу».',
      menuOpen: 'Відкрити меню',
      menuClose: 'Закрити меню',
      menuHome: 'Головна',
      language: 'Мова',
      languageNote: 'Змінює мову інтерфейсу та значень слів.',
      homeStart: 'Почати навчання',
      homeReview: 'Повторити сьогодні ({n})',
      homeLearnNew: 'Вчити нові слова',
      homePracticeAll: 'Повторити всі слова',
      homeProgress: 'Ваш прогрес',
      homeWritten: 'Написано з пам’яті: {n}',
      homeModes: 'Перейти до',
      homeImportPrompt: 'Навчалися на іншому пристрої?',
      homeHowTo: 'Як це працює',
      howTo1: 'Список слів: позначте знайомі слова кнопкою «Позначити вивченим». Нові слова вчіть у Картках («Ще не вивчені»).',
      howTo2: 'Вивчені слова повертаються на повторення через 1 → 2 → 4 → 7 → 14 днів: натисніть «Повторити сьогодні» тут або «Повторити» в Картках. «Не знаю» повертає слово на перший день.',
      howTo3: 'Тест: подивіться на ієрогліф і виберіть значення з 4 варіантів.',
      howTo4: 'Письмо: дивіться порядок рис, обводьте, а потім пишіть з пам’яті.',
      howTo5: 'Прогрес зберігається лише в цьому браузері. Щоб перенести його, скористайтеся «Експорт прогресу».',

    },
  };

  var LANGS = ['en', 'uk', 'ko'];
  var lang = App.storage.get('lang', 'en');
  if (LANGS.indexOf(lang) === -1) lang = 'en';

  function t(key, vars) {
    var s = STRINGS[lang][key];
    if (s === undefined) s = STRINGS.en[key];
    if (s === undefined) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] !== undefined ? vars[name] : m;
      });
    }
    return s;
  }

  /** Update every element marked with data-i18n* attributes. */
  /** Noto Sans KR (large) is only fetched once Korean is the interface language. */
  function loadKoreanFont() {
    if (lang !== 'ko' || document.getElementById('font-kr')) return;
    var link = document.createElement('link');
    link.id = 'font-kr';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap';
    document.head.appendChild(link);
  }

  function apply(root) {
    root = root || document;
    document.documentElement.lang = lang;
    loadKoreanFont();
    document.title = t('htmlTitle');
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    root.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
    });
  }

  function setLang(next) {
    if (LANGS.indexOf(next) === -1 || next === lang) return;
    lang = next;
    App.storage.set('lang', lang);
    apply();
    App.emit('lang', lang);
  }

  /* ---- Word rendering helpers (return HTML strings) ---- */

  var esc = App.util.escapeHtml;

  function meaning(w) {
    return w[lang];
  }

  function pinyinHtml(w) {
    var html = '<span class="pinyin" lang="zh-Latn-pinyin">' + esc(w.pinyin) + '</span>';
    if (w.pinyinAlt.length) {
      html +=
        ' <span class="word-extra">' + esc(t('alsoRead')) + ' ' +
        '<span class="pinyin" lang="zh-Latn-pinyin">' + esc(w.pinyinAlt.join(', ')) + '</span></span>';
    }
    return html;
  }

  /** "또는 爸 bà", "예: 第二 dì-èr" */
  function extrasHtml(w) {
    var parts = [];
    w.variants.forEach(function (v) {
      parts.push(
        esc(t('alsoWritten')) + ' <span class="hanzi" lang="zh-CN">' + esc(v.hanzi) + '</span>' +
        (v.pinyin && v.pinyin !== w.pinyin ? ' <span class="pinyin" lang="zh-Latn-pinyin">' + esc(v.pinyin) + '</span>' : '')
      );
    });
    if (w.example) {
      parts.push(
        esc(t('example')) + ' <span class="hanzi" lang="zh-CN">' + esc(w.example.hanzi) + '</span>' +
        (w.example.pinyin ? ' <span class="pinyin" lang="zh-Latn-pinyin">' + esc(w.example.pinyin) + '</span>' : '')
      );
    }
    return parts.length ? '<span class="word-extra">' + parts.join(' · ') + '</span>' : '';
  }

  App.i18n = {
    t: t,
    apply: apply,
    setLang: setLang,
    lang: function () {
      return lang;
    },
  };

  App.view = {
    meaning: meaning,
    pinyinHtml: pinyinHtml,
    extrasHtml: extrasHtml,
  };
})(window.App);
