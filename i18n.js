// i18n.js - 多語言支援
// v2.0.0

const translations = {
    en: {
        // Start Screen
        'game.title': 'Minimal Parking',
        'game.subtitle': 'One-hand control · Easy to play',
        'btn.verify': '🌍 Verify with World ID',
        'btn.start': 'Start Game',
        'status.unverified': '⚠️ Not Verified',
        'status.verified': '✅ Verified',
        'hint.instruction': 'Drag to drive · Park to win',

        // Game UI
        'ui.level': 'Level',
        'ui.score': 'Score',
        'ui.time': 'Time',
        'ui.dragHint': 'Drag to control',

        // Level Complete
        'complete.title': '🎉 Complete!',
        'complete.time': 'Time',
        'complete.bonus': 'Time Bonus',
        'complete.total': 'Total Score',
        'complete.perfect': 'Perfect Parking',
        'complete.accuracy': 'Accuracy',
        'btn.next': 'Next Level',
        'btn.share': '📤 Share',

        // Game Over
        'gameover.title': '💥 Crashed!',
        'gameover.message': 'Drive carefully, avoid obstacles',
        'gameover.newHighscore': 'New High Score!',
        'gameover.yourRank': 'Your Rank',
        'btn.retry': 'Try Again',

        // Badge
        'badge.verified': 'Verified Human',
        'badge.orb': 'Orb Verified',

        // Verification messages (for minikit-integration.js)
        'verify.waiting': '⏳ Waiting...',
        'verify.processing': '✅ Verified, processing...',
        'verify.error.backend': 'Backend error',
        'verify.error.failed': 'Verification failed',

        // Tokenomics
        'btn.claim': 'Claim',
        'ui.slowdown': 'Slowdown',
        'ui.promoHint': 'Promo: 50% $CPK cashback on purchases!',
        'ui.slowdownHint': 'Slowdown makes your car slower, easier to park',
        'ui.claimingWait': 'Confirming, please wait...',
        'ui.dailyLimitReached': 'Daily limit reached',
        'ui.dailyRemaining': 'Today you can claim',

        // Leaderboard
        'leaderboard.title': 'Parking Champions',
        'leaderboard.totalPlayers': '',
        'leaderboard.players': 'players',
        'leaderboard.loading': 'Loading...',
        'leaderboard.error': 'Failed to load',
        'leaderboard.empty': 'No data yet',
        'leaderboard.you': 'You',
        'leaderboard.yourRank': 'Your Rank',
        'leaderboard.youAreDriver': 'You are Driver',
        'leaderboard.driver': '',

        // Revive
        'revive.title': 'Continue?',
        'revive.message': "Don't give up! You're so close!",
        'revive.continue': 'Continue',
        'revive.giveUp': 'Give Up',
        'revive.notEnoughCPK': 'Not enough CPK',
        'revive.needCPK': 'Need 100 CPK',
        'revive.current': 'Current',

        // Share
        'share.title': 'Share Score',
        'share.copy': 'Copy Link',
        'share.more': 'More Options',
        'share.copied': 'Copied!',

        // Purchase
        'purchase.useWorldApp': 'Please use World App for payment',
        'purchase.initiating': 'Initiating payment...',
        'purchase.processing': 'Payment successful, processing...',
        'purchase.cashback': 'CPK cashback',
        'purchase.failed': 'Purchase failed',
        'purchase.cancelled': 'Payment cancelled',
        'purchase.error': 'Purchase failed, please retry',
        'purchase.desc.single': 'Single Slowdown (-20%)',
        'purchase.desc.l1': 'L1 Badge (3hr)',
        'purchase.desc.l2': 'L2 Badge (3hr)',
        'purchase.desc.l3': 'L3 Badge (3hr)',
        'purchase.desc.default': 'Purchase',

        // Claim
        'claim.gettingWallet': 'Getting wallet address...',
        'claim.connectWallet': 'Please connect wallet first',
        'claim.success': 'Successfully claimed',
        'claim.remaining': 'Remaining',
        'claim.dailyRemaining': 'Today can claim',
        'claim.dailyLimitReached': 'Daily limit reached, come back tomorrow!',
        'claim.dailyLimitReachedFull': 'Daily limit reached',
        'claim.canClaimTomorrow': 'Can claim tomorrow',
        'claim.failed': 'Claim failed',
        'claim.error': 'Claim failed, please retry',

        // Rating
        'rating.title': 'Enjoying CarParKing?',
        'rating.message': 'If you like our game, please give us a 5-star rating! Your support helps us improve.',
        'rating.rateNow': '⭐ Rate Now',
        'rating.later': 'Later',
        'rating.thanks': 'Thank you for your support! 💛',

        // Time
        'time.expired': 'Expired',
        'time.hour': 'h',
        'time.min': 'm',

        // UI Extended
        'ui.tempBadge': 'Temp',
        'ui.noActiveEffects': 'No active effects',

        // Session
        'session.slowdownsReset': 'Slowdowns reset',
        'session.lost': 'lost',
    },

    'zh-TW': {
        'game.title': '極簡停車',
        'game.subtitle': '單手操作 · 輕鬆上手',
        'btn.verify': '🌍 使用 World ID 驗證',
        'btn.start': '開始遊戲',
        'status.unverified': '⚠️ 尚未驗證',
        'status.verified': '✅ 已驗證',
        'hint.instruction': '拖曳駕駛 · 停好即贏',

        'ui.level': '關卡',
        'ui.score': '分數',
        'ui.time': '時間',
        'ui.dragHint': '拖曳控制方向',

        'complete.title': '🎉 過關！',
        'complete.time': '耗時',
        'complete.bonus': '時間獎勵',
        'complete.total': '總分',
        'complete.perfect': '完美停車',
        'complete.accuracy': '精準度',
        'btn.next': '下一關',
        'btn.share': '📤 分享',

        'gameover.title': '💥 撞車了！',
        'gameover.message': '小心駕駛，避開障礙物',
        'gameover.newHighscore': '新紀錄！',
        'gameover.yourRank': '你的排名',
        'btn.retry': '再試一次',

        'badge.verified': '真人驗證',
        'badge.orb': 'Orb 驗證',

        'verify.waiting': '⏳ 等待中...',
        'verify.processing': '✅ 驗證完成，處理中...',
        'verify.error.backend': '後端錯誤',
        'verify.error.failed': '驗證失敗',

        // Tokenomics
        'btn.claim': '領取',
        'ui.slowdown': '降速',
        'ui.promoHint': '特惠期間：課金享 50% $CPK 返還！',
        'ui.slowdownHint': '減速功能讓車子變慢，更容易控制停車',
        'ui.claimingWait': '確認中，請稍候...',
        'ui.dailyLimitReached': '今日額度已達上限',
        'ui.dailyRemaining': '今日還可領取',

        // Leaderboard
        'leaderboard.title': '停車大王真人榜',
        'leaderboard.totalPlayers': '共',
        'leaderboard.players': '位玩家',
        'leaderboard.loading': '載入中...',
        'leaderboard.error': '載入失敗',
        'leaderboard.empty': '暫無資料',
        'leaderboard.you': '你',
        'leaderboard.yourRank': '你的排名',
        'leaderboard.youAreDriver': '你是第',
        'leaderboard.driver': '位司機',

        // Revive
        'revive.title': '要繼續嗎？',
        'revive.message': '別放棄！你快成功了！',
        'revive.continue': '繼續',
        'revive.giveUp': '放棄',
        'revive.notEnoughCPK': 'CPK 不足',
        'revive.needCPK': '需要 100 CPK',
        'revive.current': '目前',

        // Share
        'share.title': '分享成績',
        'share.copy': '複製連結',
        'share.more': '更多選項',
        'share.copied': '已複製！',

        // Purchase
        'purchase.useWorldApp': '請在 World App 中使用支付功能',
        'purchase.initiating': '正在發起支付...',
        'purchase.processing': '支付成功，處理中...',
        'purchase.cashback': 'CPK 返還',
        'purchase.failed': '購買處理失敗',
        'purchase.cancelled': '支付已取消',
        'purchase.error': '購買失敗，請重試',
        'purchase.desc.single': '單次降速 (-20%)',
        'purchase.desc.l1': 'L1 徽章 (3小時)',
        'purchase.desc.l2': 'L2 徽章 (3小時)',
        'purchase.desc.l3': 'L3 徽章 (3小時)',
        'purchase.desc.default': '購買',

        // Claim
        'claim.gettingWallet': '正在獲取錢包地址...',
        'claim.connectWallet': '請先連接錢包',
        'claim.success': '成功領取',
        'claim.remaining': '剩餘',
        'claim.dailyRemaining': '今日還可領',
        'claim.dailyLimitReached': '今日額度已用完，明日再來！',
        'claim.dailyLimitReachedFull': '今日領取額度已用完',
        'claim.canClaimTomorrow': '明日可再領取',
        'claim.failed': '領取失敗',
        'claim.error': '領取失敗，請重試',

        // Rating
        'rating.title': '喜歡極簡停車嗎？',
        'rating.message': '如果你喜歡我們的遊戲，請給我們五星好評！你的支持是我們進步的動力。',
        'rating.rateNow': '⭐ 立即評分',
        'rating.later': '稍後再說',
        'rating.thanks': '感謝你的支持！💛',

        // Time
        'time.expired': '已過期',
        'time.hour': '小時',
        'time.min': '分',

        // UI Extended
        'ui.tempBadge': '臨時',
        'ui.noActiveEffects': '無啟用效果',

        // Session
        'session.slowdownsReset': '降速效果已重置',
        'session.lost': '損失',
    },

    ja: {
        'game.title': 'ミニマル駐車',
        'game.subtitle': '片手操作 · 簡単プレイ',
        'btn.verify': '🌍 World IDで認証',
        'btn.start': 'ゲーム開始',
        'status.unverified': '⚠️ 未認証',
        'status.verified': '✅ 認証済み',
        'hint.instruction': 'ドラッグで運転 · 駐車で勝利',

        'ui.level': 'レベル',
        'ui.score': 'スコア',
        'ui.time': 'タイム',
        'ui.dragHint': 'ドラッグで操作',

        'complete.title': '🎉 クリア！',
        'complete.time': 'タイム',
        'complete.bonus': 'タイムボーナス',
        'complete.total': '合計スコア',
        'complete.perfect': 'パーフェクト',
        'complete.accuracy': '精度',
        'btn.next': '次のレベル',
        'btn.share': '📤 シェア',

        'gameover.title': '💥 クラッシュ！',
        'gameover.message': '障害物に注意して運転',
        'gameover.newHighscore': '新記録！',
        'gameover.yourRank': 'あなたの順位',
        'btn.retry': 'もう一度',

        'badge.verified': '認証済み',
        'badge.orb': 'Orb認証',

        'verify.waiting': '⏳ 待機中...',
        'verify.processing': '✅ 認証完了、処理中...',
        'verify.error.backend': 'バックエンドエラー',
        'verify.error.failed': '認証失敗',

        // Tokenomics
        'btn.claim': '受取',
        'ui.slowdown': '減速',
        'ui.promoHint': 'プロモ：購入で50% $CPKキャッシュバック！',
        'ui.slowdownHint': '減速機能で車がゆっくりに、駐車しやすく',
        'ui.claimingWait': '確認中、お待ちください...',
        'ui.dailyLimitReached': '本日の上限に達しました',
        'ui.dailyRemaining': '本日の残り受取可能',

        // Leaderboard
        'leaderboard.title': '駐車王ランキング',
        'leaderboard.totalPlayers': '',
        'leaderboard.players': '人のプレイヤー',
        'leaderboard.loading': '読み込み中...',
        'leaderboard.error': '読み込み失敗',
        'leaderboard.empty': 'データなし',
        'leaderboard.you': 'あなた',
        'leaderboard.yourRank': 'あなたの順位',
        'leaderboard.youAreDriver': 'あなたはドライバー',
        'leaderboard.driver': '番です',

        // Revive
        'revive.title': '続けますか？',
        'revive.message': '諦めないで！もう少しです！',
        'revive.continue': '続ける',
        'revive.giveUp': '諦める',
        'revive.notEnoughCPK': 'CPKが不足',
        'revive.needCPK': '100 CPKが必要',
        'revive.current': '現在',

        // Share
        'share.title': 'スコアをシェア',
        'share.copy': 'リンクをコピー',
        'share.more': 'その他',
        'share.copied': 'コピーしました！',

        // Purchase
        'purchase.useWorldApp': 'World Appで決済をご利用ください',
        'purchase.initiating': '決済を開始しています...',
        'purchase.processing': '決済成功、処理中...',
        'purchase.cashback': 'CPKキャッシュバック',
        'purchase.failed': '購入処理に失敗しました',
        'purchase.cancelled': '決済がキャンセルされました',
        'purchase.error': '購入失敗、もう一度お試しください',
        'purchase.desc.single': '1回減速 (-20%)',
        'purchase.desc.l1': 'L1バッジ (3時間)',
        'purchase.desc.l2': 'L2バッジ (3時間)',
        'purchase.desc.l3': 'L3バッジ (3時間)',
        'purchase.desc.default': '購入',

        // Claim
        'claim.gettingWallet': 'ウォレットアドレスを取得中...',
        'claim.connectWallet': 'まずウォレットを接続してください',
        'claim.success': '受取成功',
        'claim.remaining': '残り',
        'claim.dailyRemaining': '本日受取可能',
        'claim.dailyLimitReached': '本日の上限に達しました、明日またお越しください！',
        'claim.dailyLimitReachedFull': '本日の受取上限に達しました',
        'claim.canClaimTomorrow': '明日受取可能',
        'claim.failed': '受取失敗',
        'claim.error': '受取失敗、もう一度お試しください',

        // Rating
        'rating.title': 'CarParKingを楽しんでいますか？',
        'rating.message': 'ゲームを気に入っていただけたら、5つ星評価をお願いします！皆様のサポートが私たちの励みになります。',
        'rating.rateNow': '⭐ 今すぐ評価',
        'rating.later': '後で',
        'rating.thanks': 'ご支援ありがとうございます！💛',

        // Time
        'time.expired': '期限切れ',
        'time.hour': '時間',
        'time.min': '分',

        // UI Extended
        'ui.tempBadge': '一時',
        'ui.noActiveEffects': '有効な効果なし',

        // Session
        'session.slowdownsReset': '減速効果がリセットされました',
        'session.lost': '失った',
    },

    ko: {
        'game.title': '미니멀 주차',
        'game.subtitle': '한 손 조작 · 쉬운 플레이',
        'btn.verify': '🌍 World ID로 인증',
        'btn.start': '게임 시작',
        'status.unverified': '⚠️ 미인증',
        'status.verified': '✅ 인증됨',
        'hint.instruction': '드래그로 운전 · 주차해서 승리',

        'ui.level': '레벨',
        'ui.score': '점수',
        'ui.time': '시간',
        'ui.dragHint': '드래그로 조작',

        'complete.title': '🎉 완료!',
        'complete.time': '시간',
        'complete.bonus': '시간 보너스',
        'complete.total': '총점',
        'complete.perfect': '퍼펙트 주차',
        'complete.accuracy': '정확도',
        'btn.next': '다음 레벨',
        'btn.share': '📤 공유',

        'gameover.title': '💥 충돌!',
        'gameover.message': '장애물을 피해서 운전하세요',
        'gameover.newHighscore': '새 기록!',
        'gameover.yourRank': '내 순위',
        'btn.retry': '다시 시도',

        'badge.verified': '인증된 사람',
        'badge.orb': 'Orb 인증',

        'verify.waiting': '⏳ 대기 중...',
        'verify.processing': '✅ 인증 완료, 처리 중...',
        'verify.error.backend': '백엔드 오류',
        'verify.error.failed': '인증 실패',

        // Tokenomics
        'btn.claim': '수령',
        'ui.slowdown': '감속',
        'ui.promoHint': '프로모: 구매 시 50% $CPK 캐시백!',
        'ui.slowdownHint': '감속 기능으로 차가 느려져 주차가 쉬워져요',
        'ui.claimingWait': '확인 중, 잠시만 기다려주세요...',
        'ui.dailyLimitReached': '오늘의 한도에 도달했습니다',
        'ui.dailyRemaining': '오늘 수령 가능한',

        // Leaderboard
        'leaderboard.title': '주차왕 랭킹',
        'leaderboard.totalPlayers': '',
        'leaderboard.players': '명의 플레이어',
        'leaderboard.loading': '로딩 중...',
        'leaderboard.error': '로딩 실패',
        'leaderboard.empty': '데이터 없음',
        'leaderboard.you': '나',
        'leaderboard.yourRank': '내 순위',
        'leaderboard.youAreDriver': '당신은 드라이버',
        'leaderboard.driver': '번입니다',

        // Revive
        'revive.title': '계속할까요?',
        'revive.message': '포기하지 마세요! 거의 다 왔어요!',
        'revive.continue': '계속',
        'revive.giveUp': '포기',
        'revive.notEnoughCPK': 'CPK 부족',
        'revive.needCPK': '100 CPK 필요',
        'revive.current': '현재',

        // Share
        'share.title': '점수 공유',
        'share.copy': '링크 복사',
        'share.more': '더 보기',
        'share.copied': '복사됨!',

        // Purchase
        'purchase.useWorldApp': 'World App에서 결제를 이용해 주세요',
        'purchase.initiating': '결제 시작 중...',
        'purchase.processing': '결제 성공, 처리 중...',
        'purchase.cashback': 'CPK 캐시백',
        'purchase.failed': '구매 처리 실패',
        'purchase.cancelled': '결제가 취소되었습니다',
        'purchase.error': '구매 실패, 다시 시도해 주세요',
        'purchase.desc.single': '1회 감속 (-20%)',
        'purchase.desc.l1': 'L1 배지 (3시간)',
        'purchase.desc.l2': 'L2 배지 (3시간)',
        'purchase.desc.l3': 'L3 배지 (3시간)',
        'purchase.desc.default': '구매',

        // Claim
        'claim.gettingWallet': '지갑 주소 가져오는 중...',
        'claim.connectWallet': '먼저 지갑을 연결해 주세요',
        'claim.success': '수령 성공',
        'claim.remaining': '잔여',
        'claim.dailyRemaining': '오늘 수령 가능',
        'claim.dailyLimitReached': '오늘의 한도에 도달했습니다, 내일 다시 오세요!',
        'claim.dailyLimitReachedFull': '오늘의 수령 한도에 도달',
        'claim.canClaimTomorrow': '내일 수령 가능',
        'claim.failed': '수령 실패',
        'claim.error': '수령 실패, 다시 시도해 주세요',

        // Rating
        'rating.title': 'CarParKing 재미있으신가요?',
        'rating.message': '저희 게임이 마음에 드셨다면 별 5개 평가 부탁드립니다! 여러분의 지원이 저희에게 큰 힘이 됩니다.',
        'rating.rateNow': '⭐ 지금 평가',
        'rating.later': '나중에',
        'rating.thanks': '응원해 주셔서 감사합니다! 💛',

        // Time
        'time.expired': '만료됨',
        'time.hour': '시간',
        'time.min': '분',

        // UI Extended
        'ui.tempBadge': '임시',
        'ui.noActiveEffects': '활성화된 효과 없음',

        // Session
        'session.slowdownsReset': '감속 효과가 초기화되었습니다',
        'session.lost': '잃음',
    }
};

