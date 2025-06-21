// 游戏状态
let currentLevel = 0; // 设置为0表示尚未选择关卡
let moves = 0;
let playerPosition = { x: 0, y: 0 };
let gameBoard = [];
let boxPositions = [];
let targetPositions = [];
let completedLevels = new Set(); // 跟踪已完成的关卡

// 游戏关卡设计
const levels = [
    {
        layout: [
            "WWWWWWW",
            "W  P  W",
            "W B T W",
            "W     W",
            "WWWWWWW"
        ],
        width: 7,
        height: 5
    },
    {
        layout: [
            "WWWWWWWWW",
            "W       W",
            "W BBP   W",
            "WWW WWW W",
            "W T T   W",
            "W       W",
            "WWWWWWWWW"
        ],
        width: 9,
        height: 7
    },
    {
        layout: [
            "WWWWWWWWWWWWWWWWWWW",
            "W                 W",
            "W    WWWWWWWW    W",
            "W    W      W    W",
            "W    W BBBB W    W",
            "W    W P    W    W",
            "W    W      W    W",
            "W    W  T   W    W",
            "W    WWWW WWW    W",
            "W       W        W",
            "W   T   W    T   W",
            "W       W        W",
            "W       W        W",
            "W    WWWW  T     W",
            "W                W",
            "W                W",
            "WWWWWWWWWWWWWWWWWWW"
        ],
        width: 19,
        height: 17,
        description: "第三关：四箱子挑战！"
    }
];

// 初始化游戏
function initGame(levelNumber) {
    // 如果levelNumber为0或无效值，不执行初始化
    if (levelNumber <= 0 || levelNumber > levels.length) return false;
    
    const level = levels[levelNumber - 1];
    if (!level) return false;

    currentLevel = levelNumber;
    moves = 0;
    updateMovesDisplay();
    document.getElementById('level-number').textContent = currentLevel;
    const descElement = document.getElementById('level-description');
    descElement.textContent = level.description || '';

    // 创建游戏板
    const gameboardElement = document.getElementById('game-board');
    gameboardElement.style.gridTemplateColumns = `repeat(${level.width}, 1fr)`;
    gameboardElement.innerHTML = '';
    
    gameBoard = [];
    boxPositions = [];
    targetPositions = [];

    // 解析关卡布局
    level.layout.forEach((row, y) => {
        gameBoard[y] = [];
        for (let x = 0; x < row.length; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            switch (row[x]) {
                case 'W':
                    cell.classList.add('wall');
                    gameBoard[y][x] = 'wall';
                    break;
                case 'P':
                    playerPosition = { x, y };
                    gameBoard[y][x] = 'empty';
                    cell.classList.add('player');
                    break;
                case 'B':
                    boxPositions.push({ x, y });
                    gameBoard[y][x] = 'box';
                    cell.classList.add('box');
                    break;
                case 'T':
                    targetPositions.push({ x, y });
                    gameBoard[y][x] = 'target';
                    cell.classList.add('target');
                    break;
                default:
                    gameBoard[y][x] = 'empty';
            }
            
            gameboardElement.appendChild(cell);
        }
    });

    updateGameBoard();
    return true;
}

// 更新游戏板显示
function updateGameBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.className = 'cell';
    });

    // 更新所有游戏元素
    gameBoard.forEach((row, y) => {
        row.forEach((cell, x) => {
            const cellElement = getCellElement(x, y);
            
            switch (cell) {
                case 'wall':
                    cellElement.classList.add('wall');
                    break;
                case 'target':
                    cellElement.classList.add('target');
                    break;
                case 'box':
                    cellElement.classList.add('box');
                    // 检查箱子是否在目标点上
                    if (targetPositions.some(t => t.x === x && t.y === y)) {
                        cellElement.classList.add('on-target');
                    }
                    break;
            }
        });
    });

    // 更新玩家
    getCellElement(playerPosition.x, playerPosition.y).classList.add('player');
}

// 获取特定位置的单元格元素
function getCellElement(x, y) {
    const index = y * levels[currentLevel - 1].width + x;
    const cells = document.querySelectorAll('.cell');
    console.log(`Getting cell at (${x},${y}), index=${index}, total cells=${cells.length}`);
    if (index >= cells.length) {
        console.error(`Invalid cell index: ${index} for position (${x},${y})`);
        return null;
    }
    return cells[index];
}

