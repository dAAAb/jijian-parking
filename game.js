// 極簡停車 - 遊戲主邏輯
// v2.0.0 - 新增 Demo 模式
class MinimalParking {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.car = null;
        this.parkingSpot = null;
        this.obstacles = [];
        this.level = 1;
        this.score = 0;
        this.startTime = 0;
        this.isPlaying = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.carSpeed = 0;
        this.carRotation = 0;
        this.maxSpeed = 0.15;
        this.acceleration = 0.01;
        this.friction = 0.97;
        this.turnSpeed = 0.05;

        // Demo 模式屬性
        this.isDemoMode = false;
        this.demoAnimationId = null;
        this.demoResetting = false; // 防止重複重置

        // Token-nomics 速度乘數（1.0 = 正常速度，0.5 = 半速）
        this.speedMultiplier = 1.0;

        // 復活系統 - 死亡追蹤
        this.deathHistory = [];           // 死亡記錄 [{time, level, distanceToGoal}]
        this.levelDeathCount = {};        // 每關死亡次數 {level: count}
        this.sessionStartTime = Date.now(); // 本次遊戲開始時間
        this.lastDeathPosition = null;    // 上次死亡位置
        this.reviveAvailable = false;     // 是否可以復活

        this.init();
        this.setupEventListeners();
    }

    init() {
        // 創建場景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 50);

        // 創建相機（上帝視角）
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
        this.camera.position.set(0, 15, 10);
        this.camera.lookAt(0, 0, 0);

        // 創建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // 添加燈光
        this.setupLights();

        // 創建地面
        this.createGround();

        // 窗口大小調整
        window.addEventListener('resize', () => this.onResize());
    }

    setupLights() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 主光源
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    createGround() {
        // Voxel 風格的地面
        const groundSize = 30;
        const tileSize = 2;
        
        for (let x = -groundSize/2; x < groundSize/2; x += tileSize) {
            for (let z = -groundSize/2; z < groundSize/2; z += tileSize) {
                const geometry = new THREE.BoxGeometry(tileSize - 0.1, 0.2, tileSize - 0.1);
                const color = (Math.abs(x) + Math.abs(z)) % (tileSize * 2) === 0 ? 0x95a5a6 : 0xbdc3c7;
                const material = new THREE.MeshLambertMaterial({ color });
                const tile = new THREE.Mesh(geometry, material);
                tile.position.set(x + tileSize/2, -0.1, z + tileSize/2);
                tile.receiveShadow = true;
                this.scene.add(tile);
            }
        }
    }

    createCar() {
        // 清除舊車輛
        if (this.car) {
            this.scene.remove(this.car.group);
        }

        // Voxel 風格的車輛
        this.car = {
            group: new THREE.Group(),
            width: 1.2,
            length: 2,
            speed: { x: 0, z: 0 },
            rotation: 0
        };

        // 車身
        const bodyGeometry = new THREE.BoxGeometry(1.2, 0.6, 2);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.3;
        body.castShadow = true;
        body.userData.originalColor = 0xe74c3c; // 保存原始顏色供復活使用
        this.car.group.add(body);

        // 車頂
        const roofGeometry = new THREE.BoxGeometry(0.9, 0.5, 1.2);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xc0392b });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 0.85;
        roof.castShadow = true;
        roof.userData.originalColor = 0xc0392b;
        this.car.group.add(roof);

        // 車窗（前）
        const windowGeometry = new THREE.BoxGeometry(0.85, 0.4, 0.1);
        const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e });
        const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        frontWindow.position.set(0, 0.85, 0.65);
        frontWindow.userData.originalColor = 0x34495e;
        this.car.group.add(frontWindow);

        // 車輪
        const wheelGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.3);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });

        const wheelPositions = [
            [-0.6, 0.15, 0.7],
            [0.6, 0.15, 0.7],
            [-0.6, 0.15, -0.7],
            [0.6, 0.15, -0.7]
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(...pos);
            wheel.castShadow = true;
            wheel.userData.originalColor = 0x2c3e50;
            this.car.group.add(wheel);
        });

        // 設置初始位置
        this.car.group.position.set(0, 0, -8);
        this.scene.add(this.car.group);
    }

    createParkingSpot() {
        // 清除舊停車位
        if (this.parkingSpot) {
            this.scene.remove(this.parkingSpot.group);
        }

        this.parkingSpot = {
            group: new THREE.Group(),
            x: 0,
            z: 0,
            width: 2,
            length: 3
        };

        // 根據關卡調整停車位位置
        const angle = (this.level * 30) % 360;
        const distance = 5 + Math.min(this.level * 0.5, 8);
        this.parkingSpot.x = Math.cos(angle * Math.PI / 180) * distance;
        this.parkingSpot.z = Math.sin(angle * Math.PI / 180) * distance;

        // 停車位底座（發光效果）
        const spotGeometry = new THREE.BoxGeometry(2, 0.15, 3);
        const spotMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2ecc71,
            emissive: 0x27ae60,
            emissiveIntensity: 0.5
        });
        const spot = new THREE.Mesh(spotGeometry, spotMaterial);
        spot.position.y = 0.05;
        this.parkingSpot.group.add(spot);

        // 停車位標記線
        const lineGeometry = new THREE.BoxGeometry(0.1, 0.2, 3);
        const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        
        [-1, 1].forEach(side => {
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(side * 1, 0.1, 0);
            this.parkingSpot.group.add(line);
        });

        this.parkingSpot.group.position.set(this.parkingSpot.x, 0, this.parkingSpot.z);
        this.scene.add(this.parkingSpot.group);
    }

    createObstacles() {
        // 清除舊障礙物
        this.obstacles.forEach(obs => this.scene.remove(obs.group));
        this.obstacles = [];

        // 根據關卡增加障礙物數量
        const obstacleCount = Math.min(3 + Math.floor(this.level / 2), 10);

        for (let i = 0; i < obstacleCount; i++) {
            const obstacle = {
                group: new THREE.Group(),
                x: 0,
                z: 0,
                width: 1.5,
                length: 1.5
            };

            // 隨機位置（避開起點和終點）
            let validPosition = false;
            let attempts = 0;
            
            while (!validPosition && attempts < 50) {
                obstacle.x = (Math.random() - 0.5) * 16;
                obstacle.z = (Math.random() - 0.5) * 16;
                
                // 檢查是否太靠近起點或停車位
                const distFromStart = Math.sqrt(obstacle.x ** 2 + (obstacle.z + 8) ** 2);
                const distFromSpot = Math.sqrt(
                    (obstacle.x - this.parkingSpot.x) ** 2 + 
                    (obstacle.z - this.parkingSpot.z) ** 2
                );
                
                if (distFromStart > 3 && distFromSpot > 4) {
                    validPosition = true;
                }
                attempts++;
            }

            if (!validPosition) continue;

            // 隨機類型的障礙物
            const type = Math.floor(Math.random() * 3);
            
            if (type === 0) {
                // 立方體障礙物
                const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                const material = new THREE.MeshLambertMaterial({ color: 0xe67e22 });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = 0.75;
                mesh.castShadow = true;
                obstacle.group.add(mesh);
            } else if (type === 1) {
                // 圓柱障礙物
                const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
                const material = new THREE.MeshLambertMaterial({ color: 0xf39c12 });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = 1;
                mesh.castShadow = true;
                obstacle.group.add(mesh);
                obstacle.width = 1;
                obstacle.length = 1;
            } else {
                // 長方體障礙物
                const geometry = new THREE.BoxGeometry(1, 2, 1);
                const material = new THREE.MeshLambertMaterial({ color: 0xd35400 });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = 1;
                mesh.castShadow = true;
                obstacle.group.add(mesh);
                obstacle.width = 1;
                obstacle.length = 1;
            }

            obstacle.group.position.set(obstacle.x, 0, obstacle.z);
            this.scene.add(obstacle.group);
            this.obstacles.push(obstacle);
        }
    }

    setupEventListeners() {
        // 開始按鈕
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        // 下一關按鈕
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.nextLevel();
        });

        // 重試按鈕
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.restartLevel();
        });

        // 復活按鈕 - WLD 支付
        document.getElementById('revive-wld-btn')?.addEventListener('click', () => {
            this.handleReviveWithWLD();
        });

        // 復活按鈕 - CPK 支付
        document.getElementById('revive-cpk-btn')?.addEventListener('click', () => {
            this.handleReviveWithCPK();
        });

        // 復活 - 放棄按鈕
        document.getElementById('revive-skip-btn')?.addEventListener('click', () => {
            this.skipRevive();
        });

        // 觸控控制
        this.renderer.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.renderer.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.renderer.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e));

        // 滑鼠控制（用於測試）
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onTouchStart(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onTouchMove(e));
        this.renderer.domElement.addEventListener('mouseup', (e) => this.onTouchEnd(e));
    }

    onTouchStart(e) {
        if (!this.isPlaying) return;
        
        const touch = e.touches ? e.touches[0] : e;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.isDragging = true;
    }

    onTouchMove(e) {
        if (!this.isPlaying || !this.isDragging) return;

        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        // 根據拖動方向控制車輛
        // 前後控制速度（套用 Token-nomics 速度乘數）
        const effectiveMaxSpeed = this.maxSpeed * this.speedMultiplier;
        const speedInput = -deltaY / window.innerHeight * 2;
        this.carSpeed = Math.max(-effectiveMaxSpeed, Math.min(effectiveMaxSpeed, speedInput * effectiveMaxSpeed));

        // 左右控制轉向
        const turnInput = deltaX / window.innerWidth * 2;
        this.carRotation = turnInput * this.turnSpeed;
    }

    onTouchEnd(e) {
        this.isDragging = false;
        this.carSpeed *= 0.5;
        this.carRotation = 0;
    }

    startGame() {
        // 停止 Demo 模式
        this.stopDemoMode();

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');

        this.level = 1;
        this.score = 0;
        this.createCar();
        this.createParkingSpot();
        this.createObstacles();
        this.startLevel();
    }

    startLevel() {
        this.isPlaying = true;
        this.startTime = Date.now();
        this.carSpeed = 0;
        this.carRotation = 0;
        
        // 顯示控制提示
        const hint = document.getElementById('control-hint');
        hint.style.display = 'block';
        setTimeout(() => {
            hint.style.display = 'none';
        }, 3000);
        
        this.animate();
    }

    nextLevel() {
        document.getElementById('level-complete-screen').classList.add('hidden');
        
        this.level++;
        this.createCar();
        this.createParkingSpot();
        this.createObstacles();
        this.startLevel();
    }

    restartLevel() {
        document.getElementById('game-over-screen').classList.add('hidden');
        
        this.createCar();
        this.startLevel();
    }

    updateCar() {
        if (!this.car || !this.isPlaying) return;

        // 更新車輛旋轉
        this.car.rotation += this.carRotation;
        this.car.group.rotation.y = this.car.rotation;

        // 應用速度
        const rad = this.car.rotation;
        this.car.speed.x = Math.sin(rad) * this.carSpeed;
        this.car.speed.z = Math.cos(rad) * this.carSpeed;

        // 更新位置
        this.car.group.position.x += this.car.speed.x;
        this.car.group.position.z += this.car.speed.z;

        // 應用摩擦力
        this.carSpeed *= this.friction;

        // 限制邊界
        const boundary = 12;
        this.car.group.position.x = Math.max(-boundary, Math.min(boundary, this.car.group.position.x));
        this.car.group.position.z = Math.max(-boundary, Math.min(boundary, this.car.group.position.z));

        // 相機跟隨
        this.updateCamera();
    }

    updateCamera() {
        if (!this.car) return;
        
        const targetX = this.car.group.position.x;
        const targetZ = this.car.group.position.z;
        
        this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
        this.camera.position.z += (targetZ + 10 - this.camera.position.z) * 0.05;
        this.camera.lookAt(targetX, 0, targetZ);
    }

    checkCollisions() {
        if (!this.car) return;

        const carBox = {
            minX: this.car.group.position.x - this.car.width / 2,
            maxX: this.car.group.position.x + this.car.width / 2,
            minZ: this.car.group.position.z - this.car.length / 2,
            maxZ: this.car.group.position.z + this.car.length / 2
        };

        // 檢查與障礙物碰撞
        for (const obstacle of this.obstacles) {
            const obsBox = {
                minX: obstacle.x - obstacle.width / 2,
                maxX: obstacle.x + obstacle.width / 2,
                minZ: obstacle.z - obstacle.length / 2,
                maxZ: obstacle.z + obstacle.length / 2
            };

            if (this.boxIntersects(carBox, obsBox)) {
                this.gameOver();
                return;
            }
        }

        // 檢查是否到達停車位
        this.checkParking();
    }

    boxIntersects(box1, box2) {
        return box1.minX < box2.maxX &&
               box1.maxX > box2.minX &&
               box1.minZ < box2.maxZ &&
               box1.maxZ > box2.minZ;
    }

    checkParking() {
        if (!this.car || !this.parkingSpot) return;

        const distance = Math.sqrt(
            (this.car.group.position.x - this.parkingSpot.x) ** 2 +
            (this.car.group.position.z - this.parkingSpot.z) ** 2
        );

        // 車輛速度要夠慢才能停車
        const speed = Math.sqrt(this.car.speed.x ** 2 + this.car.speed.z ** 2);

        // 放寬停車判定（v2.1: 速度從 0.02 放寬到 0.05，讓彈窗更快出現）
        if (distance < 2.0 && speed < 0.05) {
            // 計算停車精度
            const isPerfectPark = this.checkPerfectParking(distance);
            this.levelComplete(isPerfectPark);
        }
    }

    // 檢查是否為完美停車
    checkPerfectParking(distance) {
        if (!this.car || !this.parkingSpot) return false;

        // 距離條件：必須非常接近（< 0.5）
        if (distance > 0.5) return false;

        // 角度條件：車頭要對準停車格方向
        // 計算車頭朝向與停車格的夾角
        const carRotation = this.car.rotation || 0;

        // 正規化角度到 -PI 到 PI
        let normalizedRotation = carRotation % (Math.PI * 2);
        if (normalizedRotation > Math.PI) normalizedRotation -= Math.PI * 2;
        if (normalizedRotation < -Math.PI) normalizedRotation += Math.PI * 2;

        // 接受 0 度或 180 度（車頭向前或向後都可以）
        const absRotation = Math.abs(normalizedRotation);
        const angleOK = absRotation < 0.3 || Math.abs(absRotation - Math.PI) < 0.3;

        console.log('🎯 完美停車檢測:', { distance: distance.toFixed(3), rotation: normalizedRotation.toFixed(3), angleOK });

        return angleOK;
    }

    levelComplete(isPerfectPark = false) {
        this.isPlaying = false;
        const elapsedTime = ((Date.now() - this.startTime) / 1000).toFixed(1);

        // 計算時間獎勵
        const timeBonus = Math.max(0, Math.floor((30 - elapsedTime) * 10));
        const levelScore = 100 + timeBonus;
        this.score += levelScore;

        // 完美停車獎勵
        const PERFECT_BONUS_CPK = 100;
        let perfectBonusEarned = 0;

        if (isPerfectPark) {
            perfectBonusEarned = PERFECT_BONUS_CPK;
            console.log('🎉 完美停車！額外獎勵 ' + PERFECT_BONUS_CPK + ' CPK');
        }

        // 顯示完成畫面
        document.getElementById('complete-time').textContent = elapsedTime + 's';
        document.getElementById('time-bonus').textContent = '+' + timeBonus;
        document.getElementById('total-score').textContent = this.score;

        // 顯示完美停車標籤（如果有）
        const perfectLabel = document.getElementById('perfect-park-label');
        if (perfectLabel) {
            if (isPerfectPark) {
                perfectLabel.classList.remove('hidden');
                perfectLabel.textContent = '🎯 ' + (window.i18n?.t('complete.perfect') || '完美停車') + ' +' + PERFECT_BONUS_CPK + ' CPK';
            } else {
                perfectLabel.classList.add('hidden');
            }
        }

        document.getElementById('level-complete-screen').classList.remove('hidden');

        // Token-nomics: 向後端報告得分，獲取 CPK 獎勵
        console.log('🎮 Level complete - checking tokenomicsUI:', {
            hasTokenomicsUI: !!window.tokenomicsUI,
            nullifierHash: window.tokenomicsUI?.nullifierHash?.substring(0, 10),
            levelScore,
            level: this.level,
            isPerfectPark,
            perfectBonus: perfectBonusEarned
        });
        if (window.tokenomicsUI?.nullifierHash) {
            // 普通分數獎勵
            window.tokenomicsUI.addReward(levelScore, this.level);

            // 完美停車額外獎勵
            if (perfectBonusEarned > 0) {
                window.tokenomicsUI.addReward(perfectBonusEarned, this.level, true); // true = isPerfectBonus
            }
        } else {
            console.warn('⚠️ tokenomicsUI not ready, CPK reward skipped');
        }

        // 添加完成特效（完美停車有更華麗的煙火）
        this.addCompleteEffect(isPerfectPark);

        // 發送震動反饋
        if (window.worldMiniKit) {
            window.worldMiniKit.sendHapticFeedback(isPerfectPark ? 'heavy' : 'success');
        }
    }

    addCompleteEffect(isPerfectPark = false) {
        // 完美停車：更多、更大、更華麗的粒子
        const particleCount = isPerfectPark ? 60 : 20;
        const particleSize = isPerfectPark ? 0.3 : 0.2;
        const velocityMultiplier = isPerfectPark ? 1.5 : 1;

        // 創建慶祝粒子效果
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.BoxGeometry(particleSize, particleSize, particleSize);

            // 完美停車使用金色系
            let color;
            if (isPerfectPark) {
                const goldColors = [0xffd700, 0xffaa00, 0xffffff, 0xff6600, 0xff0066];
                color = goldColors[Math.floor(Math.random() * goldColors.length)];
            } else {
                color = Math.random() * 0xffffff;
            }

            const material = new THREE.MeshLambertMaterial({
                color: color,
                emissive: isPerfectPark ? color : 0x000000,
                emissiveIntensity: isPerfectPark ? 0.5 : 0
            });
            const particle = new THREE.Mesh(geometry, material);

            particle.position.copy(this.car.group.position);
            particle.position.y = isPerfectPark ? 3 : 2;

            particle.velocity = {
                x: (Math.random() - 0.5) * 0.3 * velocityMultiplier,
                y: Math.random() * 0.3 * velocityMultiplier + 0.2,
                z: (Math.random() - 0.5) * 0.3 * velocityMultiplier
            };

            this.scene.add(particle);

            // 動畫粒子
            const animateParticle = () => {
                particle.position.x += particle.velocity.x;
                particle.position.y += particle.velocity.y;
                particle.position.z += particle.velocity.z;
                particle.velocity.y -= 0.01;
                particle.rotation.x += 0.1;
                particle.rotation.y += 0.1;

                if (particle.position.y > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }

        // 完美停車額外的煙火爆發效果
        if (isPerfectPark) {
            this.addFireworkBurst();
        }
    }

    // 煙火爆發效果
    addFireworkBurst() {
        const burstCount = 3; // 三波煙火

        for (let burst = 0; burst < burstCount; burst++) {
            setTimeout(() => {
                const burstX = this.car.group.position.x + (Math.random() - 0.5) * 4;
                const burstZ = this.car.group.position.z + (Math.random() - 0.5) * 4;
                const burstY = 4 + Math.random() * 2;

                // 每波 15 個粒子
                for (let i = 0; i < 15; i++) {
                    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
                    const hue = Math.random();
                    const color = new THREE.Color().setHSL(hue, 1, 0.6);

                    const material = new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 1
                    });
                    const spark = new THREE.Mesh(geometry, material);

                    spark.position.set(burstX, burstY, burstZ);

                    // 球形擴散
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    const speed = 0.1 + Math.random() * 0.1;

                    spark.velocity = {
                        x: Math.sin(phi) * Math.cos(theta) * speed,
                        y: Math.cos(phi) * speed,
                        z: Math.sin(phi) * Math.sin(theta) * speed
                    };

                    this.scene.add(spark);

                    let life = 1;
                    const animateSpark = () => {
                        spark.position.x += spark.velocity.x;
                        spark.position.y += spark.velocity.y;
                        spark.position.z += spark.velocity.z;
                        spark.velocity.y -= 0.005; // 重力

                        life -= 0.02;
                        spark.material.opacity = life;

                        if (life > 0) {
                            requestAnimationFrame(animateSpark);
                        } else {
                            this.scene.remove(spark);
                        }
                    };
                    animateSpark();
                }
            }, burst * 300); // 每波間隔 300ms
        }
    }

    gameOver() {
        this.isPlaying = false;

        // 記錄死亡位置和距離
        const distanceToGoal = this.calculateDistanceToGoal();
        this.lastDeathPosition = this.car ? {
            x: this.car.group.position.x,
            z: this.car.group.position.z,
            rotation: this.car.group.rotation.y
        } : null;

        // 記錄死亡歷史
        this.deathHistory.push({
            time: Date.now(),
            level: this.level,
            distanceToGoal: distanceToGoal
        });

        // 更新本關死亡次數
        this.levelDeathCount[this.level] = (this.levelDeathCount[this.level] || 0) + 1;

        // AI 判斷是否顯示復活選項
        const shouldOfferRevive = this.checkFrustrationLevel(distanceToGoal);

        // 車輛爆炸效果
        if (this.car) {
            this.car.group.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.material.color.setHex(0x000000);
                }
            });
        }

        // 發送震動反饋
        if (window.worldMiniKit) {
            window.worldMiniKit.sendHapticFeedback('error');
        }

        if (shouldOfferRevive && window.tokenomicsUI?.nullifierHash) {
            // 顯示復活選項
            this.reviveAvailable = true;
            this.showReviveOption();
        } else {
            // 普通 Game Over
            this.reviveAvailable = false;
            document.getElementById('game-over-screen').classList.remove('hidden');

            // Token-nomics: 重置當局狀態（單次降速失效）
            if (window.tokenomicsUI?.nullifierHash) {
                window.tokenomicsUI.resetSession();
            }
        }
    }

    // 計算到停車位的距離（0-1，0 表示很近）
    calculateDistanceToGoal() {
        if (!this.car || !this.parkingSpot) return 1;

        const dx = this.car.group.position.x - this.parkingSpot.x;
        const dz = this.car.group.position.z - this.parkingSpot.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // 正規化：假設地圖對角線約 20 單位
        const maxDistance = 20;
        return Math.min(distance / maxDistance, 1);
    }

    // AI 挫折感判斷
    checkFrustrationLevel(distanceToGoal) {
        // 條件 1：高關卡死亡（第 3 關以上）
        if (this.level >= 3) {
            console.log('🎯 復活條件觸發：高關卡死亡 (Level ' + this.level + ')');
            return true;
        }

        // 條件 2：差一點成功（距離停車位 < 30%）且關卡 >= 2
        if (distanceToGoal < 0.3 && this.level >= 2) {
            console.log('🎯 復活條件觸發：差一點成功 (距離 ' + Math.round(distanceToGoal * 100) + '%)');
            return true;
        }

        // 條件 3：同一關死亡 2 次以上
        if ((this.levelDeathCount[this.level] || 0) >= 2) {
            console.log('🎯 復活條件觸發：同關多次失敗 (' + this.levelDeathCount[this.level] + ' 次)');
            return true;
        }

        // 條件 4：短時間內連續死亡（3 分鐘內死 2 次以上）
        const recentDeaths = this.deathHistory.filter(d =>
            Date.now() - d.time < 3 * 60 * 1000
        );
        if (recentDeaths.length >= 2) {
            console.log('🎯 復活條件觸發：短時間連死 (' + recentDeaths.length + ' 次/3分鐘)');
            return true;
        }

        return false;
    }

    // 顯示復活選項
    showReviveOption() {
        const reviveScreen = document.getElementById('revive-screen');
        if (reviveScreen) {
            // 更新顯示的關卡資訊
            const levelInfo = reviveScreen.querySelector('.revive-level-info');
            if (levelInfo) {
                levelInfo.textContent = `Level ${this.level} · ${window.i18n?.t('ui.score') || '分數'} ${this.score}`;
            }
            reviveScreen.classList.remove('hidden');
        } else {
            // 如果 UI 不存在，退回普通 Game Over
            document.getElementById('game-over-screen').classList.remove('hidden');
            if (window.tokenomicsUI?.nullifierHash) {
                window.tokenomicsUI.resetSession();
            }
        }
    }

    // 執行復活
    revive() {
        const safePosition = this.findSafeRespawnPoint();

        if (this.car && safePosition) {
            // 移動車輛到安全位置
            this.car.group.position.x = safePosition.x;
            this.car.group.position.z = safePosition.z;
            this.car.group.rotation.y = safePosition.rotation;

            // 重置車輛速度
            this.car.speed = { x: 0, z: 0 };

            // 恢復車輛顏色
            this.car.group.children.forEach(child => {
                if (child instanceof THREE.Mesh && child.userData.originalColor) {
                    child.material.color.setHex(child.userData.originalColor);
                }
            });

            // 隱藏復活畫面
            document.getElementById('revive-screen')?.classList.add('hidden');

            // 繼續遊戲
            this.isPlaying = true;
            this.reviveAvailable = false;
            this.animate();

            console.log('🔄 復活成功！位置:', safePosition);
        }
    }

    // 找到安全的重生點
    findSafeRespawnPoint() {
        if (!this.lastDeathPosition) {
            // 如果沒有死亡位置記錄，使用關卡起始點
            return { x: 0, z: 6, rotation: 0 };
        }

        // 嘗試在死亡點附近找安全位置
        const searchOffsets = [
            { x: 0, z: -3 },   // 後退
            { x: -2, z: -2 },  // 左後
            { x: 2, z: -2 },   // 右後
            { x: -3, z: 0 },   // 左邊
            { x: 3, z: 0 },    // 右邊
            { x: 0, z: -5 },   // 更後面
        ];

        for (const offset of searchOffsets) {
            const testX = this.lastDeathPosition.x + offset.x;
            const testZ = this.lastDeathPosition.z + offset.z;

            if (this.isPositionSafe(testX, testZ)) {
                // 計算朝向停車位的角度
                const angleToGoal = Math.atan2(
                    this.parkingSpot.x - testX,
                    this.parkingSpot.z - testZ
                );

                return {
                    x: testX,
                    z: testZ,
                    rotation: angleToGoal
                };
            }
        }

        // 都不安全的話，回到起始點
        return { x: 0, z: 6, rotation: 0 };
    }

    // 檢查位置是否安全（不與障礙物重疊）
    isPositionSafe(x, z) {
        const carHalfWidth = this.car ? this.car.width / 2 : 0.8;
        const carHalfLength = this.car ? this.car.length / 2 : 1.2;
        const margin = 0.5; // 額外安全邊距

        const carBox = {
            minX: x - carHalfWidth - margin,
            maxX: x + carHalfWidth + margin,
            minZ: z - carHalfLength - margin,
            maxZ: z + carHalfLength + margin
        };

        // 檢查是否在地圖邊界內
        if (x < -8 || x > 8 || z < -8 || z > 8) {
            return false;
        }

        // 檢查是否與障礙物重疊
        for (const obstacle of this.obstacles) {
            const obsBox = {
                minX: obstacle.x - obstacle.width / 2,
                maxX: obstacle.x + obstacle.width / 2,
                minZ: obstacle.z - obstacle.length / 2,
                maxZ: obstacle.z + obstacle.length / 2
            };

            if (this.boxIntersects(carBox, obsBox)) {
                return false;
            }
        }

        return true;
    }

    // 復活 - WLD 支付
    async handleReviveWithWLD() {
        if (!this.reviveAvailable) return;

        const nullifierHash = window.tokenomicsUI?.nullifierHash;
        if (!nullifierHash) {
            console.error('No nullifier hash for revive');
            return;
        }

        const btn = document.getElementById('revive-wld-btn');
        if (btn) {
            btn.disabled = true;
            btn.querySelector('.revive-label').textContent = '...';
        }

        try {
            // 使用 MiniKit 進行 WLD 支付
            const reference = `revive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const treasuryAddress = window.CONFIG?.TREASURY_ADDRESS || '0xD32e7a4Ee499D9bbdE0D1A2F33eEd758932bC54c';

            // 檢查是否在測試模式
            const isTestMode = new URLSearchParams(window.location.search).get('test') === '1';

            if (isTestMode) {
                // 測試模式：直接復活
                console.log('🧪 Test mode: skipping WLD payment');
                this.revive();
                return;
            }

            // 檢查 MiniKit 是否可用
            if (typeof MiniKit === 'undefined' || !MiniKit.isInstalled()) {
                alert('Please use World App to make payment');
                return;
            }

            const payResult = await MiniKit.commandsAsync.pay({
                reference,
                to: treasuryAddress,
                tokens: [{
                    symbol: 'WLD',
                    token_amount: '1000000000000000000' // 1 WLD (18 decimals)
                }],
                description: 'Revive - Continue Game'
            });

            if (payResult.status === 'success' && payResult.finalPayload?.transaction_id) {
                // 呼叫後端 API 記錄復活
                const response = await fetch('/api/revive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nullifier_hash: nullifierHash,
                        payment_type: 'wld',
                        transaction_id: payResult.finalPayload.transaction_id,
                        reference
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // 更新 CPK 餘額（如果有返還）
                    if (data.cpk_cashback && window.tokenomicsUI) {
                        window.tokenomicsUI.updateCPKDisplay(data.cpk_pending);
                    }

                    // 執行復活
                    this.revive();
                } else {
                    console.error('Revive API error:', data.error);
                    alert(data.error || 'Revive failed');
                }
            } else {
                console.log('Payment cancelled or failed');
            }

        } catch (error) {
            console.error('Revive WLD error:', error);
            alert('Payment failed');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.querySelector('.revive-label').textContent = window.i18n?.t('revive.continue') || 'Continue';
            }
        }
    }

    // 復活 - CPK 支付
    async handleReviveWithCPK() {
        if (!this.reviveAvailable) return;

        const nullifierHash = window.tokenomicsUI?.nullifierHash;
        if (!nullifierHash) {
            console.error('No nullifier hash for revive');
            return;
        }

        // 檢查 CPK 餘額
        const currentCPK = window.tokenomicsUI?.cpkPending || 0;
        if (currentCPK < 100) {
            const cpkBtn = document.getElementById('revive-cpk-btn');
            if (cpkBtn) {
                cpkBtn.classList.add('disabled');
                cpkBtn.querySelector('.revive-label').textContent = window.i18n?.t('revive.notEnoughCPK') || 'Not enough CPK';
            }
            return;
        }

        const btn = document.getElementById('revive-cpk-btn');
        if (btn) {
            btn.disabled = true;
            btn.querySelector('.revive-label').textContent = '...';
        }

        try {
            // 檢查是否在測試模式
            const isTestMode = new URLSearchParams(window.location.search).get('test') === '1';

            if (isTestMode) {
                // 測試模式：直接復活
                console.log('🧪 Test mode: skipping CPK payment');
                this.revive();
                return;
            }

            // 呼叫後端 API 扣除 CPK
            const response = await fetch('/api/revive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nullifier_hash: nullifierHash,
                    payment_type: 'cpk'
                })
            });

            const data = await response.json();

            if (data.success) {
                // 更新 CPK 餘額
                if (window.tokenomicsUI) {
                    window.tokenomicsUI.updateCPKDisplay(data.cpk_pending);
                }

                // 執行復活
                this.revive();
            } else {
                console.error('Revive API error:', data.error);

                if (data.error === 'Insufficient CPK balance') {
                    const cpkBtn = document.getElementById('revive-cpk-btn');
                    if (cpkBtn) {
                        cpkBtn.classList.add('disabled');
                        cpkBtn.querySelector('.revive-label').textContent = window.i18n?.t('revive.notEnoughCPK') || 'Not enough CPK';
                    }
                } else {
                    alert(data.error || 'Revive failed');
                }
            }

        } catch (error) {
            console.error('Revive CPK error:', error);
            alert('Revive failed');
        } finally {
            if (btn) {
                btn.disabled = false;
                if (!btn.classList.contains('disabled')) {
                    btn.querySelector('.revive-label').textContent = window.i18n?.t('revive.continue') || 'Continue';
                }
            }
        }
    }

    // 放棄復活
    skipRevive() {
        // 隱藏復活畫面
        document.getElementById('revive-screen')?.classList.add('hidden');

        // 顯示普通 Game Over 畫面
        document.getElementById('game-over-screen').classList.remove('hidden');

        // 重置 tokenomics session
        if (window.tokenomicsUI?.nullifierHash) {
            window.tokenomicsUI.resetSession();
        }

        this.reviveAvailable = false;
    }

    // Token-nomics: 從外部更新速度乘數
    updateSpeedFromTokenomics(multiplier) {
        this.speedMultiplier = multiplier;
        console.log(`🐢 速度乘數更新: ${multiplier.toFixed(2)} (降速 ${Math.round((1 - multiplier) * 100)}%)`);
    }

    updateUI() {
        document.getElementById('level-display').textContent = this.level;
        document.getElementById('score-display').textContent = this.score;
        
        if (this.isPlaying) {
            const elapsedTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
            document.getElementById('time-display').textContent = elapsedTime + 's';
        }
    }

    animate() {
        if (!this.isPlaying) return;
        
        requestAnimationFrame(() => this.animate());

        this.updateCar();
        this.checkCollisions();
        this.updateUI();

        // 停車位呼吸效果
        if (this.parkingSpot) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
            this.parkingSpot.group.children[0].material.emissiveIntensity = pulse;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ===== Demo 模式 =====

    startDemoMode() {
        this.isDemoMode = true;
        this.isPlaying = false;
        this.level = 1;

        // 創建場景元素
        this.createCar();
        this.createParkingSpot();
        this.createObstacles();

        // 重置車輛狀態
        this.carSpeed = 0;
        this.carRotation = 0;

        // 啟動 Demo 動畫循環
        this.animateDemo();
    }

    stopDemoMode() {
        this.isDemoMode = false;
        if (this.demoAnimationId) {
            cancelAnimationFrame(this.demoAnimationId);
            this.demoAnimationId = null;
        }
    }

    animateDemo() {
        if (!this.isDemoMode) return;

        this.demoAnimationId = requestAnimationFrame(() => this.animateDemo());

        // AI 控制
        this.updateDemoAI();

        // 更新車輛物理
        this.updateCarDemo();

        // 檢查碰撞和停車
        this.checkDemoCollision();
        this.checkDemoParking();

        // 停車位呼吸效果
        if (this.parkingSpot) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
            this.parkingSpot.group.children[0].material.emissiveIntensity = pulse;
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateDemoAI() {
        if (!this.car || !this.parkingSpot) return;

        // 計算車輛到停車位的方向
        const dx = this.parkingSpot.x - this.car.group.position.x;
        const dz = this.parkingSpot.z - this.car.group.position.z;
        const targetAngle = Math.atan2(dx, dz);

        // 計算角度差
        let angleDiff = targetAngle - this.car.rotation;

        // 處理角度環繞 (-PI 到 PI)
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // 平滑轉向
        const turnRate = 0.03;
        if (Math.abs(angleDiff) > 0.1) {
            this.carRotation = Math.sign(angleDiff) * turnRate;
        } else {
            this.carRotation = angleDiff * 0.3;
        }

        // 計算距離
        const distance = Math.sqrt(dx * dx + dz * dz);

        // 根據距離調整速度
        if (distance > 3) {
            this.carSpeed = this.maxSpeed * 0.5; // 中速行駛
        } else if (distance > 1.5) {
            this.carSpeed = this.maxSpeed * 0.3; // 接近時減速
        } else if (distance > 0.5) {
            this.carSpeed = this.maxSpeed * 0.1; // 非常慢
        } else {
            // 到達停車位，停止給速度，讓摩擦力自然減速
            this.carSpeed = 0;
        }
    }

    updateCarDemo() {
        if (!this.car) return;

        // 更新車輛旋轉
        this.car.rotation += this.carRotation;
        this.car.group.rotation.y = this.car.rotation;

        // 應用速度
        const rad = this.car.rotation;
        this.car.speed.x = Math.sin(rad) * this.carSpeed;
        this.car.speed.z = Math.cos(rad) * this.carSpeed;

        // 更新位置
        this.car.group.position.x += this.car.speed.x;
        this.car.group.position.z += this.car.speed.z;

        // 應用摩擦力
        this.carSpeed *= this.friction;

        // 限制邊界
        const boundary = 12;
        this.car.group.position.x = Math.max(-boundary, Math.min(boundary, this.car.group.position.x));
        this.car.group.position.z = Math.max(-boundary, Math.min(boundary, this.car.group.position.z));

        // Demo 模式：相機固定不動，讓用戶看清楚車輛移動
        // （不調用 updateCamera()）
    }

    checkDemoCollision() {
        if (!this.car) return;

        const carBox = {
            minX: this.car.group.position.x - this.car.width / 2,
            maxX: this.car.group.position.x + this.car.width / 2,
            minZ: this.car.group.position.z - this.car.length / 2,
            maxZ: this.car.group.position.z + this.car.length / 2
        };

        // 檢查與障礙物碰撞
        for (const obstacle of this.obstacles) {
            const obsBox = {
                minX: obstacle.x - obstacle.width / 2,
                maxX: obstacle.x + obstacle.width / 2,
                minZ: obstacle.z - obstacle.length / 2,
                maxZ: obstacle.z + obstacle.length / 2
            };

            if (this.boxIntersects(carBox, obsBox)) {
                // Demo 模式：碰撞後靜默重置
                this.resetDemo();
                return;
            }
        }
    }

    checkDemoParking() {
        if (!this.car || !this.parkingSpot) return;

        const distance = Math.sqrt(
            (this.car.group.position.x - this.parkingSpot.x) ** 2 +
            (this.car.group.position.z - this.parkingSpot.z) ** 2
        );

        const speed = Math.sqrt(this.car.speed.x ** 2 + this.car.speed.z ** 2);

        // 放寬停車判定（v2.1: 速度從 0.02 放寬到 0.05）
        if (distance < 2.0 && speed < 0.05) {
            // Demo 模式：停車成功後靜默重置
            this.resetDemo();
        }
    }

    resetDemo() {
        if (!this.isDemoMode || this.demoResetting) return;

        // 設置標記，防止重複觸發
        this.demoResetting = true;

        // 短暫停頓後重新開始
        setTimeout(() => {
            if (!this.isDemoMode) return;

            // 隨機變換關卡（1-3）讓 Demo 更有變化
            this.level = Math.floor(Math.random() * 3) + 1;

            // 重新創建場景
            this.createCar();
            this.createParkingSpot();
            this.createObstacles();

            // 重置狀態
            this.carSpeed = 0;
            this.carRotation = 0;

            // 解除標記
            this.demoResetting = false;
        }, 800);
    }
}

// 初始化遊戲
window.addEventListener('DOMContentLoaded', () => {
    const game = new MinimalParking();

    // 頁面載入後自動啟動 Demo 模式
    game.startDemoMode();

    // 暴露給全局（方便其他模組存取）
    window.parkingGame = game;
});