class I18n {
    constructor() {
        this.translations = translations;
        this.currentLang = this.detectLanguage();
        this.init();
    }

    // 偵測使用者語言
    detectLanguage() {
        // 1. 檢查 localStorage
        const saved = localStorage.getItem('lang');
        if (saved && this.translations[saved]) return saved;

        // 2. 檢查瀏覽器語言
        const browserLang = navigator.language || navigator.userLanguage;

        // 匹配完整語言碼
        if (this.translations[browserLang]) return browserLang;

        // 匹配語言前綴
        const prefix = browserLang.split('-')[0];
        if (prefix === 'zh') return 'zh-TW'; // 中文預設繁體
        if (this.translations[prefix]) return prefix;

        // 3. 預設英文
        return 'en';
    }

    // 取得翻譯
    t(key) {
        const lang = this.translations[this.currentLang];
        return lang?.[key] || this.translations.en[key] || key;
    }

    // 切換語言
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('lang', lang);
            this.applyTranslations();
            this.updateLangButtons();

            // 更新 TokenomicsUI 動態內容
            if (window.tokenomicsUI?.isInitialized) {
                window.tokenomicsUI.updateBadgeStatus();
            }
        }
    }

    // 套用翻譯到 DOM
    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);

            // 保留 emoji 前綴（如果原本有的話）
            if (el.textContent.match(/^[\u{1F300}-\u{1F9FF}]/u)) {
                const emoji = el.textContent.match(/^[\u{1F300}-\u{1F9FF}]+\s?/u)?.[0] || '';
                el.textContent = emoji + translation.replace(/^[\u{1F300}-\u{1F9FF}]+\s?/u, '');
            } else {
                el.textContent = translation;
            }
        });
    }

    // 更新語言按鈕狀態
    updateLangButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            btn.classList.toggle('active', lang === this.currentLang);
        });
    }

    // 初始化
    init() {
        // 等待 DOM 準備好
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // 套用初始翻譯
        this.applyTranslations();
        this.updateLangButtons();

        // 綁定語言按鈕事件
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                this.setLanguage(lang);
            });
        });

        // 綁定設定按鈕事件
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');

        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsPanel.classList.toggle('show');
            });

            // 點擊其他地方關閉設定面板
            document.addEventListener('click', (e) => {
                if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
                    settingsPanel.classList.remove('show');
                }
            });
        }
    }

    // 取得可用語言列表
    getLanguages() {
        return [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' },
            { code: 'ko', name: '한국어', flag: '🇰🇷' },
        ];
    }
}

// 全局實例
window.i18n = new I18n();