// 检查位置是否是目标点
function isOnTarget(position) {
    return targetPositions.some(target => 
        target.x === position.x && target.y === position.y
    );
}

// 移动玩家
function movePlayer(dx, dy) {
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;

    // 检查是否可以移动
    if (gameBoard[newY][newX] === 'wall') return;

    // 检查是否推箱子
    const boxIndex = boxPositions.findIndex(box => 
        box.x === newX && box.y === newY
    );

    if (boxIndex !== -1) {
        const newBoxX = newX + dx;
        const newBoxY = newY + dy;

        // 检查箱子是否可以移动
        if (gameBoard[newBoxY][newBoxX] === 'wall') return;
        if (boxPositions.some(box => box.x === newBoxX && box.y === newBoxY)) return;

        // 移动箱子
        boxPositions[boxIndex] = { x: newBoxX, y: newBoxY };
    }

    // 移动玩家
    playerPosition = { x: newX, y: newY };
    moves++;
    updateMovesDisplay();
    updateGameBoard();

    // 检查是否获胜
    if (checkWin()) {
        showMessage('恭喜!', '你完成了这一关!');
    }
}

// 检查是否获胜
function checkWin() {
    const win = boxPositions.every(box => isOnTarget(box));
    
    if (win) {
        // 记录已完成的关卡
        completedLevels.add(currentLevel);
        
        // 保存到localStorage
        try {
            localStorage.setItem('completedLevels', JSON.stringify([...completedLevels]));
        } catch (e) {
            console.error('Error saving completed levels:', e);
        }
        
        // 检查是否完成所有关卡
        if (completedLevels.size === levels.length) {
            // 延迟显示全部通关消息，让玩家先看到箱子都到位的画面
            setTimeout(() => {
                showCompletionMessage();
            }, 500);
        }
    }
    
    return win;
}

// 显示全部通关消息和图片
function showCompletionMessage() {
    // 创建模态对话框
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    // 创建消息容器
    const messageContainer = document.createElement('div');
    messageContainer.style.backgroundColor = 'white';
    messageContainer.style.padding = '20px';
    messageContainer.style.borderRadius = '10px';
    messageContainer.style.maxWidth = '80%';
    messageContainer.style.textAlign = 'center';
    
    // 添加消息文本
    const messageText = document.createElement('h2');
    messageText.textContent = '还玩？报告发我了吗？';
    messageText.style.marginBottom = '20px';
    messageContainer.appendChild(messageText);
    
    // 添加图片
    const image = document.createElement('img');
    image.src = 'photo.png';
    image.style.maxWidth = '100%';
    image.style.maxHeight = '60vh';
    image.style.marginBottom = '20px';
    messageContainer.appendChild(image);
    
    // 添加按钮
    const buttonContainer = document.createElement('div');
    
    const restartButton = document.createElement('button');
    restartButton.textContent = '马上就发你';
    restartButton.style.margin = '10px';
    restartButton.style.padding = '10px 20px';
    restartButton.addEventListener('click', function() {
        document.body.removeChild(modal);
        // 重置已完成关卡
        completedLevels.clear();
        // 回到第一关
        initGame(1);
    });
    
    const exitButton = document.createElement('button');
    exitButton.textContent = '写完就发你';
    exitButton.style.margin = '10px';
    exitButton.style.padding = '10px 20px';
    exitButton.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    buttonContainer.appendChild(restartButton);
    buttonContainer.appendChild(exitButton);
    messageContainer.appendChild(buttonContainer);
    
    modal.appendChild(messageContainer);
    document.body.appendChild(modal);
}

// 更新移动次数显示
function updateMovesDisplay() {
    document.getElementById('moves-count').textContent = moves;
}

// 显示消息
function showMessage(title, text) {
    const message = document.getElementById('message');
    document.getElementById('message-title').textContent = title;
    document.getElementById('message-text').textContent = text;
    message.classList.add('active');
}

// 隐藏消息
function hideMessage() {
    const message = document.getElementById('message');
    message.classList.remove('active');
}

// 隐藏关卡选择
function hideLevelSelect() {
    document.getElementById('level-select').classList.remove('active');
}

// 显示关卡选择界面
function showLevelSelect() {
    const levelSelect = document.getElementById('level-select');
    levelSelect.classList.add('active');
    
    // 清空并重新生成关卡选择网格
    const levelGrid = document.getElementById('level-grid');
    levelGrid.innerHTML = '';
    
    for (let i = 1; i <= levels.length; i++) {
        const levelButton = document.createElement('button');
        levelButton.textContent = i;
        if (completedLevels.has(i)) {
            levelButton.classList.add('completed');
        }
        levelButton.addEventListener('click', function() {
            levelSelect.classList.remove('active');
            initGame(i);
        });
        levelGrid.appendChild(levelButton);
    }
}

// 跳关功能 - 显示"大为帅不帅"对话框或第三关特殊对话框
let notHandsomeCount = 0; // 跟踪"不帅"点击次数

function showHandsomeDialog() {
    // 如果是第三关，直接显示"还玩？报告发我了吗？"对话框
    if (currentLevel === 3) {
        showCompletionMessage();
        return;
    }
    
    // 创建模态对话框
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    // 创建消息容器
    const messageContainer = document.createElement('div');
    messageContainer.style.backgroundColor = 'white';
    messageContainer.style.padding = '20px';
    messageContainer.style.borderRadius = '10px';
    messageContainer.style.maxWidth = '80%';
    messageContainer.style.textAlign = 'center';
    
    // 添加问题文本
    const questionText = document.createElement('h2');
    questionText.textContent = '大为帅不帅？';
    questionText.style.marginBottom = '20px';
    messageContainer.appendChild(questionText);
    
    // 添加按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '20px';
    
    // 添加"帅"按钮
    const handsome = document.createElement('button');
    handsome.textContent = '帅';
    handsome.style.padding = '10px 20px';
    handsome.style.fontSize = '16px';
    handsome.style.transition = 'all 0.3s ease';
    handsome.style.minWidth = '80px';
    handsome.addEventListener('click', function() {
        document.body.removeChild(modal);
        // 标记当前关卡为已完成
        completedLevels.add(currentLevel);
        // 跳到下一关
        const nextLevel = currentLevel + 1 > levels.length ? 1 : currentLevel + 1;
        initGame(nextLevel);
    });
    
    // 添加"不帅"按钮
    const notHandsome = document.createElement('button');
    notHandsome.textContent = '不帅';
    notHandsome.style.padding = '10px 20px';
    notHandsome.style.fontSize = '16px';
    notHandsome.style.transition = 'all 0.3s ease';
    notHandsome.style.minWidth = '80px';
    notHandsome.addEventListener('click', function() {
        notHandsomeCount++;
        
        // 调整按钮大小
        const handSomeScale = 1 + notHandsomeCount * 0.3;
        const notHandsomeScale = 1 - notHandsomeCount * 0.2;
        
        handsome.style.transform = `scale(${handSomeScale})`;
        notHandsome.style.transform = `scale(${notHandsomeScale})`;
        
        if (notHandsomeCount >= 3) {
            // 显示"事不过三"消息
            const warningText = document.createElement('div');
            warningText.textContent = '事不过三';
            warningText.style.color = 'red';
            warningText.style.fontWeight = 'bold';
            warningText.style.fontSize = '24px';
            warningText.style.marginTop = '20px';
            messageContainer.appendChild(warningText);
            
            // 替换"不帅"为"帅"
            notHandsome.textContent = '帅';
            
            // 开始倒计时
            let countdown = 2;
            const countdownElement = document.createElement('div');
            countdownElement.textContent = `${countdown}秒后自动选择`;
            countdownElement.style.marginTop = '10px';
            messageContainer.appendChild(countdownElement);
            
            const countdownInterval = setInterval(() => {
                countdown--;
                countdownElement.textContent = `${countdown}秒后自动选择`;
                
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    // 自动点击"帅"按钮
                    document.body.removeChild(modal);
                    // 标记当前关卡为已完成
                    completedLevels.add(currentLevel);
                    // 跳到下一关
                    const nextLevel = currentLevel + 1 > levels.length ? 1 : currentLevel + 1;
                    initGame(nextLevel);
                }
            }, 1000);
        }
    });
    
    // 将按钮添加到按钮容器
    buttonContainer.appendChild(handsome);
    buttonContainer.appendChild(notHandsome);
    
    // 将按钮容器添加到消息容器
    messageContainer.appendChild(buttonContainer);
    
    // 将消息容器添加到模态框
    modal.appendChild(messageContainer);
    
    // 将模态框添加到页面
    document.body.appendChild(modal);
}

// 添加键盘事件监听
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
        case 'ArrowUp':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
    }
});

// 添加移动控制按钮事件监听
document.getElementById('btn-up').addEventListener('click', () => movePlayer(0, -1));
document.getElementById('btn-down').addEventListener('click', () => movePlayer(0, 1));
document.getElementById('btn-left').addEventListener('click', () => movePlayer(-1, 0));
document.getElementById('btn-right').addEventListener('click', () => movePlayer(1, 0));

// 添加触摸控制支持
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    event.preventDefault();
}, {passive: false});

document.addEventListener('touchmove', function(event) {
    event.preventDefault();
}, {passive: false});

document.addEventListener('touchend', function(event) {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // 确定滑动方向
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // 水平滑动
        if (diffX > 50) {
            movePlayer(1, 0); // 右滑
        } else if (diffX < -50) {
            movePlayer(-1, 0); // 左滑
        }
    } else {
        // 垂直滑动
        if (diffY > 50) {
            movePlayer(0, 1); // 下滑
        } else if (diffY < -50) {
            movePlayer(0, -1); // 上滑
        }
    }
}, {passive: false});

// 显示游戏说明
function showHelp() {
    document.getElementById('help-modal').classList.add('active');
}

// 隐藏游戏说明
function hideHelp() {
    document.getElementById('help-modal').classList.remove('active');
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    // 从localStorage加载已完成的关卡
    try {
        const savedLevels = JSON.parse(localStorage.getItem('completedLevels'));
        if (savedLevels && Array.isArray(savedLevels)) {
            completedLevels = new Set(savedLevels);
        }
    } catch (e) {
        console.error('Error loading completed levels:', e);
    }
    
    // 添加跳关按钮事件监听
    document.getElementById('level-button').addEventListener('click', showHandsomeDialog);

    // 添加"下一关"按钮事件监听
    document.getElementById('next-level').addEventListener('click', function() {
        hideMessage();
        const nextLevel = currentLevel + 1 > levels.length ? 1 : currentLevel + 1;
        initGame(nextLevel);
    });

    // 添加"返回菜单"按钮事件监听
    document.getElementById('back-to-menu').addEventListener('click', function() {
        hideMessage();
        showLevelSelect();
    });
    
    // 添加"关闭"关卡选择按钮事件监听
    document.getElementById('close-levels').addEventListener('click', function() {
        hideLevelSelect();
        // 不再默认从第一关开始，而是保持当前关卡
        // 如果当前没有选择关卡（首次进入游戏），则不执行任何操作
        if (currentLevel > 0) {
            initGame(currentLevel);
        }
    });
    
    // 添加"认输"按钮事件监听
        document.getElementById('restart-button').addEventListener('click', function() {
            initGame(currentLevel); // 重新开始当前关卡
        });
    
        // 添加重置关卡按钮
        const resetBtn = document.createElement('button');
        resetBtn.id = 'reset-level';
        resetBtn.textContent = '重置关卡';
        resetBtn.style.marginLeft = '10px';
        resetBtn.style.padding = '8px 16px';
        resetBtn.style.backgroundColor = '#ff9800';
        resetBtn.style.color = 'white';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '4px';
        resetBtn.style.cursor = 'pointer';
        resetBtn.addEventListener('click', function() {
            initGame(currentLevel); // 重新开始当前关卡
        });
        document.querySelector('.controls').appendChild(resetBtn);
    
    // 添加"游戏说明"按钮事件监听
    document.getElementById('help-button').addEventListener('click', showHelp);
    document.getElementById('close-help').addEventListener('click', hideHelp);
    
    // 直接从第一关开始
    initGame(1);
});